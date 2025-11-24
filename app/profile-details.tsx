import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../components/Button';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ThemeTokens } from '../constants/ThemeTokens';

export default function ProfileDetailsScreen() {
  const router = useRouter();
  const { user, profile, isLoggedIn, signOut } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, router]);

  const handleLogout = () => {
    signOut();
    router.replace('/(tabs)');
  };

  const handleEditProfile = () => {
    router.push('/complete-profile');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Details</Text>
      <Text style={styles.label}>Name: <Text style={styles.value}>{user?.name || '—'}</Text></Text>
      <Text style={styles.label}>Email: <Text style={styles.value}>{user?.email || '—'}</Text></Text>
      <View style={styles.divider} />
      <Text style={styles.title}>Profile Details</Text>
      <Text style={styles.label}>Height: <Text style={styles.value}>{profile?.height ? `${profile.height} cm` : '—'}</Text></Text>
      <Text style={styles.label}>Weight: <Text style={styles.value}>{profile?.weight ? `${profile.weight} kg` : '—'}</Text></Text>
      <Text style={styles.label}>Age: <Text style={styles.value}>{profile?.age || '—'}</Text></Text>
      <Text style={styles.label}>Gender: <Text style={styles.value}>{profile?.gender || '—'}</Text></Text>
      <Text style={styles.label}>Activity Level: <Text style={styles.value}>{profile?.activityLevel || '—'}</Text></Text>
      <Text style={styles.label}>Goal: <Text style={styles.value}>{profile?.goal || '—'}</Text></Text>
      <View style={styles.divider} />

      <Text style={styles.title}>Recommended Daily Intake</Text>
      <Text style={styles.label}>Calories: <Text style={styles.value}>{user?.macros?.calories ?? '—'} kcal</Text></Text>
      <Text style={styles.label}>Protein: <Text style={styles.value}>{user?.macros?.protein ?? '—'} g</Text></Text>
      <Text style={styles.label}>Carbs: <Text style={styles.value}>{user?.macros?.carbs ?? '—'} g</Text></Text>
      <Text style={styles.label}>Fat: <Text style={styles.value}>{user?.macros?.fat ?? '—'} g</Text></Text>
      <Button title="Edit Profile" onPress={handleEditProfile} style={styles.logoutButton} />
      <Button title="Logout" onPress={handleLogout} style={styles.logoutButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: ThemeTokens.spacing.xl,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: ThemeTokens.typography.title,
    fontWeight: '800',
    marginBottom: ThemeTokens.spacing.md,
    color: Colors.primary,
  },
  label: {
    fontSize: 16,
    marginBottom: ThemeTokens.spacing.xs,
    color: Colors.text,
  },
  value: {
    fontWeight: '600',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: ThemeTokens.spacing.lg,
  },
  logoutButton: {
    marginTop: ThemeTokens.spacing.xl * 2,
  },
});
