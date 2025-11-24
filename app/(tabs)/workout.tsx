import { db } from '@/utils/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ProfileImageDisplay } from '../../components/ProfileImageDisplay'; // Import ProfileImageDisplay
import { ProfileModal } from '../../components/ProfileModal'; // Import ProfileModal
import { Colors } from '../../constants/Colors';
import { ThemeTokens } from '../../constants/ThemeTokens';
import { useAuth } from '../../context/AuthContext';
import { calculateCaloriesBurned, searchExercises } from '../api/workoutApi';

interface WorkoutLog {
  id: string;
  exercise: string;
  sets?: number;
  reps?: string;
  weight?: number;
  duration_min?: number;
  rpe?: number;
  notes?: string;
  timestamp: string;
  calculated_calories?: number; // Store calculated calories
}

interface ExerciseSuggestion {
  name: string;
  type?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: string;
}

type WorkoutType = 'cardiovascular' | 'strength';

// Component to render cardio exercises with calorie calculation
const CardioExerciseItem: React.FC<{
  workout: WorkoutLog;
  userWeight: number;
  onDelete: (id: string) => void;
}> = ({ workout, userWeight, onDelete }) => {
  const [calories, setCalories] = useState<number | null>(null);

  useEffect(() => {
    const calcCal = async () => {
      try {
        const cal = await calculateCaloriesBurned(
          workout.exercise,
          workout.duration_min || 0,
          userWeight
        );
        setCalories(cal);
      } catch {
        setCalories(Math.round((workout.duration_min || 0) * 10));
      }
    };
    calcCal();
  }, [workout.exercise, workout.duration_min, userWeight]);

  return (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{workout.exercise}</Text>
        <Text style={styles.exerciseDetails}>
          {workout.duration_min} min • {calories !== null ? `${calories} cal` : 'Calculating...'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(workout.id)}>
        <MaterialIcons name="delete" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
};

const CardioExerciseList: React.FC<{
  workouts: WorkoutLog[];
  userWeight: number;
  onDelete: (id: string) => void;
}> = ({ workouts, userWeight, onDelete }) => {
  return (
    <>
      {workouts.map((workout) => (
        <CardioExerciseItem
          key={workout.id}
          workout={workout}
          userWeight={userWeight}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

export default function WorkoutScreen() {
  const router = useRouter();
  const { user, isLoggedIn, signOut, triggerDashboardRefresh } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [workoutType, setWorkoutType] = useState<WorkoutType>('cardiovascular');
  const [allWorkouts, setAllWorkouts] = useState<WorkoutLog[]>([]);

  // Form state
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');

  // Exercise search state
  const [exerciseSuggestions, setExerciseSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingExercises, setSearchingExercises] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseSuggestion | null>(null);
  const [calculatedCalories, setCalculatedCalories] = useState<number | null>(null);
  const [calculatingCalories, setCalculatingCalories] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false); // State for profile modal

  // Reset states when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setSelectedDate(new Date());
      setWorkouts([]);
      setAllWorkouts([]);
      setExerciseName('');
      setSets('');
      setReps('');
      setWeight('');
      setDuration('');
      setRpe('');
      setNotes('');
      setExerciseSuggestions([]);
      setShowSuggestions(false);
      setSelectedExercise(null);
      setCalculatedCalories(null);
      setCalculatingCalories(false);
      setDailyCardioCalories(0);
      setWeeklyCardioCalories(0);
    }
  }, [isLoggedIn]);

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
    // Actual update check logic could go here, or be handled by the prop if passed from a parent
  };

  const handleViewProfile = () => {
    setIsProfileModalVisible(false);
    router.push('/profile-details' as never);
  };

  const handleCompleteProfile = () => {
    setIsProfileModalVisible(false);
    router.push('/complete-profile' as never);
  };

  // Load all workouts on mount and when user changes
  useEffect(() => {
    if (user?.id && isLoggedIn) {
      loadAllWorkouts();
    } else {
      setAllWorkouts([]);
    }
  }, [user?.id, isLoggedIn]);

  // Filter workouts for selected date whenever date or allWorkouts changes
  useEffect(() => {
    const filteredWorkouts = allWorkouts.filter((w: any) => {
      if (!w.timestamp) return false;
      const workoutDate = new Date(w.timestamp);
      return isSameDay(workoutDate, selectedDate);
    });
    setWorkouts(filteredWorkouts);
  }, [selectedDate, allWorkouts]);

  const loadAllWorkouts = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const workoutDocRef = doc(db, "workout", user.id);
      const workoutDocSnap = await getDoc(workoutDocRef);

      if (workoutDocSnap.exists()) {
        const data = workoutDocSnap.data();
        const workoutsArray = Array.isArray(data.workouts) ? data.workouts : [];
        // Map workouts array to include document ID for each workout
        const workoutsData: WorkoutLog[] = workoutsArray.map((workout: any, index: number) => ({
          id: workout.id || `${user.id}_${index}`,
          ...workout,
        }));
        setAllWorkouts(workoutsData);
      } else {
        setAllWorkouts([]);
      }
    } catch (error: any) {
      console.error('Error loading workouts:', error);
      Alert.alert('Error', 'Failed to load workouts. Please try again.');
      setAllWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const openModal = (type: WorkoutType) => {
    setWorkoutType(type);
    setModalVisible(true);
    resetForm();
  };

  const resetForm = () => {
    setExerciseName('');
    setSets('');
    setReps('');
    setWeight('');
    setDuration('');
    setRpe('');
    setNotes('');
    setExerciseSuggestions([]);
    setShowSuggestions(false);
    setSelectedExercise(null);
    setCalculatedCalories(null);
  };

  // Search exercises when user types
  const handleExerciseNameChange = async (text: string) => {
    setExerciseName(text);
    setCalculatedCalories(null);

    if (text.length >= 2) {
      setSearchingExercises(true);
      setShowSuggestions(true);
      try {
        const searchType = workoutType === 'cardiovascular' ? 'cardio' : 'strength';
        const suggestions = await searchExercises(text, searchType);
        setExerciseSuggestions(suggestions);
      } catch (error) {
        console.error('Error searching exercises:', error);
        setExerciseSuggestions([]);
      } finally {
        setSearchingExercises(false);
      }
    } else {
      setExerciseSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select exercise from suggestions
  const selectExercise = async (exercise: ExerciseSuggestion) => {
    setExerciseName(exercise.name);
    setSelectedExercise(exercise);
    setShowSuggestions(false);
    setExerciseSuggestions([]);

    // If it's a cardio exercise and duration is set, calculate calories
    if (workoutType === 'cardiovascular' && duration) {
      calculateCalories();
    }

    // Load exercise details if available
    if (exercise.muscle || exercise.equipment) {
      // Details already loaded in suggestion
    }
  };

  // Calculate calories when duration changes for cardio
  const handleDurationChange = (text: string) => {
    setDuration(text);
    if (text && exerciseName && workoutType === 'cardiovascular') {
      calculateCalories();
    } else {
      setCalculatedCalories(null);
    }
  };

  // Calculate calories burned
  const calculateCalories = async () => {
    if (!exerciseName || !duration || workoutType !== 'cardiovascular') return;

    const durationNum = parseFloat(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      setCalculatedCalories(null);
      return;
    }

    setCalculatingCalories(true);
    try {
      const userWeight = user?.weight_kg || 70; // Default to 70kg if not available
      const calories = await calculateCaloriesBurned(exerciseName, durationNum, userWeight);
      setCalculatedCalories(calories);
    } catch (error) {
      console.error('Error calculating calories:', error);
      setCalculatedCalories(null);
    } finally {
      setCalculatingCalories(false);
    }
  };

  const saveWorkout = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to save workouts.');
      return;
    }

    if (!exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name.');
      return;
    }

    if (workoutType === 'cardiovascular' && !duration) {
      Alert.alert('Error', 'Please enter duration for cardiovascular exercise.');
      return;
    }

    if (workoutType === 'strength' && (!sets || !reps)) {
      Alert.alert('Error', 'Please enter sets and reps for strength training.');
      return;
    }

    try {
      const workoutData: any = {
        id: `${user.id}_${Date.now()}`,
        exercise: exerciseName.trim(),
        timestamp: selectedDate.toISOString(),
      };

      // Calculate and store calories for cardio exercises
      if (workoutType === 'cardiovascular') {
        workoutData.duration_min = parseFloat(duration);
        workoutData.sets = 1;

        // Calculate calories using API
        const userWeight = user?.weight_kg || 70;
        const calories = await calculateCaloriesBurned(exerciseName.trim(), parseFloat(duration), userWeight);
        workoutData.calculated_calories = calories;
      } else {
        workoutData.sets = parseInt(sets) || 1;
        workoutData.reps = reps.trim();
        if (weight) workoutData.weight = parseFloat(weight);
      }

      if (rpe) workoutData.rpe = parseFloat(rpe);
      if (notes) workoutData.notes = notes.trim();

      // Use document ID that matches user.id
      const workoutDocRef = doc(db, "workout", user.id);
      const workoutDocSnap = await getDoc(workoutDocRef);

      if (workoutDocSnap.exists()) {
        // If the document exists, update it by adding the new workout
        const prevData = workoutDocSnap.data();
        // Ensure prevData.workouts is an array
        const updatedWorkouts = Array.isArray(prevData.workouts)
          ? [...prevData.workouts, workoutData]
          : [workoutData];
        await updateDoc(workoutDocRef, { workouts: updatedWorkouts });
      } else {
        // If not exists, create a new doc with workouts as an array
        await setDoc(workoutDocRef, {
          workouts: [workoutData],
        });
      }

      setModalVisible(false);
      resetForm();
      await loadAllWorkouts(); // Reload all workouts (will trigger filtered update)
      Alert.alert('Success', 'Workout logged successfully!');
      triggerDashboardRefresh(); // Trigger dashboard refresh
    } catch (error: any) {
      console.error('Error saving workout:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save workout. Please try again.'
      );
    }
  };

  const deleteWorkout = async (id: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to delete workouts.');
      return;
    }

    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) return;
              const workoutDocRef = doc(db, "workout", user.id);
              const workoutDocSnap = await getDoc(workoutDocRef);

              if (workoutDocSnap.exists()) {
                const prevData = workoutDocSnap.data();
                const workoutsArray = Array.isArray(prevData.workouts) ? prevData.workouts : [];
                // Filter out the workout with the matching id
                const updatedWorkouts = workoutsArray.filter((workout: any) => workout.id !== id);
                await updateDoc(workoutDocRef, { workouts: updatedWorkouts });
                await loadAllWorkouts(); // Reload all workouts (will trigger filtered update)
              }
            } catch (error: any) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout.');
            }
          },
        },
      ]
    );
  };

  // Calculate totals with dynamic calorie calculation
  const cardioWorkouts = workouts.filter((w) => w.duration_min);
  const strengthWorkouts = workouts.filter((w) => w.duration_min === null || w.duration_min === undefined);

  const dailyCardioMinutes = cardioWorkouts.reduce((sum, w) => sum + (w.duration_min || 0), 0);

  // Calculate daily calories using API (async calculation cached in component state)
  const [dailyCardioCalories, setDailyCardioCalories] = useState(0);
  const [weeklyCardioCalories, setWeeklyCardioCalories] = useState(0);

  // Calculate calories for all cardio workouts
  useEffect(() => {
    const calculateDailyCalories = async () => {
      if (cardioWorkouts.length === 0) {
        setDailyCardioCalories(0);
        return;
      }

      const userWeight = user?.weight_kg || 70;
      let totalCalories = 0;

      for (const workout of cardioWorkouts) {
        if (workout.duration_min) {
          try {
            const calories = await calculateCaloriesBurned(
              workout.exercise,
              workout.duration_min,
              userWeight
            );
            totalCalories += calories;
          } catch (error) {
            // Fallback to fixed rate if API fails
            totalCalories += Math.round(workout.duration_min * 10);
          }
        }
      }

      setDailyCardioCalories(totalCalories);
    };

    calculateDailyCalories();
  }, [cardioWorkouts, user?.weight_kg]);

  // Weekly totals (last 7 days from selected date)
  const weekAgo = new Date(selectedDate);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyWorkouts = allWorkouts.filter((w: any) => {
    if (!w.timestamp) return false;
    const workoutDate = new Date(w.timestamp);
    return workoutDate >= weekAgo && workoutDate <= selectedDate;
  });

  const weeklyCardioMinutes = weeklyWorkouts
    .filter((w) => w.duration_min)
    .reduce((sum, w) => sum + (w.duration_min || 0), 0);

  // Calculate weekly calories
  useEffect(() => {
    const calculateWeeklyCalories = async () => {
      const weekAgo = new Date(selectedDate);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weekWorkouts = allWorkouts.filter((w: any) => {
        if (!w.timestamp) return false;
        const workoutDate = new Date(w.timestamp);
        return workoutDate >= weekAgo && workoutDate <= selectedDate;
      });

      const weeklyCardioWorkouts = weekWorkouts.filter((w) => w.duration_min);
      if (weeklyCardioWorkouts.length === 0) {
        setWeeklyCardioCalories(0);
        return;
      }

      const userWeight = user?.weight_kg || 70;
      let totalCalories = 0;

      for (const workout of weeklyCardioWorkouts) {
        if (workout.duration_min) {
          try {
            const calories = await calculateCaloriesBurned(
              workout.exercise,
              workout.duration_min,
              userWeight
            );
            totalCalories += calories;
          } catch (error) {
            // Fallback to fixed rate if API fails
            totalCalories += Math.round(workout.duration_min * 10);
          }
        }
      }

      setWeeklyCardioCalories(totalCalories);
    };

    calculateWeeklyCalories();
  }, [allWorkouts, selectedDate, user?.weight_kg]);

  const renderCardiovascular = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cardiovascular</Text>
        <View style={styles.sectionActions}>
          <TouchableOpacity onPress={() => openModal('cardiovascular')} style={styles.actionLink}>
            <Text style={styles.actionLinkText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Totals Table */}
      <View style={styles.totalsTable}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Goal</Text>
          <Text style={styles.tableHeaderText}>Minutes</Text>
          <Text style={styles.tableHeaderText}>Calories Burned</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Daily Total</Text>
          <Text style={styles.tableValue}>{dailyCardioMinutes}</Text>
          <Text style={styles.tableValue}>{dailyCardioCalories}</Text>
        </View>
      </View>

      {/* Logged Exercises */}
      {cardioWorkouts.length > 0 && (
        <View style={styles.loggedExercises}>
          <Text style={styles.loggedTitle}>Today's Exercises</Text>
          <CardioExerciseList workouts={cardioWorkouts} userWeight={user?.weight_kg || 70} onDelete={deleteWorkout} />
        </View>
      )}
    </Card>
  );

  const renderStrengthTraining = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Strength Training</Text>
        <View style={styles.sectionActions}>
          <TouchableOpacity onPress={() => openModal('strength')} style={styles.actionLink}>
            <Text style={styles.actionLinkText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.strengthTableHeader}>
        {/* <Text style={styles.strengthHeaderText}>Exercise</Text> */}
        <Text style={styles.strengthHeaderText}>Sets</Text>
        <Text style={styles.strengthHeaderText}>Reps/Set</Text>
        <Text style={styles.strengthHeaderText}>Weight/Set</Text>
        <Text style={styles.strengthHeaderText}></Text>
      </View>

      {/* Logged Exercises */}
      {strengthWorkouts.length > 0 ? (
        strengthWorkouts.map((workout) => (
          <View style={{display:'flex', flexDirection:'row', alignItems:'center', justifyContent:'space-between', width:'100%'}}>
          <View key={workout.id} style={styles.strengthRow}>
            <View style={styles.strengthExerciseInfo}>
              <Text style={styles.strengthExerciseName}>{workout.exercise}</Text>
            </View>
            <View style={{display:'flex', flexDirection:'row'}}>
            <Text style={styles.strengthValue}>{workout.sets || '-'}</Text>
            <Text style={styles.strengthValue}>{workout.reps || '-'}</Text>
            <Text style={styles.strengthValue}>{workout.weight ? `${workout.weight} kg` : '-'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => deleteWorkout(workout.id)} style={styles.deleteButton}>
                <MaterialIcons name="delete" size={18} color={Colors.error} />
              </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No strength exercises logged today</Text>
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
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
          <View>
            <Text style={styles.title}>Workout Diary</Text>
            <Text style={styles.subtitle}>Track your daily activities</Text>
          </View>
        </View>

        {/* Date Selector */}
        <Card style={styles.dateCard}>
          <View style={styles.dateSelector}>
            <Text style={styles.dateLabel}>Your Exercise Diary for:</Text>
            <View style={styles.dateControls}>
              <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateButton}>
                <MaterialIcons name="chevron-left" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
              <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateButton}>
                <MaterialIcons name="chevron-right" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Cardiovascular Section */}
        {renderCardiovascular()}

        {/* Strength Training Section */}
        {renderStrengthTraining()}

        {/* Summary Stats */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{workouts.length}</Text>
              <Text style={styles.summaryLabel}>Total Exercises</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{dailyCardioMinutes}</Text>
              <Text style={styles.summaryLabel}>Cardio Minutes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{strengthWorkouts.length}</Text>
              <Text style={styles.summaryLabel}>Strength Exercises</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Add Workout Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add {workoutType === 'cardiovascular' ? 'Cardiovascular' : 'Strength'} Exercise
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={styles.label}>Exercise Name *</Text>
                <View style={styles.exerciseInputContainer}>
                  <TextInput
                    style={styles.input}
                    value={exerciseName}
                    onChangeText={handleExerciseNameChange}
                    placeholder="e.g., Running, Bench Press"
                    onFocus={() => {
                      if (exerciseName.length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding to allow suggestion selection
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                  />
                  {searchingExercises && (
                    <ActivityIndicator size="small" color={Colors.primary} style={styles.searchIndicator} />
                  )}
                </View>

                {/* Exercise Suggestions */}
                {showSuggestions && exerciseSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <FlatList
                      data={exerciseSuggestions}
                      keyExtractor={(item, index) => `${item.name}-${index}`}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.suggestionItem}
                          onPress={() => selectExercise(item)}
                        >
                          <View style={styles.suggestionContent}>
                            <Text style={styles.suggestionName}>{item.name}</Text>
                            {item.muscle && (
                              <Text style={styles.suggestionDetails}>
                                {item.muscle}
                                {item.equipment && ` • ${item.equipment}`}
                                {item.difficulty && ` • ${item.difficulty}`}
                              </Text>
                            )}
                          </View>
                          <MaterialIcons name="chevron-right" size={20} color={Colors.gray} />
                        </TouchableOpacity>
                      )}
                      keyboardShouldPersistTaps="handled"
                    />
                  </View>
                )}

                {/* Selected Exercise Details */}
                {selectedExercise && (
                  <View style={styles.exerciseDetailsCard}>
                    <Text style={styles.exerciseDetailsTitle}>Exercise Info</Text>
                    {selectedExercise.muscle && (
                      <Text style={styles.exerciseDetailItem}>
                        <MaterialIcons name="fitness-center" size={16} color={Colors.primary} /> Muscle: {selectedExercise.muscle}
                      </Text>
                    )}
                    {selectedExercise.equipment && (
                      <Text style={styles.exerciseDetailItem}>
                        <MaterialIcons name="build" size={16} color={Colors.primary} /> Equipment: {selectedExercise.equipment}
                      </Text>
                    )}
                    {selectedExercise.difficulty && (
                      <Text style={styles.exerciseDetailItem}>
                        <MaterialIcons name="trending-up" size={16} color={Colors.primary} /> Difficulty: {selectedExercise.difficulty}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {workoutType === 'cardiovascular' ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Duration (minutes) *</Text>
                    <TextInput
                      style={styles.input}
                      value={duration}
                      onChangeText={handleDurationChange}
                      keyboardType="numeric"
                      placeholder="30"
                    />
                    {/* Show calculated calories */}
                    {calculatedCalories !== null && duration && (
                      <View style={styles.caloriesPreview}>
                        <MaterialIcons name="local-fire-department" size={16} color={Colors.primary} />
                        <Text style={styles.caloriesPreviewText}>
                          Estimated calories: {calculatedCalories} cal
                          {user?.weight_kg && ` (based on ${user.weight_kg}kg weight)`}
                        </Text>
                      </View>
                    )}
                    {calculatingCalories && (
                      <View style={styles.caloriesPreview}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.caloriesPreviewText}>Calculating calories...</Text>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Sets *</Text>
                    <TextInput
                      style={styles.input}
                      value={sets}
                      onChangeText={setSets}
                      keyboardType="numeric"
                      placeholder="3"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Reps per Set *</Text>
                    <TextInput
                      style={styles.input}
                      value={reps}
                      onChangeText={setReps}
                      placeholder="8-10 or 8,8,6"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Weight per Set (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="numeric"
                      placeholder="60"
                    />
                  </View>
                </>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>RPE (Rate of Perceived Exertion 1-10)</Text>
                <TextInput
                  style={styles.input}
                  value={rpe}
                  onChangeText={setRpe}
                  keyboardType="numeric"
                  placeholder="7"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional notes..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Save Exercise"
                onPress={saveWorkout}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  profileImageContainer: {
    position: 'absolute',
    right: 20,
    top: 40,
    zIndex: 10, // Ensure it's above other content
  },
  header: {
    backgroundColor: Colors.primary,
    padding: ThemeTokens.spacing.lg,
    paddingTop: ThemeTokens.spacing.xl * 2,
    borderBottomLeftRadius: ThemeTokens.radius.xl,
    borderBottomRightRadius: ThemeTokens.radius.xl,
  },
  title: {
    fontSize: ThemeTokens.typography.headline,
    fontWeight: '800',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: ThemeTokens.spacing.xs,
  },
  dateCard: {
    margin: ThemeTokens.spacing.lg,
    marginTop: ThemeTokens.spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: ThemeTokens.spacing.sm,
  },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeTokens.spacing.sm,
  },
  dateButton: {
    padding: ThemeTokens.spacing.xs,
  },
  dateText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    minWidth: 200,
  },
  todayButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: ThemeTokens.spacing.md,
    paddingVertical: ThemeTokens.spacing.xs,
    borderRadius: ThemeTokens.radius.md,
    marginLeft: ThemeTokens.spacing.sm,
  },
  todayButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    margin: ThemeTokens.spacing.lg,
    marginTop: 0,
    marginBottom: ThemeTokens.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeTokens.spacing.md,
    paddingBottom: ThemeTokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeTokens.spacing.xs,
  },
  actionLink: {
    padding: ThemeTokens.spacing.xs,
  },
  actionLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionSeparator: {
    color: Colors.gray,
    marginHorizontal: ThemeTokens.spacing.xs,
  },
  totalsTable: {
    marginTop: ThemeTokens.spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: ThemeTokens.spacing.md,
    borderRadius: ThemeTokens.radius.md,
    marginBottom: ThemeTokens.spacing.xs,
  },
  tableHeaderText: {
    flex: 1,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: ThemeTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableLabel: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  tableValue: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  loggedExercises: {
    marginTop: ThemeTokens.spacing.md,
  },
  loggedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: ThemeTokens.spacing.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ThemeTokens.spacing.md,
    backgroundColor: Colors.lightGray,
    borderRadius: ThemeTokens.radius.md,
    marginBottom: ThemeTokens.spacing.xs,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: Colors.gray,
  },
  strengthTableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: ThemeTokens.spacing.md,
    borderRadius: ThemeTokens.radius.md,
    marginBottom: ThemeTokens.spacing.xs,
  },
  strengthHeaderText: {
    flex: 1,
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  strengthRow: {
    flexDirection: 'column',
    padding: ThemeTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  strengthExerciseInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthExerciseName: {
    // flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  deleteButton: {
    marginLeft: ThemeTokens.spacing.sm,
  },
  strengthValue: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    padding: ThemeTokens.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.gray,
    fontSize: 14,
    fontStyle: 'italic',
  },
  summaryCard: {
    margin: ThemeTokens.spacing.lg,
    marginTop: 0,
    marginBottom: ThemeTokens.spacing.xl,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: ThemeTokens.spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: ThemeTokens.spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: ThemeTokens.radius.xl,
    borderTopRightRadius: ThemeTokens.radius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ThemeTokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalBody: {
    padding: ThemeTokens.spacing.lg,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: ThemeTokens.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: ThemeTokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: ThemeTokens.radius.md,
    padding: ThemeTokens.spacing.md,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: ThemeTokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: ThemeTokens.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInputContainer: {
    position: 'relative',
  },
  searchIndicator: {
    position: 'absolute',
    right: ThemeTokens.spacing.md + 2,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  suggestionsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: ThemeTokens.radius.md,
    backgroundColor: 'white',
    marginTop: ThemeTokens.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ThemeTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  suggestionDetails: {
    fontSize: 12,
    color: Colors.gray,
  },
  exerciseDetailsCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: ThemeTokens.radius.md,
    padding: ThemeTokens.spacing.md,
    marginTop: ThemeTokens.spacing.sm,
  },
  exerciseDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: ThemeTokens.spacing.xs,
  },
  exerciseDetailItem: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: ThemeTokens.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeTokens.spacing.xs,
  },
  caloriesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ThemeTokens.spacing.xs,
    padding: ThemeTokens.spacing.sm,
    backgroundColor: Colors.lightGray,
    borderRadius: ThemeTokens.radius.md,
    gap: ThemeTokens.spacing.xs,
  },
  caloriesPreviewText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
});
