// import axios from 'axios';
// import * as SecureStore from 'expo-secure-store';
// import Constants from 'expo-constants';
// import * as Network from 'expo-network';
// import { Platform } from 'react-native';
// import { auth } from '../../utils/firebase'; // Import Firebase auth

// const getApiBase = async () => {
//   if (Constants.expoConfig?.extra?.apiUrl) {
//     return Constants.expoConfig.extra.apiUrl;
//   }
//   if (typeof window !== 'undefined') {
//     return 'http://localhost:8000/api';
//   }
//   try {
//     const ipAddress = await Network.getIpAddressAsync();
//     return `http://${ipAddress}:8000/api`;
//   } catch (error) {
//     console.error('getApiBase: Error getting IP address, falling back to localhost:', error);
//     return 'http://localhost:8000/api';
//   }
// };

// let API_BASE: string;
// let apiBaseInitialized = false;

// const ensureApiBaseInitialized = async () => {
//   if (!apiBaseInitialized) {
//     API_BASE = await getApiBase();
//     apiBaseInitialized = true;
//     console.log('API_BASE initialized to:', API_BASE);
//   }
// };

// ensureApiBaseInitialized();

// const isWeb = Platform.OS === 'web';

// // Simplified storage operations as Firebase handles token storage
// const getSecureItem = async (key: string): Promise<string | null> => {
//   if (isWeb) {
//     return localStorage.getItem(key);
//   } else {
//     return await SecureStore.getItemAsync(key);
//   }
// };

// const setSecureItem = async (key: string, value: string): Promise<void> => {
//   if (isWeb) {
//     localStorage.setItem(key, value);
//   } else {
//     await SecureStore.setItemAsync(key, value);
//   }
// };

// const removeSecureItem = async (key: string): Promise<void> => {
//   if (isWeb) {
//     localStorage.removeItem(key);
//   } else {
//     await SecureStore.deleteItemAsync(key);
//   }
// };


// const api = async <T = any>(
//   method: 'get' | 'post' | 'put' | 'patch' | 'delete',
//   endpoint: string,
//   data?: any,
// ): Promise<T> => {
//   let idToken: string | null = null;
//   try {
//     const firebaseUser = auth.currentUser;
//     if (firebaseUser) {
//       idToken = await firebaseUser.getIdToken();
//     }
//     const safeData = data && typeof data === 'object' && 'password' in data 
//       ? { ...data, password: '***' } 
//       : data;
//     console.log('[API] Call started:', { method, endpoint, data: safeData });
//     console.log('[API] Firebase ID Token:', idToken ? 'Token exists' : 'No token found');
//   } catch (error) {
//     console.error('[API] Error getting Firebase ID Token:', error);
//   }
  
//   const url = `${API_BASE}${endpoint}`;
//   const headers: Record<string, string> = {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   };

//   if (idToken) {
//     headers['Authorization'] = `Bearer ${idToken}`;
//   }

//   try {
//     const response = await axios({
//       method,
//       url,
//       data,
//       headers,
//       timeout: 10000,
//     });

//     console.log('[API] Response:', {
//       status: response.status,
//       url,
//       method,
//       data: response.data,
//     });

//     return response.data;
//   } catch (error: any) {
//     console.error('[API] Error:', {
//       message: error.message,
//       status: error.response?.status,
//       url: error.config?.url,
//       method: error.config?.method,
//       data: error.response?.data,
//     });
//     throw error;
//   }
// };

// const apiClient = {
//   get: <T = any>(endpoint: string) => api<T>('get', endpoint),
//   post: <T = any>(endpoint: string, data?: any) => api<T>('post', endpoint, data),
//   put: <T = any>(endpoint: string, data?: any) => api<T>('put', endpoint, data),
//   patch: <T = any>(endpoint: string, data?: any) => api<T>('patch', endpoint, data),
//   delete: <T = any>(endpoint: string) => api<T>('delete', endpoint),
  
//   // Token management methods are largely simplified/removed as Firebase handles them
//   setAuthToken: async (token: string) => { console.warn('setAuthToken is deprecated with Firebase Auth'); },
//   setRefreshToken: async (token: string) => { console.warn('setRefreshToken is deprecated with Firebase Auth'); },
//   clearTokens: async () => {
//     await removeSecureItem('authToken'); // Clear any legacy tokens
//     await removeSecureItem('refreshToken'); // Clear any legacy tokens
//   },
//   getAuthToken: async () => { console.warn('getAuthToken is deprecated with Firebase Auth'); return null; },
//   getRefreshToken: async () => { console.warn('getRefreshToken is deprecated with Firebase Auth'); return null; },
//   // refreshAuthToken is removed
//   ensureApiBaseInitialized,
// };

// export default apiClient;