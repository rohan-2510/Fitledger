
const API_NINJAS_KEY = process.env.EXPO_PUBLIC_API_NINJAS_KEY || 'YOUR_API_KEY_HERE';

const EXERCISE_API_BASE = 'https://api.api-ninjas.com/v1';

interface ExerciseInfo {
  name: string;
  calories_per_hour?: number;
  duration_minutes?: number;
  total_calories?: number;
}

interface ExerciseSearchResult {
  name: string;
  type?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  instructions?: string;
}

// Cache for exercise data (in-memory cache for session)
const exerciseCache = new Map<string, ExerciseInfo[]>();
const exerciseSearchCache = new Map<string, ExerciseSearchResult[]>();

/**
 * Calculate calories burned for a specific exercise
 */
export const calculateCaloriesBurned = async (
  activity: string,
  durationMinutes: number,
  userWeightKg: number = 70
): Promise<number> => {
  // Fallback if no API key
  if (!API_NINJAS_KEY || API_NINJAS_KEY === 'YOUR_API_KEY_HERE') {
    console.warn('API Ninjas key not configured. Using fallback calculation.');
    return Math.round(durationMinutes * 10); // Fallback: 10 cal/min
  }

  // Check cache first
  const cacheKey = `${activity.toLowerCase()}_${userWeightKg}`;
  if (exerciseCache.has(cacheKey)) {
    const cached = exerciseCache.get(cacheKey) || [];
    const match = cached.find((e) => e.name.toLowerCase() === activity.toLowerCase());
    if (match && match.calories_per_hour) {
      return Math.round((match.calories_per_hour / 60) * durationMinutes);
    }
  }

  try {
    const response = await fetch(
      `${EXERCISE_API_BASE}/caloriesburned?activity=${encodeURIComponent(activity)}&weight=${userWeightKg}&duration=${durationMinutes}`,
      {
        headers: {
          'X-Api-Key': API_NINJAS_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: ExerciseInfo[] = await response.json();
    
    if (data && data.length > 0) {
      // Cache the result
      exerciseCache.set(cacheKey, data);
      const exercise = data[0];
      return exercise.total_calories || Math.round((exercise.calories_per_hour || 600) / 60 * durationMinutes);
    }

    // Fallback calculation if API doesn't return data
    return Math.round(durationMinutes * 10);
  } catch (error) {
    console.error('Error calculating calories:', error);
    // Fallback calculation on error
    return Math.round(durationMinutes * 10);
  }
};

/**
 * Search for exercises by name or category
 */
export const searchExercises = async (
  query: string,
  exerciseType: 'cardio' | 'strength' | 'all' = 'all'
): Promise<ExerciseSearchResult[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  // Check cache
  const cacheKey = `${query.toLowerCase()}_${exerciseType}`;
  if (exerciseSearchCache.has(cacheKey)) {
    return exerciseSearchCache.get(cacheKey) || [];
  }

  // If no API key, return empty (you can add a local database here)
  if (!API_NINJAS_KEY || API_NINJAS_KEY === 'YOUR_API_KEY_HERE') {
    return getLocalExerciseSuggestions(query, exerciseType);
  }

  try {
    // Search exercises using Exercise API
    const response = await fetch(
      `${EXERCISE_API_BASE}/exercises?name=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-Api-Key': API_NINJAS_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: ExerciseSearchResult[] = await response.json();
    
    // Filter by type if specified
    let filtered = data;
    if (exerciseType === 'cardio') {
      filtered = data.filter((e) => 
        e.type?.toLowerCase().includes('cardio') ||
        e.type?.toLowerCase().includes('aerobic') ||
        ['running', 'cycling', 'swimming', 'walking', 'jogging'].some(name => 
          e.name.toLowerCase().includes(name)
        )
      );
    } else if (exerciseType === 'strength') {
      filtered = data.filter((e) => 
        e.type?.toLowerCase().includes('strength') ||
        e.type?.toLowerCase().includes('weight') ||
        !e.type?.toLowerCase().includes('cardio')
      );
    }

    // Cache results
    exerciseSearchCache.set(cacheKey, filtered);
    return filtered.slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error('Error searching exercises:', error);
    return getLocalExerciseSuggestions(query, exerciseType);
  }
};

/**
 * Get local exercise suggestions (fallback when API is unavailable)
 */
const getLocalExerciseSuggestions = (
  query: string,
  exerciseType: 'cardio' | 'strength' | 'all'
): ExerciseSearchResult[] => {
  const queryLower = query.toLowerCase();

  const allExercises: ExerciseSearchResult[] = [
    // Cardiovascular exercises
    { name: 'Running', type: 'cardio', muscle: 'legs', difficulty: 'beginner' },
    { name: 'Jogging', type: 'cardio', muscle: 'legs', difficulty: 'beginner' },
    { name: 'Walking', type: 'cardio', muscle: 'legs', difficulty: 'beginner' },
    { name: 'Cycling', type: 'cardio', muscle: 'legs', difficulty: 'beginner' },
    { name: 'Swimming', type: 'cardio', muscle: 'full body', difficulty: 'intermediate' },
    { name: 'Rowing', type: 'cardio', muscle: 'full body', difficulty: 'intermediate' },
    { name: 'Elliptical', type: 'cardio', muscle: 'legs', difficulty: 'beginner' },
    { name: 'Stair Climbing', type: 'cardio', muscle: 'legs', difficulty: 'intermediate' },
    { name: 'HIIT', type: 'cardio', muscle: 'full body', difficulty: 'advanced' },
    { name: 'Jump Rope', type: 'cardio', muscle: 'legs', difficulty: 'intermediate' },
    
    // Strength exercises
    { name: 'Bench Press', type: 'strength', muscle: 'chest', equipment: 'barbell', difficulty: 'intermediate' },
    { name: 'Squat', type: 'strength', muscle: 'legs', equipment: 'barbell', difficulty: 'intermediate' },
    { name: 'Deadlift', type: 'strength', muscle: 'back', equipment: 'barbell', difficulty: 'advanced' },
    { name: 'Overhead Press', type: 'strength', muscle: 'shoulders', equipment: 'barbell', difficulty: 'intermediate' },
    { name: 'Bicep Curl', type: 'strength', muscle: 'biceps', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Tricep Extension', type: 'strength', muscle: 'triceps', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Pull-ups', type: 'strength', muscle: 'back', equipment: 'pull-up bar', difficulty: 'intermediate' },
    { name: 'Push-ups', type: 'strength', muscle: 'chest', equipment: 'none', difficulty: 'beginner' },
    { name: 'Dips', type: 'strength', muscle: 'triceps', equipment: 'dip bar', difficulty: 'intermediate' },
    { name: 'Lunges', type: 'strength', muscle: 'legs', equipment: 'none', difficulty: 'beginner' },
  ];

  let filtered = allExercises;
  
  if (exerciseType === 'cardio') {
    filtered = allExercises.filter((e) => e.type === 'cardio');
  } else if (exerciseType === 'strength') {
    filtered = allExercises.filter((e) => e.type === 'strength');
  }

  return filtered.filter((e) => 
    e.name.toLowerCase().includes(queryLower)
  ).slice(0, 10);
};

/**
 * Get exercise details by name
 */
export const getExerciseDetails = async (exerciseName: string): Promise<ExerciseSearchResult | null> => {
  if (!API_NINJAS_KEY || API_NINJAS_KEY === 'YOUR_API_KEY_HERE') {
    const local = getLocalExerciseSuggestions(exerciseName, 'all');
    return local[0] || null;
  }

  try {
    const results = await searchExercises(exerciseName, 'all');
    return results.find((e) => e.name.toLowerCase() === exerciseName.toLowerCase()) || results[0] || null;
  } catch (error) {
    console.error('Error getting exercise details:', error);
    return null;
  }
};

