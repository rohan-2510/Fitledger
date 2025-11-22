import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Use localhost for web, or get from environment/expo config
// For mobile devices, use your computer's IP address (e.g., http://192.168.1.100:8000/api)
// You can set EXPO_PUBLIC_API_URL environment variable or modify this value
const getApiBase = () => {
  // Check if we have an environment variable set
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }
  // For web, use localhost
  if (typeof window !== 'undefined') {
    return 'http://localhost:8000/api';
  }
  // For mobile devices, you'll need to set this to your computer's IP
  // Example: 'http://192.168.1.100:8000/api'
  // You can also use ngrok or similar tunneling service for development
  return 'http://localhost:8000/api';
};

const API_BASE = getApiBase();

// Platform-specific storage helpers
// Use SecureStore for native, localStorage for web
const isWeb = Platform.OS === 'web';

const getSecureItem = async (key: string): Promise<string | null> => {
  console.log(`Storage: Attempting to get item '${key}' (isWeb: ${isWeb})`);
  try {
    if (isWeb) {
      const item = localStorage.getItem(key);
      console.log(`Storage: localStorage.getItem('${key}') returned:`, item ? 'Token Found' : 'No Token');
      return item;
    } else {
      const item = await SecureStore.getItemAsync(key);
      console.log(`Storage: SecureStore.getItemAsync('${key}') returned:`, item ? 'Token Found' : 'No Token');
      return item;
    }
  } catch (error) {
    console.error('Storage: Error getting item from primary store:', error);
    // Fallback to localStorage on error for native
    if (!isWeb) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const item = localStorage.getItem(key);
          console.log(`Storage: Fallback localStorage.getItem('${key}') returned:`, item ? 'Token Found' : 'No Token');
          return item;
        }
      } catch (e) {
        console.error('Storage: Error getting item from fallback localStorage:', e);
      }
    }
    return null;
  }
};

const setSecureItem = async (key: string, value: string): Promise<void> => {
  console.log(`Storage: Attempting to set item '${key}' (isWeb: ${isWeb})`);
  try {
    if (isWeb) {
      localStorage.setItem(key, value);
      console.log(`Storage: localStorage.setItem('${key}') successful.`);
    } else {
      await SecureStore.setItemAsync(key, value);
      console.log(`Storage: SecureStore.setItemAsync('${key}') successful.`);
    }
  } catch (error) {
    console.error('Storage: Error setting item to primary store:', error);
    // Fallback to localStorage on error for native
    if (!isWeb) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(key, value);
          console.log(`Storage: Fallback localStorage.setItem('${key}') successful.`);
        }
      } catch (e) {
        console.error('Storage: Error setting item to fallback localStorage:', e);
        throw error; // Re-throw original error if fallback also fails
      }
    }
  }
};

const removeSecureItem = async (key: string): Promise<void> => {
  console.log(`Storage: Attempting to remove item '${key}' (isWeb: ${isWeb})`);
  try {
    if (isWeb) {
      localStorage.removeItem(key);
      console.log(`Storage: localStorage.removeItem('${key}') successful.`);
    } else {
      await SecureStore.deleteItemAsync(key);
      console.log(`Storage: SecureStore.deleteItemAsync('${key}') successful.`);
    }
  } catch (error) {
    console.error('Storage: Error removing item from primary store:', error);
    // Fallback to localStorage on error for native
    if (!isWeb) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(key);
          console.log(`Storage: Fallback localStorage.removeItem('${key}') successful.`);
        }
      } catch (e) {
        console.error('Storage: Error removing item from fallback localStorage:', e);
      }
    }
  }
};

// Refresh token helper
const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await getSecureItem('refreshToken');
    if (!refreshToken) {
      return false;
    }
    const response = await axios.post(`${API_BASE}/auth/token/refresh/`, {
      refresh: refreshToken,
    });
    if (response.data.access) {
      await setSecureItem('authToken', response.data.access);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    await removeSecureItem('authToken');
    await removeSecureItem('refreshToken');
    return false;
  }
};

// Create a simple wrapper around axios that adds the auth token
const api = async <T = any>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  endpoint: string,
  data?: any
): Promise<T> => {
  let token;
  try {
    token = await getSecureItem('authToken');
    // Don't log sensitive data
    const safeData = data && typeof data === 'object' && 'password' in data 
      ? { ...data, password: '***' } 
      : data;
    console.log('API call started:', { method, endpoint, data: safeData });
    console.log('Retrieved token:', token ? 'Token exists' : 'No token found');
  } catch (error) {
    console.error('Error in getSecureItem:', error);
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

    console.log('API Response:', {
      status: response.status,
      url,
      method,
      data: response.data,
    });

    return response.data;
  } catch (error: any) {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });
    
    // If unauthorized, try to refresh token
    if (error.response?.status === 401 && method !== 'post') {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
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
            return retryResponse.data;
          }
        } catch (retryError) {
          console.error('Retry after refresh failed:', retryError);
        }
      }
      // If refresh failed, clear tokens
      await removeSecureItem('authToken');
      await removeSecureItem('refreshToken');
    }
    
    throw error;
  }
};

const apiClient = {
  get: <T = any>(endpoint: string) => api<T>('get', endpoint),
  post: <T = any>(endpoint: string, data?: any) => api<T>('post', endpoint, data),
  put: <T = any>(endpoint: string, data?: any) => api<T>('put', endpoint, data),
  patch: <T = any>(endpoint: string, data?: any) => api<T>('patch', endpoint, data),
  delete: <T = any>(endpoint: string) => api<T>('delete', endpoint),
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
};

export default apiClient;