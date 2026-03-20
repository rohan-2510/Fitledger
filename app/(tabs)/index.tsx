import { db } from '@/utils/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
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
import { ProgressBar } from '../../components/ProgressBar';
import { Colors } from '../../constants/Colors';
import { ThemeTokens } from '../../constants/ThemeTokens';
import { useAuth } from '../../context/AuthContext';
import { generateHealthInsights, HealthInsight } from '../../hooks/use-health-insights';

interface ExpenseItem {
  id: number;
  description: string;
  category: string;
  amount: number;
  date: string;
}

interface WorkoutLog {
  id: string;
  exercise: string;
  sets?: number;
  reps?: string;
  weight?: number;
  duration_min?: number;
  calculated_calories?: number;
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


// BMI color helper
const getBmiColor = (category: string): string => {
  switch (category) {
    case 'Underweight': return '#3B82F6'; // blue
    case 'Normal': return Colors.success;
    case 'Overweight': return Colors.warning;
    case 'Obese': return Colors.error;
    default: return Colors.gray;
  }
};

// Calorie progress color helper
const getCalorieProgressColor = (intake: number, required: number): string => {
  if (required === 0) return Colors.gray;
  const ratio = intake / required;
  if (ratio >= 0.8 && ratio <= 1.05) return Colors.success;
  if (ratio < 0.8 || ratio <= 1.2) return Colors.warning;
  return Colors.error;
};

// Insight priority color helper
const getInsightColor = (priority: string): string => {
  switch (priority) {
    case 'high': return Colors.error;
    case 'medium': return Colors.warning;
    case 'low': return Colors.success;
    default: return Colors.gray;
  }
};

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isLoggedIn, signOut, dashboardRefreshKey } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [dailyCalories, setDailyCalories] = useState<number>(0);
  const [dailyExpenses, setDailyExpenses] = useState<number>(0);
  const [latestWorkout, setLatestWorkout] = useState<WorkoutLog | null>(null);
  const [dailyTip, setDailyTip] = useState<string>('');
  const [dailyCaloriesBurned, setDailyCaloriesBurned] = useState<number>(0);
  const [todayWorkoutCount, setTodayWorkoutCount] = useState<number>(0);
  const [todayCardioMinutes, setTodayCardioMinutes] = useState<number>(0);

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
        setDailyCaloriesBurned(0);
        setTodayWorkoutCount(0);
        setTodayCardioMinutes(0);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // Fetch daily meal calories from Firebase nutrition collection
      try {
        if (!user?.id) {
          setDailyCalories(0);
        } else {
          const nutritionDocRef = doc(db, "nutrition", user.id);
          const nutritionDocSnap = await getDoc(nutritionDocRef);

          if (nutritionDocSnap.exists()) {
            const data = nutritionDocSnap.data();
            const mealsArray = Array.isArray(data.meals) ? data.meals : [];

            const todayMeals = mealsArray.filter((meal: any) => {
              if (!meal.date) return false;
              return meal.date === today;
            });

            const totalDailyCalories = todayMeals.reduce((sum: number, meal: any) => {
              const foodCalories = meal.food?.calories || 0;
              return sum + foodCalories;
            }, 0);

            setDailyCalories(totalDailyCalories);
          } else {
            setDailyCalories(0);
          }
        }
      } catch (error) {
        console.error('Error fetching daily calories:', error);
        setDailyCalories(0);
      }

      // Fetch daily expenses
      try {
        const expenseDocRef = doc(db, "expense", user?.id || '');
        const expenseDocSnap = await getDoc(expenseDocRef);
        if (expenseDocSnap.exists()) {
          const data = expenseDocSnap.data();
          const expensesArray = Array.isArray(data.expenses) ? data.expenses : [];
          const todayExpenses = expensesArray.filter((expense: any) => {
            if (!expense.date) return false;
            return expense.date === today;
          });
          const totalDailyExpenses = todayExpenses.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
          setDailyExpenses(totalDailyExpenses);
        } else {
          setDailyExpenses(0);
        }
      } catch (error) {
        console.error('Error fetching daily expenses:', error);
        setDailyExpenses(0);
      }

      // Fetch workouts from Firebase
      try {
        if (!user?.id) {
          setLatestWorkout(null);
          setDailyCaloriesBurned(0);
          setTodayWorkoutCount(0);
          setTodayCardioMinutes(0);
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

          // Set workout count
          setTodayWorkoutCount(todayWorkouts.length);

          // Calculate total calories burned from today's workouts
          const totalBurned = todayWorkouts.reduce((sum: number, w: any) => {
            return sum + (w.calculated_calories || 0);
          }, 0);
          setDailyCaloriesBurned(totalBurned);

          // Calculate total cardio minutes
          const totalCardioMin = todayWorkouts.reduce((sum: number, w: any) => {
            return sum + (w.duration_min || 0);
          }, 0);
          setTodayCardioMinutes(totalCardioMin);

          if (todayWorkouts.length > 0) {
            const sortedWorkouts = [...todayWorkouts].sort((a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setLatestWorkout(sortedWorkouts[0]);
          } else {
            setLatestWorkout(null);
          }
        } else {
          setLatestWorkout(null);
          setDailyCaloriesBurned(0);
          setTodayWorkoutCount(0);
          setTodayCardioMinutes(0);
        }
      } catch (error) {
        console.error('Error fetching workouts:', error);
        setLatestWorkout(null);
        setDailyCaloriesBurned(0);
        setTodayWorkoutCount(0);
        setTodayCardioMinutes(0);
      }
    };

    fetchDashboardData();
  }, [isLoggedIn, dashboardRefreshKey]);

  // Generate health insights
  const healthInsights = useMemo(() => {
    return generateHealthInsights({
      user,
      dailyCaloriesIntake: dailyCalories,
      dailyCaloriesBurned,
      todayWorkoutCount,
      todayCardioMinutes,
    });
  }, [user, dailyCalories, dailyCaloriesBurned, todayWorkoutCount, todayCardioMinutes]);

  // Calorie balance calculations
  const requiredCalories = user?.macros?.calories || 0;
  const netCalories = dailyCalories - dailyCaloriesBurned;
  const remainingCalories = requiredCalories - netCalories;
  const calorieProgressRatio = requiredCalories > 0 ? dailyCalories / requiredCalories : 0;

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
      {/* Profile Image Display */}
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
          <View style={{ backgroundColor: Colors.success, padding: 8, borderRadius: 8, marginBottom: 10 }}>
            <Text style={{ color: 'white', textAlign: 'center' }}>Profile saved successfully!</Text>
          </View>
        )}
        <Text style={styles.greeting}>Hello, {user?.name || user?.username || 'Guest'}!</Text>
        <Text style={styles.subtitle}>Goal: {user?.goal || 'Set your goal'}</Text>
      </View>

      {/* BMI Card */}
      {isLoggedIn && user?.macros?.bmi !== undefined && user.macros.bmi > 0 && (
        <Card style={styles.bmiCard}>
          <View style={styles.bmiHeader}>
            <View>
              <Text style={styles.bmiTitle}>Body Mass Index (BMI)</Text>
              <View style={styles.bmiValueRow}>
                <Text style={styles.bmiValue}>{user.macros.bmi}</Text>
                <View style={[styles.bmiBadge, { backgroundColor: getBmiColor(user.macros.bmiCategory) + '20' }]}>
                  <Text style={[styles.bmiBadgeText, { color: getBmiColor(user.macros.bmiCategory) }]}>
                    {user.macros.bmiCategory}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.bmiIconContainer, { backgroundColor: getBmiColor(user.macros.bmiCategory) + '15' }]}>
              <MaterialIcons name="monitor-weight" size={28} color={getBmiColor(user.macros.bmiCategory)} />
            </View>
          </View>
          {/* BMI Scale Bar */}
          <View style={styles.bmiScaleContainer}>
            <View style={styles.bmiScale}>
              <View style={[styles.bmiScaleSegment, { flex: 18.5, backgroundColor: '#3B82F6' }]} />
              <View style={[styles.bmiScaleSegment, { flex: 6.5, backgroundColor: Colors.success }]} />
              <View style={[styles.bmiScaleSegment, { flex: 5, backgroundColor: Colors.warning }]} />
              <View style={[styles.bmiScaleSegment, { flex: 10, backgroundColor: Colors.error }]} />
            </View>
            <View style={[styles.bmiIndicator, { left: `${Math.min(Math.max((user.macros.bmi / 40) * 100, 2), 98)}%` }]}>
              <View style={styles.bmiIndicatorDot} />
            </View>
            <View style={styles.bmiScaleLabels}>
              <Text style={[styles.bmiScaleLabel, { position: 'absolute', left: `${(18.5 / 40) * 100}%` }]}>18.5</Text>
              <Text style={[styles.bmiScaleLabel, { position: 'absolute', left: `${(25 / 40) * 100}%` }]}>25</Text>
              <Text style={[styles.bmiScaleLabel, { position: 'absolute', left: `${(30 / 40) * 100}%` }]}>30</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statValue}>{dailyCalories}</Text>
              <Text style={styles.statLabel}>Intake (kcal)</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]} >
              <MaterialIcons name="restaurant" size={24} color={Colors.primary} />
            </View>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statValue}>{dailyCaloriesBurned}</Text>
              <Text style={styles.statLabel}>Burned (kcal)</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} >
              <MaterialIcons name="local-fire-department" size={24} color={Colors.error} />
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statValue}>₹{dailyExpenses.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Today's Expenses</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]} >
              <MaterialIcons name="attach-money" size={24} color={Colors.success} />
            </View>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statValue}>{todayWorkoutCount}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]} >
              <MaterialIcons name="fitness-center" size={24} color={Colors.primary} />
            </View>
          </View>
        </Card>
      </View>

      {/* Workout Section
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
      </Card> */}

      {/* Today's Health Summary */}
      {isLoggedIn && requiredCalories > 0 && (
        <Card style={styles.healthSummaryCard}>
          <View style={styles.healthSummaryHeader}>
            <MaterialIcons name="assessment" size={22} color={Colors.primary} />
            <Text style={styles.healthSummaryTitle}>Today's Health Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <MaterialIcons name="restaurant" size={18} color={Colors.warning} />
              <Text style={styles.summaryLabel}>Calorie Intake</Text>
            </View>
            <Text style={styles.summaryValue}>{dailyCalories} kcal</Text>
          </View>
          <ProgressBar
            progress={requiredCalories > 0 ? dailyCalories / requiredCalories : 0}
            color={dailyCalories > requiredCalories ? Colors.error : Colors.success}
            height={6}
            style={{ marginBottom: 12 }}
          />

          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <MaterialIcons name="local-fire-department" size={18} color={Colors.error} />
              <Text style={styles.summaryLabel}>Calories Burned</Text>
            </View>
            <Text style={styles.summaryValue}>{dailyCaloriesBurned} kcal</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <MaterialIcons name="timer" size={18} color={Colors.primary} />
              <Text style={styles.summaryLabel}>Cardio Minutes</Text>
            </View>
            <Text style={styles.summaryValue}>{todayCardioMinutes} min</Text>
          </View>
          {(user?.macros?.recommendedExerciseMin || 0) > 0 && (
            <ProgressBar
              progress={todayCardioMinutes / (user?.macros?.recommendedExerciseMin || 30)}
              color={todayCardioMinutes >= (user?.macros?.recommendedExerciseMin || 30) ? Colors.success : Colors.warning}
              height={6}
              style={{ marginBottom: 12 }}
            />
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <MaterialIcons name="balance" size={18} color={Colors.primary} />
              <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Net Calories</Text>
            </View>
            <Text style={[styles.summaryValue, { fontWeight: '700', color: Colors.primary }]}>{netCalories} kcal</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <MaterialIcons name="track-changes" size={18} color={Colors.success} />
              <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Target</Text>
            </View>
            <Text style={[styles.summaryValue, { fontWeight: '700' }]}>{requiredCalories} kcal</Text>
          </View>

          <View style={[styles.summaryRemainingBox, { backgroundColor: remainingCalories > 0 ? Colors.success + '15' : Colors.error + '15' }]}>
            <MaterialIcons
              name={remainingCalories > 0 ? "info-outline" : "warning"}
              size={16}
              color={remainingCalories > 0 ? Colors.success : Colors.error}
            />
            <Text style={[styles.summaryRemainingText, { color: remainingCalories > 0 ? Colors.success : Colors.error }]}>
              {remainingCalories > 0
                ? `You can eat ${Math.round(remainingCalories)} more kcal today`
                : `You've exceeded your target by ${Math.abs(Math.round(remainingCalories))} kcal`}
            </Text>
          </View>
        </Card>
      )}

      {/* Smart Recommendations */}
      {isLoggedIn && healthInsights.length > 0 && (
        <View style={styles.insightsSection}>
          <Text style={styles.insightsSectionTitle}>Smart Recommendations</Text>
          {healthInsights.slice(0, 4).map((insight: HealthInsight) => (
            <TouchableOpacity
              key={insight.id}
              style={styles.insightCard}
              onPress={() => {
                if (insight.type === 'nutrition') router.push('/(tabs)/nutrition');
                else if (insight.type === 'exercise') router.push('/(tabs)/workout');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.insightIconContainer, { backgroundColor: getInsightColor(insight.priority) + '15' }]}>
                <MaterialIcons
                  name={insight.icon as any}
                  size={20}
                  color={getInsightColor(insight.priority)}
                />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMessage}>{insight.message}</Text>
              </View>
              {(insight.type === 'nutrition' || insight.type === 'exercise') && (
                <MaterialIcons name="chevron-right" size={20} color={Colors.gray} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}


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
    zIndex: 10,
  },

  // BMI Card
  bmiCard: {
    marginHorizontal: ThemeTokens.spacing.lg,
    marginTop: ThemeTokens.spacing.md,
    padding: ThemeTokens.spacing.lg,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ThemeTokens.spacing.md,
  },
  bmiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  bmiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bmiBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bmiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bmiScaleContainer: {
    position: 'relative',
    marginTop: 4,
  },
  bmiScale: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bmiScaleSegment: {
    height: '100%',
  },
  bmiIndicator: {
    position: 'absolute',
    top: -3,
    marginLeft: -7,
  },
  bmiIndicatorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.text,
    borderWidth: 2,
    borderColor: 'white',
  },
  bmiScaleLabels: {
    position: 'relative',
    height: 16,
    marginTop: 4,
  },
  bmiScaleLabel: {
    fontSize: 10,
    color: Colors.gray,
    transform: [{ translateX: -10 }],
  },

  // Calorie Balance Card
  calorieBalanceCard: {
    marginHorizontal: ThemeTokens.spacing.lg,
    marginTop: ThemeTokens.spacing.md,
    padding: ThemeTokens.spacing.lg,
  },
  calorieBalanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: ThemeTokens.spacing.md,
  },
  calorieProgressContainer: {
    marginBottom: ThemeTokens.spacing.md,
  },
  calorieProgressBar: {
    height: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  calorieProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  calorieProgressText: {
    fontSize: 12,
    color: Colors.gray,
  },
  calorieBreakdown: {
    gap: 8,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  calorieRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calorieRowLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  calorieRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  calorieDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  remainingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: ThemeTokens.radius.md,
    marginTop: 4,
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeTokens.spacing.lg,
    marginBottom: ThemeTokens.spacing.sm,
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

  // Sections
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
  sectionTitle: {
    width: '80%',
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
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

  // Smart Recommendations
  insightsSection: {
    marginHorizontal: ThemeTokens.spacing.lg,
    marginBottom: ThemeTokens.spacing.md,
  },
  insightsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: ThemeTokens.spacing.sm,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: ThemeTokens.radius.md,
    padding: ThemeTokens.spacing.md,
    marginBottom: 8,
    ...ThemeTokens.shadow.card,
  },
  insightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ThemeTokens.spacing.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  insightMessage: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 18,
  },

  // Gym Images
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

  // Daily Tip
  dailyTipCard: {
    marginHorizontal: ThemeTokens.spacing.lg,
    marginBottom: ThemeTokens.spacing.md,
    padding: ThemeTokens.spacing.lg,
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

  // Today's Health Summary
  healthSummaryCard: {
    marginHorizontal: ThemeTokens.spacing.lg,
    marginBottom: ThemeTokens.spacing.md,
    padding: ThemeTokens.spacing.lg,
  },
  healthSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: ThemeTokens.spacing.md,
  },
  healthSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  summaryRemainingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: ThemeTokens.radius.md,
    marginTop: 8,
  },
  summaryRemainingText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
