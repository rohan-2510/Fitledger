import { calcMacros } from '@/hooks/use-calc-macros';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../utils/firebase'; // Import Firebase auth and db

export type User = {
  id?: string; // Change to string for Firebase UID
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
  macros?: { calories: number; protein: number; carbs: number; fat: number; };
  monthly_budget?: number;
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
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  saveProfile: (details: ProfileDetails) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  dashboardRefreshKey: number;
  triggerDashboardRefresh: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] Auth state changed. User:', firebaseUser ? firebaseUser.uid : null);
      if (firebaseUser) {
        console.log('[AuthContext] Firebase user logged in:', firebaseUser.uid);
        console.log('[AuthContext] User email:', firebaseUser.email);
        // Fetch user data from Firestore
        await loadUserProfile(firebaseUser.uid);
      } else {
        console.log('[AuthContext] No Firebase user logged in.');
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });
    return () => {
      console.log('[AuthContext] Cleaning up auth state listener...');
      unsubscribe();
    };
  }, []);

  const loadUserProfile = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isProfileComplete = !!(userData.height_cm && userData.weight_kg && userData.age && userData.gender);
        console.log("---------------------------------",userData)
        //check if macros are calculated or else calc and store in db
        let macros;
        if(userData?.macros){
          macros = userData?.macros;
        }else{
          macros = calcMacros(userData)
          await updateDoc(userDocRef, { macros });
        }
        setUser({
          id: uid,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name,
          name: userData.full_name || userData.username,
          profileCompleted: isProfileComplete,
          height_cm: userData.height_cm,
          weight_kg: userData.weight_kg,
          age: userData.age,
          goal: userData.goal,
          activity_level: userData.activity_level,
          profile_image_url: userData.profile_image_url,
          gender: userData.gender,
          // Ensure macros object has default values if null/undefined
          macros: macros || { calories: 0, protein: 0, carbs: 0, fat: 0 }, 
          monthly_budget: userData.monthly_budget, 
        });
        setProfile({
          height: userData.height_cm?.toString(),
          weight: userData.weight_kg?.toString(),
          age: userData.age?.toString(),
          activityLevel: userData.activity_level,
          goal: userData.goal,
          gender: userData.gender,
        });
      } else {
        console.warn('User profile not found in Firestore for UID:', uid);
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile from Firestore:', error);
      setUser(null);
      setProfile(null);
    }
  };

  const refreshUser = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      await loadUserProfile(firebaseUser.uid);
    } else {
      setUser(null);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('Firebase Sign In successful:', firebaseUser.uid);
      await loadUserProfile(firebaseUser.uid);
      return { success: true };
    } catch (error: any) {
      console.error('Firebase Sign In error:', error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, username?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const generatedUsername = username || email.split('@')[0];

      // Store additional user data in Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        username: generatedUsername,
        email: email,
        full_name: name,
        age: null,
        height_cm: null,
        weight_kg: null,
        bodyfat_percent: null,
        goal: 'maintain',
        activity_level: 'sedentary',
        gender: null,
        monthly_budget: 0.0,
      });
      console.log('Firebase Sign Up successful and profile created:', firebaseUser.uid);
      await loadUserProfile(firebaseUser.uid);
      return { success: true };
    } catch (error: any) {
      console.error('Firebase Sign Up error:', error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Signing out from Firebase...');
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      console.log('AuthContext: User and profile state cleared.');
      triggerDashboardRefresh();
    } catch (error) {
      console.error('Firebase Sign Out error:', error);
    }
  };

  const saveProfile = async (details: ProfileDetails): Promise<{ success: boolean; error?: string }> => {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        return { success: false, error: 'User not authenticated.' };
      }

      const updateData: any = {};
      if (details.height) updateData.height_cm = parseFloat(details.height);
      if (details.weight) updateData.weight_kg = parseFloat(details.weight);
      if (details.age) updateData.age = parseInt(details.age);
      if (details.activityLevel) updateData.activity_level = details.activityLevel.toLowerCase();
      if (details.goal) {
        if (details.goal.toLowerCase().includes('lose') || details.goal.toLowerCase().includes('cut')) {
          updateData.goal = 'cut';
        } else if (details.goal.toLowerCase().includes('gain') || details.goal.toLowerCase().includes('bulk')) {
          updateData.goal = 'bulk';
        } else {
          updateData.goal = 'maintain';
        }
      }
      if (details.gender) updateData.gender = details.gender;

      // Recalculate macros if relevant data has changed
      const hasRelevantChange = details.height || details.weight || details.age || details.activityLevel || details.goal || details.gender;

      if (hasRelevantChange) {
        console.log('[AuthContext] Profile details changed, recalculating macros...');
        const userDataForCalc = {
          ...user,
          ...updateData
        };
        const newMacros = calcMacros(userDataForCalc);
        updateData.macros = newMacros;
      }

      // Update Firestore document directly
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userDocRef, updateData);

      await refreshUser(); // Refresh local user state from Firestore
      console.log('Save Profile: User profile updated in Firestore and state refreshed.');
      return { success: true };
    } catch (error: any) {
      console.error('Save profile error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const triggerDashboardRefresh = () => {
    setDashboardRefreshKey(prev => prev + 1);
  };

  const value = useMemo(
    () => ({ user, profile, isLoggedIn: !!user, isLoading, signIn, signUp, signOut, saveProfile, refreshUser, dashboardRefreshKey, triggerDashboardRefresh }),
    [user, profile, isLoading, dashboardRefreshKey]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
