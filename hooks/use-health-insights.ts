import { User } from '../context/AuthContext';

export interface HealthInsight {
  id: string;
  type: 'nutrition' | 'exercise' | 'general';
  priority: 'high' | 'medium' | 'low';
  icon: string; // MaterialIcons name
  title: string;
  message: string;
}

interface HealthInsightInput {
  user: User | null;
  dailyCaloriesIntake: number;
  dailyCaloriesBurned: number;
  todayWorkoutCount: number;
  todayCardioMinutes: number;
}

export const generateHealthInsights = ({
  user,
  dailyCaloriesIntake,
  dailyCaloriesBurned,
  todayWorkoutCount,
  todayCardioMinutes,
}: HealthInsightInput): HealthInsight[] => {
  const insights: HealthInsight[] = [];

  if (!user?.macros || !user.profileCompleted) {
    insights.push({
      id: 'complete-profile',
      type: 'general',
      priority: 'high',
      icon: 'person-add',
      title: 'Complete Your Profile',
      message: 'Set your height, weight, age, and goal to get personalized health insights.',
    });
    return insights;
  }

  const { calories: requiredCalories, bmi, bmiCategory, tdee, protein: requiredProtein, recommendedExerciseMin } = user.macros;
  const netCalories = dailyCaloriesIntake - dailyCaloriesBurned;
  const remaining = requiredCalories - netCalories;
  const currentHour = new Date().getHours();

  // === BMI-Based Insights ===
  if (bmi > 0) {
    if (bmi >= 30) {
      insights.push({
        id: 'bmi-obese',
        type: 'general',
        priority: 'high',
        icon: 'warning',
        title: 'BMI Alert',
        message: `Your BMI is ${bmi} (Obese). Consider consulting a healthcare provider and setting a calorie deficit goal.`,
      });
    } else if (bmi >= 25 && user.goal !== 'cut') {
      insights.push({
        id: 'bmi-overweight-goal',
        type: 'general',
        priority: 'medium',
        icon: 'trending-down',
        title: 'Consider Adjusting Your Goal',
        message: `Your BMI is ${bmi} (Overweight). Setting your goal to "Cut" could help you reach a healthier weight.`,
      });
    } else if (bmi < 18.5 && user.goal !== 'bulk') {
      insights.push({
        id: 'bmi-underweight-goal',
        type: 'general',
        priority: 'medium',
        icon: 'trending-up',
        title: 'Consider Gaining Weight',
        message: `Your BMI is ${bmi} (Underweight). Setting your goal to "Bulk" could help you reach a healthier weight.`,
      });
    } else if (bmiCategory === 'Normal') {
      insights.push({
        id: 'bmi-normal',
        type: 'general',
        priority: 'low',
        icon: 'check-circle',
        title: 'Healthy BMI',
        message: `Your BMI is ${bmi} — you're in the healthy range! Keep up the great work.`,
      });
    }
  }

  // === Calorie Balance Insights ===
  if (dailyCaloriesIntake > 0) {
    if (user.goal === 'cut' && netCalories > requiredCalories) {
      const excess = Math.round(netCalories - requiredCalories);
      insights.push({
        id: 'calorie-excess-cut',
        type: 'nutrition',
        priority: 'high',
        icon: 'error-outline',
        title: 'Over Calorie Target',
        message: `You've exceeded your calorie target by ${excess} kcal. Try lighter meals or add more exercise to stay on track with your cut.`,
      });
    } else if (dailyCaloriesIntake > requiredCalories * 1.2) {
      const excess = Math.round(dailyCaloriesIntake - requiredCalories);
      insights.push({
        id: 'calorie-overeating',
        type: 'nutrition',
        priority: 'high',
        icon: 'warning',
        title: 'High Calorie Intake',
        message: `You've consumed ${excess} kcal more than your daily target. Consider balancing with exercise.`,
      });
    } else if (dailyCaloriesIntake < requiredCalories * 0.5 && currentHour >= 16) {
      const needed = Math.round(requiredCalories - dailyCaloriesIntake);
      insights.push({
        id: 'calorie-low-intake',
        type: 'nutrition',
        priority: 'medium',
        icon: 'restaurant',
        title: 'Low Calorie Intake',
        message: `You've only consumed ${dailyCaloriesIntake} kcal today. You need ${needed} more kcal to reach your daily target.`,
      });
    }

    if (user.goal === 'bulk' && dailyCaloriesIntake < requiredCalories * 0.7 && currentHour >= 14) {
      insights.push({
        id: 'bulk-need-more',
        type: 'nutrition',
        priority: 'medium',
        icon: 'add-circle',
        title: 'Eat More to Bulk',
        message: `To hit your bulk target, you still need ${Math.round(requiredCalories - dailyCaloriesIntake)} more kcal today.`,
      });
    }
  }

  // === Exercise Insights ===
  if (todayWorkoutCount === 0 && currentHour >= 12) {
    insights.push({
      id: 'no-workout',
      type: 'exercise',
      priority: currentHour >= 18 ? 'high' : 'medium',
      icon: 'fitness-center',
      title: 'No Workout Today',
      message: `You haven't logged any exercise today. Try a ${recommendedExerciseMin}-minute workout to stay on track!`,
    });
  } else if (todayWorkoutCount > 0) {
    if (dailyCaloriesBurned > 0) {
      insights.push({
        id: 'workout-progress',
        type: 'exercise',
        priority: 'low',
        icon: 'local-fire-department',
        title: 'Workout Progress',
        message: `Great job! You've burned ${dailyCaloriesBurned} kcal through ${todayWorkoutCount} exercise${todayWorkoutCount > 1 ? 's' : ''} today.`,
      });
    }

    if (todayCardioMinutes < recommendedExerciseMin) {
      const moreMin = recommendedExerciseMin - todayCardioMinutes;
      insights.push({
        id: 'need-more-cardio',
        type: 'exercise',
        priority: 'low',
        icon: 'directions-run',
        title: 'More Cardio Recommended',
        message: `You've done ${todayCardioMinutes} min of cardio. Try ${moreMin} more minutes to hit your ${recommendedExerciseMin}-min daily goal.`,
      });
    } else {
      insights.push({
        id: 'cardio-goal-met',
        type: 'exercise',
        priority: 'low',
        icon: 'emoji-events',
        title: 'Cardio Goal Met! 🎉',
        message: `You've completed ${todayCardioMinutes} min of cardio, exceeding your ${recommendedExerciseMin}-min daily goal!`,
      });
    }
  }

  // === Net Balance Insight ===
  if (dailyCaloriesIntake > 0 && remaining > 0 && remaining < requiredCalories) {
    insights.push({
      id: 'remaining-calories',
      type: 'nutrition',
      priority: 'low',
      icon: 'info-outline',
      title: 'Calorie Budget Remaining',
      message: `You can still consume ${Math.round(remaining)} kcal today to stay within your target.`,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
};
