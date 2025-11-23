import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import apiClient from '../app/api/apiClient';
import * as SecureStore from 'expo-secure-store';

export type User = {
  id?: number;
  email: string;
  username?: string;
  full_name?: string;
  name?: string;
  profileCompleted?: boolean;
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  goal?: string;
  activity_level?: string;
  profile_image_url?: string;
  gender?: string;
  macros?: { calories: number; protein: number; carbs: number; fat: number; }; // Add this line
  monthly_budget?: number; // Add this line
};

export type ProfileDetails = {
  height?: string;
  weight?: string;
  age?: string;
  activityLevel?: string;
  goal?: string;
  profile_image_url?: string;
  gender?: string;
};

type AuthContextValue = {
  user: User | null;
  profile: ProfileDetails | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  saveProfile: (details: ProfileDetails) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  dashboardRefreshKey: number; // Add this line
  triggerDashboardRefresh: () => void; // Add this line
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0); // Add this line
  const [initialLoad, setInitialLoad] = useState(true); // New state to track initial load

  // Load user from token on mount
  useEffect(() => {
    loadUserFromToken();
  }, []);

  const loadUserFromToken = async () => {
    try {
      // Ensure API_BASE is initialized before any API calls
      await apiClient.ensureApiBaseInitialized();
      console.log('[AuthContext] API Base ensured. Attempting to load tokens...');
      const token = await apiClient.getAuthToken(); // Use apiClient's helper
      if (token) {
        console.log('[AuthContext] Auth token found. Refreshing user...');
        await refreshUser();
      } else {
        console.log('[AuthContext] No auth token found.');
      }
    } catch (error) {
      console.error('[AuthContext] Error loading user from token:', error);
    } finally {
      setInitialLoad(false); // Mark initial load complete
      setIsLoading(false); // Set isLoading to false after initial attempt
    }
  };

  const refreshUser = async () => {
    try {
      // UserViewSet.list() returns a single user object (the current user)
      const userData = await apiClient.get('/users/');
      
      if (userData && typeof userData === 'object') {
        const user = userData as any;

        // Determine profile completion status
        const isProfileComplete = !!(user.height_cm && user.weight_kg && user.age && user.gender); // Add user.gender

        console.log('Refresh User: User data from API:', userData);
        setUser({
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          name: user.full_name || user.username,
          profileCompleted: isProfileComplete, // Use the determined status
          height_cm: user.height_cm,
          weight_kg: user.weight_kg,
          age: user.age,
          goal: user.goal,
          activity_level: user.activity_level,
          profile_image_url: user.profile_image_url,
          gender: user.gender,
          macros: user.macros, // Add this line to set macros
          monthly_budget: user.monthly_budget, // Add this line
        });
        console.log('Refresh User: User state set to:', user);
        if (user.height_cm || user.weight_kg || user.age) {
          setProfile({
            height: user.height_cm?.toString(),
            weight: user.weight_kg?.toString(),
            age: user.age?.toString(),
            activityLevel: user.activity_level,
            goal: user.goal,
            gender: user.gender,
          });
        }
      } else {
        console.warn('Refresh User: userData is null or not an object:', userData);
      }
    } catch (error: any) {
      console.error('Error refreshing user:', error.response?.data || error.message);
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        console.log('[AuthContext] 401 on refreshUser. Signing out...');
        await signOut();
      }
    } finally {
      // Only set isLoading to false if the initial load is complete
      if (!initialLoad) {
        setIsLoading(false);
      }
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Ensure API_BASE is initialized before sign-in attempt
      await apiClient.ensureApiBaseInitialized();
      console.log('[AuthContext] Signing in...');
      const attemptLogin = async (identifier: string) => {
        const response = await apiClient.post('/auth/token/', {
          username: identifier,
          password: password,
        });
        return response;
      };

      let response;
      let loginIdentifier = email; // First attempt: use email as username

      try {
        response = await attemptLogin(loginIdentifier);
      } catch (error: any) {
        // If first attempt fails with 'No active account', try with username from email
        const errorMessage = error.response?.data?.detail || '';
        if (errorMessage.includes('No active account') || errorMessage.includes('credentials')) {
          loginIdentifier = email.split('@')[0]; // Second attempt: use username from email
          console.log('Sign in failed with email, retrying with username:', loginIdentifier);
          response = await attemptLogin(loginIdentifier);
        } else {
          throw error; // Re-throw if it's a different error
        }
      }

      // apiClient.post returns the data directly, not wrapped in .data
      if (response && response.access && response.refresh) {
        await apiClient.setAuthToken(response.access);
        await apiClient.setRefreshToken(response.refresh);
        await refreshUser();
        console.log('Sign In: User state after refresh (success):', user);
        return { success: true };
      }
      console.error('Invalid token response from server during sign in:', response);
      return { success: false, error: 'Invalid response from server' };
    } catch (error: any) {
      console.error('Sign in error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, name: string, username?: string): Promise<{ success: boolean; error?: string }> => {
    let createdUsername: string | undefined;
    let userResponse: any; // Declare outside try block for catch access
    
    try {
      const generatedUsername = username || email.split('@')[0];
      
      // First create the user
      userResponse = await apiClient.post('/users/register/', {
        email,
        password,
        username: generatedUsername,
        full_name: name,
      });

      // Extract the actual username from the response (backend might modify it)
      createdUsername = userResponse.username || generatedUsername;
      
      console.log('Registration successful, attempting login with username:', createdUsername);
      console.log('User registration response:', userResponse);

      // Then login to get tokens using the actual username
      // Add a small delay to ensure user is fully created
      await new Promise(resolve => setTimeout(resolve, 300)); // Increased delay
      
      const loginResponse = await apiClient.post<TokenResponse>('/auth/token/', {
        username: createdUsername,  // Use the username from registration response
        password: password,
      });
      
      console.log('Login response received:', loginResponse);

      // apiClient.post returns the data directly, not wrapped in .data
      
      if (loginResponse && loginResponse.access && loginResponse.refresh) {
        console.log('Tokens received, storing...');
        await apiClient.setAuthToken(loginResponse.access);
        await apiClient.setRefreshToken(loginResponse.refresh);

        // Fetch user profile
        await refreshUser();
        console.log('Sign Up: User state after refresh (success):', user);
        return { success: true };
      }
      
      console.error('Invalid token response structure:', loginResponse);
      return { success: false, error: 'Registration successful but login failed - invalid token response structure' };
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Handle registration error
      if (error.response?.status === 400 && error.response?.data) {
        const data = error.response.data;
        const errorMessage = data.detail || data.message || data.email?.[0] || data.username?.[0] || 'Registration failed';
        return { success: false, error: errorMessage };
      }
      
      // Handle token login error
      if (error.response?.status === 401) {
        const errorDetail = error.response?.data?.detail || error.response?.data?.message || '';
        console.error('Token login failed after registration:', {
          status: 401,
          detail: errorDetail,
          attemptedUsername: createdUsername,
        });
        return { 
          success: false, 
          error: errorDetail || (createdUsername ? `Registration successful but login failed. Please try logging in manually with username: ${createdUsername}` : 'Registration successful but login failed. Please try logging in manually.')
        };
      }
      
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Signing out and clearing tokens...');
      console.trace('SignOut call stack:');
      await apiClient.clearTokens();
    setUser(null);
    setProfile(null);
      // Additional logic to clear other app-wide states can be added here if needed
      console.log('AuthContext: User and profile state cleared.');
      triggerDashboardRefresh(); // Trigger dashboard refresh on signOut
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const saveProfile = async (details: ProfileDetails): Promise<{ success: boolean; error?: string }> => {
    try {
      // Update user profile via API using /me/ endpoint
      const updateData: any = {};
      if (details.height) updateData.height_cm = parseFloat(details.height);
      if (details.weight) updateData.weight_kg = parseFloat(details.weight);
      if (details.age) updateData.age = parseInt(details.age);
      if (details.activityLevel) updateData.activity_level = details.activityLevel.toLowerCase();
      if (details.goal) {
        // Map goal to backend format
        if (details.goal.toLowerCase().includes('lose') || details.goal.toLowerCase().includes('cut')) {
          updateData.goal = 'cut';
        } else if (details.goal.toLowerCase().includes('gain') || details.goal.toLowerCase().includes('bulk')) {
          updateData.goal = 'bulk';
        } else {
          updateData.goal = 'maintain';
        }
      }
      if (details.gender) updateData.gender = details.gender; // Add this line

      // Use the /me/ custom action endpoint which always updates the current user
      await apiClient.patch('/users/me/', updateData);
      
      // Update local state
    setProfile(details);
      await refreshUser();
      console.log('Save Profile: User state after refresh (success):', user);
      return { success: true };
    } catch (error: any) {
      console.error('Save profile error:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to save profile';
      return { success: false, error: errorMessage };
    }
  };

  const triggerDashboardRefresh = () => {
    setDashboardRefreshKey(prev => prev + 1);
  }; // Add this function

  const value = useMemo(
    () => ({ user, profile, isLoggedIn: !!user, isLoading: isLoading || initialLoad, signIn, signUp, signOut, saveProfile, refreshUser, dashboardRefreshKey, triggerDashboardRefresh }), // Update isLoading to consider initialLoad
    [user, profile, isLoading, dashboardRefreshKey, initialLoad] // Update dependencies
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
