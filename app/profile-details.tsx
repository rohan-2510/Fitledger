import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ThemeTokens } from '../constants/ThemeTokens';
import { MaterialIcons } from '@expo/vector-icons';

// BMI color helper
const getBmiColor = (category: string): string => {
  switch (category) {
    case 'Underweight': return '#3B82F6';
    case 'Normal': return Colors.success;
    case 'Overweight': return Colors.warning;
    case 'Obese': return Colors.error;
    default: return Colors.gray;
  }
};

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

  const macros = user?.macros;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* User Details Section */}
      <Text style={styles.title}>User Details</Text>
      <Text style={styles.label}>Name: <Text style={styles.value}>{user?.name || '—'}</Text></Text>
      <Text style={styles.label}>Email: <Text style={styles.value}>{user?.email || '—'}</Text></Text>
      <View style={styles.divider} />

      {/* Profile Details Section */}
      <Text style={styles.title}>Profile Details</Text>
      <Text style={styles.label}>Height: <Text style={styles.value}>{profile?.height ? `${profile.height} cm` : '—'}</Text></Text>
      <Text style={styles.label}>Weight: <Text style={styles.value}>{profile?.weight ? `${profile.weight} kg` : '—'}</Text></Text>
      <Text style={styles.label}>Age: <Text style={styles.value}>{profile?.age || '—'}</Text></Text>
      <Text style={styles.label}>Gender: <Text style={styles.value}>{profile?.gender || '—'}</Text></Text>
      <Text style={styles.label}>Activity Level: <Text style={styles.value}>{profile?.activityLevel || '—'}</Text></Text>
      <Text style={styles.label}>Goal: <Text style={styles.value}>{profile?.goal || '—'}</Text></Text>
      <View style={styles.divider} />

      {/* Body Metrics Section */}
      {macros && macros.bmi > 0 && (
        <>
          <Text style={styles.title}>Body Metrics</Text>
          <Card style={styles.metricsCard}>
            {/* BMI Row */}
            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <MaterialIcons name="monitor-weight" size={20} color={getBmiColor(macros.bmiCategory)} />
                <Text style={styles.metricLabel}>BMI</Text>
              </View>
              <View style={styles.metricRight}>
                <Text style={styles.metricValue}>{macros.bmi}</Text>
                <View style={[styles.metricBadge, { backgroundColor: getBmiColor(macros.bmiCategory) + '20' }]}>
                  <Text style={[styles.metricBadgeText, { color: getBmiColor(macros.bmiCategory) }]}>
                    {macros.bmiCategory}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.metricDivider} />

            {/* BMR Row */}
            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <MaterialIcons name="favorite" size={20} color={Colors.error} />
                <Text style={styles.metricLabel}>BMR</Text>
              </View>
              <Text style={styles.metricValue}>{macros.bmr} kcal/day</Text>
            </View>


            {/* Recommended Exercise Row */}
            <View style={styles.metricRow}>
              <View style={styles.metricLeft}>
                <MaterialIcons name="directions-run" size={20} color={Colors.primary} />
                <Text style={styles.metricLabel}>Recommended Exercise</Text>
              </View>
              <Text style={styles.metricValue}>{macros.recommendedExerciseMin} min/day</Text>
            </View>
          </Card>
          <View style={styles.divider} />
        </>
      )}

      {/* Recommended Daily Intake */}
      <Text style={styles.title}>Recommended Daily Intake</Text>
      <Text style={styles.label}>Calories: <Text style={styles.value}>{macros?.calories ?? '—'} kcal</Text></Text>
      <Text style={styles.label}>Protein: <Text style={styles.value}>{macros?.protein ?? '—'} g</Text></Text>
      <Text style={styles.label}>Carbs: <Text style={styles.value}>{macros?.carbs ?? '—'} g</Text></Text>
      <Text style={styles.label}>Fat: <Text style={styles.value}>{macros?.fat ?? '—'} g</Text></Text>

      <Button title="Edit Profile" onPress={handleEditProfile} style={styles.actionButton} />
      <Button title="Logout" onPress={handleLogout} variant="outline" style={styles.actionButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: ThemeTokens.spacing.xl,
    paddingBottom: ThemeTokens.spacing.xl * 3,
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
  actionButton: {
    marginTop: ThemeTokens.spacing.md,
  },

  // Body Metrics Card
  metricsCard: {
    padding: ThemeTokens.spacing.lg,
    marginBottom: 0,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  metricBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  metricBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
