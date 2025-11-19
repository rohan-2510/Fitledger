import React, { createContext, useContext, useMemo, useState } from 'react';

export type User = {
  email: string;
  name?: string;
  profileCompleted?: boolean;
};

export type ProfileDetails = {
  height?: string;
  weight?: string;
  age?: string;
  activityLevel?: string;
  goal?: string;
};

type AuthContextValue = {
  user: User | null;
  profile: ProfileDetails | null;
  isLoggedIn: boolean;
  signIn: (email: string, name?: string) => void;
  signOut: () => void;
  saveProfile: (details: ProfileDetails) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileDetails | null>(null);

  const signIn = (email: string, name?: string) => {
    setUser({ email, name, profileCompleted: !!profile });
  };

  const signOut = () => {
    setUser(null);
    setProfile(null);
  };

  const saveProfile = (details: ProfileDetails) => {
    setProfile(details);
    setUser((prev) => (prev ? { ...prev, profileCompleted: true } : prev));
  };

  const value = useMemo(
    () => ({ user, profile, isLoggedIn: !!user, signIn, signOut, saveProfile }),
    [user, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
