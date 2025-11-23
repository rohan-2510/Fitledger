import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import * as Network from 'expo-network'; // Import Network
import { Platform } from 'react-native';

// Use localhost for web, or get from environment/expo config
// For mobile devices, use your computer's IP address (e.g., http://192.168.1.100:8000/api)
// You can set EXPO_PUBLIC_API_URL environment variable or modify this value
const getApiBase = async () => {
  console.log('getApiBase: Platform.OS', Platform.OS);
  console.log('getApiBase: typeof window !== \'undefined\'', typeof window !== 'undefined');

  // Check if we have an environment variable set
  if (Constants.expoConfig?.extra?.apiUrl) {
    console.log('getApiBase: Using apiUrl from Constants.expoConfig.extra', Constants.expoConfig.extra.apiUrl);
    return Constants.expoConfig.extra.apiUrl;
  }

  // For web, use localhost
  if (typeof window !== 'undefined') {
    console.log('getApiBase: Detected web environment, using localhost');
    return 'http://localhost:8000/api';
  }

  // For mobile devices, dynamically get the IP address
  try {
    const ipAddress = await Network.getIpAddressAsync();
    console.log('getApiBase: Detected IP Address:', ipAddress);
    return `http://${ipAddress}:8000/api`;
  } catch (error) {
    console.error('getApiBase: Error getting IP address, falling back to localhost:', error);
    return 'http://localhost:8000/api';
  }
};

let API_BASE: string;
let apiBaseInitialized = false; // Add this flag

// Initialize API_BASE when the module loads
const ensureApiBaseInitialized = async () => {
  if (!apiBaseInitialized) {
    API_BASE = await getApiBase();
    apiBaseInitialized = true;
    console.log('API_BASE initialized to:', API_BASE);
  }
};

// Call immediately to start initialization
ensureApiBaseInitialized();

// Platform-specific storage helpers
// Use SecureStore for native, localStorage for web
const isWeb = Platform.OS === 'web';

const getSecureItem = async (key: string): Promise<string | null> => {
  console.log(`[Storage] Attempting to get item '${key}' (isWeb: ${isWeb})`);
  try {
    if (isWeb) {
      const item = localStorage.getItem(key);
      console.log(`[Storage] localStorage.getItem('${key}') returned:`, item ? 'Token Found' : 'No Token');
      return item;
    } else {
      const item = await SecureStore.getItemAsync(key);
      console.log(`[Storage] SecureStore.getItemAsync('${key}') returned:`, item ? 'Token Found' : 'No Token');
      return item;
    }
  } catch (error) {
    console.error(`[Storage] Error getting item '${key}' from primary store:`, error);
    // Fallback to localStorage on error for native
    if (!isWeb) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const item = localStorage.getItem(key);
          console.log(`[Storage] Fallback localStorage.getItem('${key}') returned:`, item ? 'Token Found' : 'No Token');
          return item;
        }
      } catch (e) {
        console.error(`[Storage] Error getting item '${key}' from fallback localStorage:`, e);
      }
    }
    return null;
  }
};

const setSecureItem = async (key: string, value: string): Promise<void> => {
  console.log(`[Storage] Attempting to set item '${key}' (isWeb: ${isWeb})`);
  try {
    if (isWeb) {
      localStorage.setItem(key, value);
      console.log(`[Storage] localStorage.setItem('${key}') successful.`);
    } else {
      await SecureStore.setItemAsync(key, value);
      console.log(`[Storage] SecureStore.setItemAsync('${key}') successful.`);
    }
  } catch (error) {
    console.error(`[Storage] Error setting item '${key}' to primary store:`, error);
    // Fallback to localStorage on error for native
    if (!isWeb) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(key, value);
          console.log(`[Storage] Fallback localStorage.setItem('${key}') successful.`);
        }
      } catch (e) {
        console.error(`[Storage] Error setting item '${key}' to fallback localStorage:`, e);
        throw error; // Re-throw original error if fallback also fails
      }
    }
  }
};

const removeSecureItem = async (key: string): Promise<void> => {
  console.log(`[Storage] Attempting to remove item '${key}' (isWeb: ${isWeb})`);
  try {
    if (isWeb) {
      localStorage.removeItem(key);
      console.log(`[Storage] localStorage.removeItem('${key}') successful.`);
    } else {
      await SecureStore.deleteItemAsync(key);
      console.log(`[Storage] SecureStore.deleteItemAsync('${key}') successful.`);
    }
  } catch (error) {
    console.error(`[Storage] Error removing item '${key}' from primary store:`, error);
    // Fallback to localStorage on error for native
    if (!isWeb) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(key);
          console.log(`[Storage] Fallback localStorage.removeItem('${key}') successful.`);
        }
      } catch (e) {
        console.error(`[Storage] Error removing item '${key}' from fallback localStorage:`, e);
      }
    }
  }
};

interface TokenResponse {
  access: string;
  refresh: string;
}

// Refresh token helper
const refreshAuthToken = async (): Promise<boolean> => {
  console.log('[Auth] Attempting token refresh...');
  try {
    const refreshToken = await getSecureItem('refreshToken');
    if (!refreshToken) {
      console.log('[Auth] No refresh token found. Cannot refresh.');
      return false;
    }
    console.log('[Auth] Refresh token found, sending to backend...');
    const response = await axios.post(`${API_BASE}/auth/token/refresh/`, {
      refresh: refreshToken,
    });
    if ((response.data as TokenResponse).access) {
      console.log('[Auth] New access token received. Storing...');
      await setSecureItem('authToken', (response.data as TokenResponse).access);
      console.log('[Auth] Access token stored. Refresh successful.');
      return true;
    }
    // If access token is not in response, something is wrong, clear all tokens
    console.warn('[Auth] Refresh response missing access token. Clearing all tokens.');
    await removeSecureItem('authToken');
    await removeSecureItem('refreshToken');
    return false;
  } catch (error) {
    console.error('[Auth] Token refresh failed:', error);
    // Explicitly remove both tokens on any refresh failure
    console.log('[Auth] Clearing all tokens due to refresh failure.');
    await removeSecureItem('authToken');
    await removeSecureItem('refreshToken');
    return false;
  }
};

// Create a simple wrapper around axios that adds the auth token
const api = async <T = any>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  endpoint: string,
  data?: any,
  skipAuthRefresh: boolean = false // New parameter
): Promise<T> => {
  let token;
  try {
    token = await getSecureItem('authToken');
    // Don't log sensitive data
    const safeData = data && typeof data === 'object' && 'password' in data 
      ? { ...data, password: '***' } 
      : data;
    console.log('[API] Call started:', { method, endpoint, data: safeData });
    console.log('[API] Retrieved token:', token ? 'Token exists' : 'No token found');
  } catch (error) {
    console.error('[API] Error in getSecureItem:', error);
    // Don't throw here to allow the app to continue
    token = null;
  }
  
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
      timeout: 10000,
    });

    console.log('[API] Response:', {
      status: response.status,
      url,
      method,
      data: response.data,
    });

    return response.data;
  } catch (error: any) {
    console.error('[API] Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });
    
    // If unauthorized and skipAuthRefresh is false, try to refresh token
    if (error.response?.status === 401 && !skipAuthRefresh && method !== 'post') {
      console.log('[API] 401 Unauthorized. Attempting token refresh and retry...');
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        console.log('[API] Token refreshed successfully. Retrying original request...');
        // Retry the original request after refreshing
        try {
          const newToken = await getSecureItem('authToken');
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await axios({
              method,
              url,
              data,
              headers,
              timeout: 10000,
            });
            console.log('[API] Original request retried successfully.', retryResponse.status);
            return retryResponse.data;
          }
        } catch (retryError) {
          console.error('[API] Retry after refresh failed:', retryError);
        }
      }
      console.log('[API] Token refresh failed or not attempted. Clearing tokens and throwing original error.');
      // If refresh failed or was not attempted, clear tokens
      await removeSecureItem('authToken');
      await removeSecureItem('refreshToken');
    }
    
    throw error;
  }
};

const apiClient = {
  get: <T = any>(endpoint: string, skipAuthRefresh: boolean = false) => api<T>('get', endpoint, undefined, skipAuthRefresh),
  post: <T = any>(endpoint: string, data?: any, skipAuthRefresh: boolean = false) => api<T>('post', endpoint, data, skipAuthRefresh),
  put: <T = any>(endpoint: string, data?: any, skipAuthRefresh: boolean = false) => api<T>('put', endpoint, data, skipAuthRefresh),
  patch: <T = any>(endpoint: string, data?: any, skipAuthRefresh: boolean = false) => api<T>('patch', endpoint, data, skipAuthRefresh),
  delete: <T = any>(endpoint: string, skipAuthRefresh: boolean = false) => api<T>('delete', endpoint, undefined, skipAuthRefresh),
  // Helper methods for token management
  setAuthToken: async (token: string) => {
    await setSecureItem('authToken', token);
  },
  setRefreshToken: async (token: string) => {
    await setSecureItem('refreshToken', token);
  },
  clearTokens: async () => {
    await removeSecureItem('authToken');
    await removeSecureItem('refreshToken');
  },
  getAuthToken: async () => {
    return await getSecureItem('authToken');
  },
  getRefreshToken: async () => {
    return await getSecureItem('refreshToken');
  },
  // Refresh token helper
  refreshAuthToken,
  ensureApiBaseInitialized, // Expose the new function
};

export default apiClient;