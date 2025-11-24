import { db } from '@/utils/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ProfileImageDisplay } from '../../components/ProfileImageDisplay';
import { ProfileModal } from '../../components/ProfileModal';
import { Colors } from '../../constants/Colors';
import { ThemeTokens } from '../../constants/ThemeTokens';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../api/apiClient';

interface MealLog {
  id: number;
  custom_name: string;
  calories: number;
  date: string;
}

interface ExpenseItem {
  id: number;
  description: string;
  category: string;
  amount: number;
  date: string; // ISO date string
}

interface WorkoutLog {
  id: string;
  exercise: string;
  sets?: number;
  reps?: string;
  weight?: number;
  duration_min?: number;
  timestamp: string;
}

// Daily fitness tips
const fitnessTips = [
  "💪 Stay hydrated! Drink at least 8 glasses of water daily.",
  "🏃‍♂️ Add 10 minutes to your cardio routine for extra endurance.",
  "🥚 Protein within 30 minutes after workout helps muscle recovery.",
  "😴 Get 7-9 hours of quality sleep for optimal performance.",
  "🧘‍♀️ Stretch for 5 minutes before every workout to prevent injury.",
  "🥗 Eat colorful vegetables for essential vitamins and minerals.",
  "🎯 Set specific, measurable fitness goals for better results.",
  "🔄 Vary your workouts to keep muscles challenged and engaged.",
  "🍇 Add antioxidant-rich fruits to reduce inflammation.",
  "⚖️ Balance strength training with flexibility work.",
  "🚶‍♂️ Take the stairs whenever possible for extra activity.",
  "🎵 Listen to upbeat music to boost workout motivation.",
  "📱 Track your progress to stay motivated and accountable.",
  "🥜 Healthy fats like nuts support hormone production.",
  "🏋️‍♂️ Focus on form over weight for better results.",
  "🌅 Morning workouts boost metabolism all day.",
  "🥤 Replace sugary drinks with water or herbal tea.",
  "🤝 Workout with a friend for extra motivation.",
  "🎯 Progressive overload is key to muscle growth.",
  "🌱 Plant-based proteins can be just as effective as animal proteins.",
];

const { width } = Dimensions.get('window');

// Gym images data
const gymImages = [
  { id: 1, source: { uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800' }, title: 'Strength Training' },
  { id: 2, source: { uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' }, title: 'Cardio Workouts' },
  { id: 3, source: { uri: 'https://plus.unsplash.com/premium_photo-1661439604043-c069303164dd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bWFuJTIwbGlmdGluZyUyMHdlaWdodHN8ZW58MHx8MHx8fDA%3D' }, title: 'Weight Lifting' },
  { id: 4, source: { uri: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800' }, title: 'CrossFit' },
  { id: 5, source: { uri: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800' }, title: 'Yoga & Flexibility' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isLoggedIn, signOut, dashboardRefreshKey } = useAuth(); // Use useAuth hook
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false); // State for modal visibility
  const [dailyCalories, setDailyCalories] = useState<number>(0);
  const [dailyExpenses, setDailyExpenses] = useState<number>(0);
  const [latestWorkout, setLatestWorkout] = useState<WorkoutLog | null>(null);
  const [dailyTip, setDailyTip] = useState<string>('');

  useEffect(() => {
    if (params.profileSaved) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  }, [params.profileSaved]);

  // Set daily tip based on current date
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % fitnessTips.length;
    setDailyTip(fitnessTips[tipIndex]);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isLoggedIn) {
        setDailyCalories(0);
        setDailyExpenses(0);
        setLatestWorkout(null);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching dashboard data for date:', today);

      // Fetch daily meal calories
      try {
        const mealLogs = await apiClient.get<MealLog[]>(`/meals/logs/?date=${today}`);
        const totalDailyCalories = mealLogs.reduce((sum, log) => sum + log.calories, 0);
        setDailyCalories(totalDailyCalories);
      } catch (error) {
        console.error('Error fetching daily calories:', error);
        setDailyCalories(0);
      }

      // Fetch daily expenses
      const expenseDocRef = doc(db, "expense", user?.id || '');
      const expenseDocSnap = await getDoc(expenseDocRef);
      if (expenseDocSnap.exists()) {
        const data = expenseDocSnap.data();
        const expensesArray = Array.isArray(data.expenses) ? data.expenses : [];
        const totalDailyExpenses = expensesArray.reduce((sum, item) => sum + Number(item.amount), 0);
        setDailyExpenses(totalDailyExpenses);
      } else {
        setDailyExpenses(0);
      }
      // Fetch latest workout from Firebase
      try {
        if (!user?.id) {
          setLatestWorkout(null);
          return;
        }
        
        const workoutDocRef = doc(db, "workout", user.id);
        const workoutDocSnap = await getDoc(workoutDocRef);
        
        if (workoutDocSnap.exists()) {
          const data = workoutDocSnap.data();
          const workoutsArray = Array.isArray(data.workouts) ? data.workouts : [];
          
          // Filter workouts for today
          const todayWorkouts = workoutsArray.filter((workout: any) => {
            if (!workout.timestamp) return false;
            const workoutDate = new Date(workout.timestamp);
            const todayDate = new Date();
            return (
              workoutDate.getDate() === todayDate.getDate() &&
              workoutDate.getMonth() === todayDate.getMonth() &&
              workoutDate.getFullYear() === todayDate.getFullYear()
            );
          });
          
          if (todayWorkouts.length > 0) {
            // Sort by timestamp (most recent first)
            const sortedWorkouts = [...todayWorkouts].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setLatestWorkout(sortedWorkouts[0]);
          } else {
            setLatestWorkout(null);
          }
        } else {
          setLatestWorkout(null);
        }
      } catch (error) {
        console.error('Error fetching latest workout:', error);
        setLatestWorkout(null);
      }
    };

    fetchDashboardData();
  }, [isLoggedIn, dashboardRefreshKey]); // Refetch when login status changes or dashboardRefreshKey changes

  // Handlers for ProfileModal actions
  const handleLogin = () => {
    setIsProfileModalVisible(false);
    router.push('/login' as never);
  };

  const handleCreateAccount = () => {
    setIsProfileModalVisible(false);
    router.push('/register' as never);
  };

  const handleCheckUpdates = () => {
    setIsProfileModalVisible(false);
    console.log('Checking for updates...');
  };

  const handleViewProfile = () => {
    setIsProfileModalVisible(false);
    router.push('/profile-details' as never);
  };

  const handleCompleteProfile = () => {
    setIsProfileModalVisible(false);
    router.push('/complete-profile' as never);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Image Display - now inside ScrollView */}
      <View style={styles.profileImageContainer}>
        <ProfileImageDisplay
          size={40}
          onPress={() => setIsProfileModalVisible(true)}
          profileImageUrl={user?.profile_image_url}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        {showSuccess && (
          <View style={{backgroundColor: Colors.success, padding: 8, borderRadius: 8, marginBottom: 10}}>
            <Text style={{color: 'white', textAlign: 'center'}}>Profile saved successfully!</Text>
          </View>
        )}
        <Text style={styles.greeting}>Hello, {user?.name || user?.username || 'Guest'}!</Text>
        <Text style={styles.subtitle}>Goal: {user?.goal || 'Set your goal'}</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statValue}>{dailyCalories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]} >
              <MaterialIcons name="local-fire-department" size={24} color={Colors.primary} />
            </View>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statValue}>₹{dailyExpenses.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]} >
              <MaterialIcons name="attach-money" size={24} color={Colors.success} />
            </View>
          </View>
        </Card>
      </View>

      {/* Workout Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workout: {latestWorkout?.exercise || 'No workout today'}</Text>
          <Button 
            title="View All" 
            variant="text" 
            onPress={() => router.push('/(tabs)/workout')} 
            style={{ padding: 0 }}
          />
        </View>
        {latestWorkout ? (
          latestWorkout.duration_min ? (
            // Cardio workout display
            <View style={styles.workoutStats}>
              <View style={styles.workoutStat}>
                <Text style={styles.workoutStatValue}>{latestWorkout.duration_min}</Text>
                <Text style={styles.workoutStatLabel}>Minutes</Text>
              </View>
              <View style={styles.workoutStat}>
                <Text style={styles.workoutStatValue}>Cardio</Text>
                <Text style={styles.workoutStatLabel}>Type</Text>
              </View>
            </View>
          ) : (
            // Strength workout display
            <View style={styles.workoutStats}>
              <View style={styles.workoutStat}>
                <Text style={styles.workoutStatValue}>{latestWorkout?.sets || '-'}</Text>
                <Text style={styles.workoutStatLabel}>Sets</Text>
              </View>
              <View style={styles.workoutStat}>
                <Text style={styles.workoutStatValue}>{latestWorkout?.reps || '-'}</Text>
                <Text style={styles.workoutStatLabel}>Reps</Text>
              </View>
              <View style={styles.workoutStat}>
                <Text style={styles.workoutStatValue}>{latestWorkout?.weight ? `${latestWorkout.weight}kg` : '-'}</Text>
                <Text style={styles.workoutStatLabel}>Weight</Text>
              </View>
            </View>
          )
        ) : (
          <View style={styles.workoutStats}>
            <Text style={styles.emptyWorkoutText}>Start logging your workouts to see them here!</Text>
          </View>
        )}
      </Card>

      {/* Gym Images Carousel */}
      <View style={styles.gymImagesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workout Inspiration</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gymImagesContainer}
        >
          {gymImages.map((image) => (
            <TouchableOpacity key={image.id} style={styles.gymImageCard}>
              <Image source={image.source} style={styles.gymImage} />
              <Text style={styles.gymImageTitle}>{image.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Daily Tip */}
      <Card style={styles.dailyTipCard}>
        <View style={styles.tipHeader}>
          <MaterialIcons name="lightbulb-outline" size={24} color={Colors.primary} />
          <Text style={styles.tipTitle}>Daily Tip</Text>
        </View>
        <Text style={styles.tipText}>{dailyTip}</Text>
        <TouchableOpacity 
          style={styles.newTipButton}
          onPress={() => {
            const randomIndex = Math.floor(Math.random() * fitnessTips.length);
            setDailyTip(fitnessTips[randomIndex]);
          }}
        >
          <MaterialIcons name="refresh" size={16} color={Colors.primary} />
          <Text style={styles.newTipText}>Get New Tip</Text>
        </TouchableOpacity>
      </Card>

      <ProfileModal
        isVisible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        onCheckUpdates={handleCheckUpdates}
        isLoggedIn={isLoggedIn}
        user={user}
        onSignOut={signOut}
        key={isLoggedIn ? `profile-modal-${user?.id}` : 'profile-modal-logged-out'}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: ThemeTokens.spacing.lg,
    paddingTop: ThemeTokens.spacing.xl * 2,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: ThemeTokens.radius.xl,
    borderBottomRightRadius: ThemeTokens.radius.xl,
    position: 'relative',
    paddingBottom: ThemeTokens.spacing.xl * 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileImageContainer: {
    position: 'absolute',
    right: 20,
    top: 40,
    zIndex: 10, // Ensure it's above other content in the header
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -30,
    paddingHorizontal: ThemeTokens.spacing.lg,
    marginBottom: ThemeTokens.spacing.lg,
  },
  statCard: {
    width: '48%',
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    marginHorizontal: ThemeTokens.spacing.lg,
    marginBottom: ThemeTokens.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeTokens.spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  seeAllText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  workoutStat: {
    alignItems: 'center',
  },
  workoutStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  workoutStatLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
  },
  emptyWorkoutText: {
    fontSize: 14,
    color: Colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: ThemeTokens.spacing.md,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: Colors.lightGray,
    borderRadius: ThemeTokens.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    color: Colors.gray,
  },
  insightText: {
    color: Colors.text,
    lineHeight: 22,
  },
  gymImagesSection: {
    marginHorizontal: ThemeTokens.spacing.lg,
    marginBottom: ThemeTokens.spacing.md,
  },
  gymImagesContainer: {
    paddingHorizontal: ThemeTokens.spacing.sm,
  },
  gymImageCard: {
    width: 200,
    marginRight: ThemeTokens.spacing.md,
    borderRadius: ThemeTokens.radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    elevation: 2,
  },
  gymImage: {
    width: '100%',
    height: 120,
    borderRadius: ThemeTokens.radius.lg,
  },
  gymImageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    padding: ThemeTokens.spacing.sm,
  },
  dailyTipCard: {
    marginHorizontal: ThemeTokens.spacing.lg,
    marginBottom: ThemeTokens.spacing.md,
    padding: ThemeTokens.spacing.lg,
    backgroundColor: Colors.primary + '10', // Light background with primary tint
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeTokens.spacing.sm,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: ThemeTokens.spacing.sm,
  },
  tipText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: ThemeTokens.spacing.md,
  },
  newTipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: ThemeTokens.spacing.xs,
    paddingHorizontal: ThemeTokens.spacing.sm,
  },
  newTipText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: ThemeTokens.spacing.xs,
  },
});
