// app/(tabs)/nutrition.tsx
import { db } from '@/utils/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card } from 'react-native-paper';
import { Button } from '../../components/Button';
import { ProfileImageDisplay } from '../../components/ProfileImageDisplay';
import { ProfileModal } from '../../components/ProfileModal';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useFoodSearch } from '../../hooks/use-food-search';


interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number; 
  source?: 'USDA' | 'Gemini';
  mealEntryId?: string; // Unique ID for the meal entry in Firestore
}

interface Meal {
  id: string;
  name: string;
  foods: FoodItem[];
  time?: string;
  date?: string; // ISO date string for filtering
}

type MealSection = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

const NutritionScreen: React.FC = () => {
  const router = useRouter();
  const { user, isLoggedIn, signOut, triggerDashboardRefresh } = useAuth(); // Destructure triggerDashboardRefresh
  const { searchFoods: searchFoodsAPI, isLoading: isFoodSearchLoading, error: foodSearchError } = useFoodSearch();
  const [meals, setMeals] = useState<Meal[]>([
    { id: '1', name: 'Breakfast', foods: [] },
    { id: '2', name: 'Lunch', foods: [] },
    { id: '3', name: 'Dinner', foods: [] },
    { id: '4', name: 'Snacks', foods: [] },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<MealSection>('Breakfast');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const MEAL_SECTIONS: MealSection[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  // Load meals from Firebase on mount and when user/date changes
  useEffect(() => {
    if (user?.id && isLoggedIn) {
      loadMeals();
    } else {
      setMeals([
        { id: '1', name: 'Breakfast', foods: [] },
        { id: '2', name: 'Lunch', foods: [] },
        { id: '3', name: 'Dinner', foods: [] },
        { id: '4', name: 'Snacks', foods: [] },
      ]);
    }
  }, [user?.id, isLoggedIn, selectedDate]);

  // When user logs out, reset all relevant states
  useEffect(() => {
    if (!isLoggedIn) {
      setSelectedDate(new Date());
      setMeals([
        { id: '1', name: 'Breakfast', foods: [] },
        { id: '2', name: 'Lunch', foods: [] },
        { id: '3', name: 'Dinner', foods: [] },
        { id: '4', name: 'Snacks', foods: [] },
      ]);
      setSearchQuery('');
      setQuantity('100');
      setSearchResults([]);
      setSearchError('');
      setIsSearching(false);
    }
  }, [isLoggedIn]);

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

  const loadMeals = async () => {
    if (!user?.id) return;
    
    try {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const nutritionDocRef = doc(db, "nutrition", user.id);
      const nutritionDocSnap = await getDoc(nutritionDocRef);
      
      if (nutritionDocSnap.exists()) {
        const data = nutritionDocSnap.data();
        const mealsArray = Array.isArray(data.meals) ? data.meals : [];
        
        // Filter meals for selected date
        const selectedDateMeals = mealsArray.filter((meal: any) => {
          if (!meal.date) return false;
          return meal.date === selectedDateStr;
        });
        
        // Initialize meal structure with today's foods
        const mealStructure: Meal[] = [
          { id: '1', name: 'Breakfast', foods: [] },
          { id: '2', name: 'Lunch', foods: [] },
          { id: '3', name: 'Dinner', foods: [] },
          { id: '4', name: 'Snacks', foods: [] },
        ];
        
        // Populate meals with selected date's foods
        selectedDateMeals.forEach((meal: any) => {
          const mealIndex = mealStructure.findIndex(m => m.name === meal.meal_name);
          if (mealIndex !== -1 && meal.food) {
            const foodItem: FoodItem = {
              id: meal.food.id || '',
              name: meal.food.name || '',
              calories: meal.food.calories || 0,
              protein: meal.food.protein || 0,
              carbs: meal.food.carbs || 0,
              fat: meal.food.fat || 0, //changed
              source: meal.food.source,
              mealEntryId: meal.id, // Store the unique meal entry ID
            };
            mealStructure[mealIndex].foods.push(foodItem);
          }
        });
        
        setMeals(mealStructure);
      } else {
        // Initialize with empty meals
        setMeals([
          { id: '1', name: 'Breakfast', foods: [] },
          { id: '2', name: 'Lunch', foods: [] },
          { id: '3', name: 'Dinner', foods: [] },
          { id: '4', name: 'Snacks', foods: [] },
        ]);
      }
    } catch (error: any) {
      console.error('Error loading meals:', error);
      Alert.alert('Error', 'Failed to load meals. Please try again.');
      setMeals([
        { id: '1', name: 'Breakfast', foods: [] },
        { id: '2', name: 'Lunch', foods: [] },
        { id: '3', name: 'Dinner', foods: [] },
        { id: '4', name: 'Snacks', foods: [] },
      ]);
    }
  };

  // Removed static nutritionGoals object

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

  // Calculate totals for all meals
  const total = meals.reduce(
    (acc, meal) => {
      const mealTotal = meal.foods.reduce(
        (mealAcc, food) => ({
          calories: mealAcc.calories + (food.calories || 0),
          protein: mealAcc.protein + (food.protein || 0),
          carbs: mealAcc.carbs + (food.carbs || 0),
          fat: mealAcc.fat + (food.fat || 0), //changed
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      return {
        calories: acc.calories + mealTotal.calories,
        protein: acc.protein + mealTotal.protein,
        carbs: acc.carbs + mealTotal.carbs,
        fat: acc.fat + mealTotal.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Search function using Hugging Face dataset
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    
    setSearchError('');
    setIsSearching(true);
    
    try {
      console.log('Searching food database for:', query);
      const results = await searchFoodsAPI(query);
      
      if (results && results.length > 0) {
        setSearchResults(results);
        setSearchError('');
      } else {
        setSearchError('No results found. Try a different search term.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching foods:', error);
      setSearchError(foodSearchError || 'Failed to search foods. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const searchFoods = async () => {
    await performSearch(searchQuery);
  };

  // Handle search query change
  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setSearchError('');
    }
  };

  const deleteFoodFromMeal = async (mealName: string, mealEntryId: string, foodName: string) => {
    console.log('DELETE BUTTON CLICKED!', { mealName, mealEntryId, foodName });
    
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to delete meals.');
      return;
    }

    // Temporary: delete immediately without confirmation for testing
    console.log('Starting deletion process...');
    try {
      if (!user?.id) {
        console.log('ERROR: User not authenticated');
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      console.log('User ID:', user.id);
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      console.log('Selected date:', selectedDateStr);
      
      const nutritionDocRef = doc(db, "nutrition", user.id);
      console.log('Fetching nutrition document...');
      const nutritionDocSnap = await getDoc(nutritionDocRef);

      if (nutritionDocSnap.exists()) {
        console.log('Document exists!');
        const data = nutritionDocSnap.data();
        const mealsArray = Array.isArray(data.meals) ? data.meals : [];

        console.log('Before delete - Total meals:', mealsArray.length);
        console.log('Deleting meal entry with ID:', mealEntryId);

        // Filter out the food item to delete using the unique meal entry ID
        const updatedMeals = mealsArray.filter((meal: any) => {
          const matches = meal.id === mealEntryId;
          
          if (matches) {
            console.log('Found matching meal to delete:', meal);
          }
          
          // Keep meals that don't match the meal entry ID
          return !matches;
        });

        console.log('After delete - Total meals:', updatedMeals.length);
        console.log('Updating Firestore...');
        await updateDoc(nutritionDocRef, { meals: updatedMeals });
        console.log('Firestore updated successfully!');
        
        // Reload meals to update UI
        console.log('Reloading meals...');
        await loadMeals();
        console.log('Meals reloaded!');
        
        Alert.alert('Success', 'Food deleted successfully!');
        triggerDashboardRefresh();
      } else {
        console.log('ERROR: Document does not exist');
        Alert.alert('Error', 'No nutrition data found');
      }
    } catch (error: any) {
      console.error('Error deleting food:', error);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', 'Failed to delete food. Please try again.');
    }
  };

  const addFoodToMeal = async (food: FoodItem) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to save meals.');
      return;
    }
    
    const quantityNum = parseFloat(quantity) || 100;
    const multiplier = quantityNum / 100;
    
    console.log('Adding food:', food, 'with quantity:', quantityNum);

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentHour = now.getHours();
      
      let mealName = selectedSection;
      
      const mealLogData = {
        id: `${user.id}_${Date.now()}`,
        meal_name: mealName,
        food: {
          id: food.id,
          name: `${food.name} (${quantityNum}g)`,
          calories: Math.round((food.calories || 0) * multiplier),
          protein: Math.round((food.protein || 0) * multiplier),
          carbs: Math.round((food.carbs || 0) * multiplier),
          fat: Math.round((food.fat || 0) * multiplier),
          source: food.source,
        },
        date: today,
        timestamp: new Date().toISOString(),
      };

      // Use document ID that matches user.id
      const nutritionDocRef = doc(db, "nutrition", user.id);
      const nutritionDocSnap = await getDoc(nutritionDocRef);

      if (nutritionDocSnap.exists()) {
        // If the document exists, update it by adding the new meal log
        const prevData = nutritionDocSnap.data();
        // Ensure prevData.meals is an array
        const updatedMeals = Array.isArray(prevData.meals)
          ? [...prevData.meals, mealLogData]
          : [mealLogData];
        await updateDoc(nutritionDocRef, { meals: updatedMeals });
      } else {
        // If not exists, create a new doc with meals as an array
        await setDoc(nutritionDocRef, {
          meals: [mealLogData],
        });
      }
      
      // Reload meals from Firebase to ensure UI is updated
      await loadMeals();
      
      setModalVisible(false);
      setSearchQuery('');
      setQuantity('100');
      setSearchResults([]);
      
      // Show success message
      Alert.alert('Success', `Food added to ${mealName} successfully!`);
      triggerDashboardRefresh(); // Trigger dashboard refresh
    } catch (error: any) {
      console.error('Error adding food:', error);
      const errorMessage = error.message || 'Failed to add food. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const renderMealItem = ({ item }: { item: Meal }) => {
    const mealTotal = item.foods.reduce(
      (acc, food) => ({
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0),//changed one at right
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return (
      <View style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealName}>{item.name}</Text>
          {item.time && <Text style={styles.mealTime}>{item.time}</Text>}
          <Text style={styles.mealCalories}>{mealTotal.calories} cal</Text>
        </View>
        
        {item.foods.length > 0 ? (
          <View style={styles.mealItems}>
            {item.foods.map((food, index) => {
              console.log('Rendering food:', { name: food.name, id: food.id, mealEntryId: food.mealEntryId });
              return (
                <View key={`food-${food.id}-${index}`} style={styles.foodItem}>
                  <View style={styles.foodItemInfo}>
                    <Text style={styles.foodItemName}>{food.name}</Text>
                    <Text style={styles.foodItemCalories}>{food.calories} cal</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('TouchableOpacity pressed!');
                      deleteFoodFromMeal(item.name, food.mealEntryId || food.id, food.name);
                    }}
                    style={styles.deleteButton}
                    activeOpacity={0.6}
                  >
                    <MaterialIcons name="delete" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noFoodsText}>No foods added yet</Text>
        )}
        
        <View style={styles.macroBars}>
          <View 
            style={[
              styles.macroBar, 
              { 
                width: `${Math.min((mealTotal.protein / (user?.macros?.protein || 1)) * 100, 100)}%`,
                backgroundColor: Colors.protein
              }
            ]} 
          />
          <View 
            style={[
              styles.macroBar, 
              { 
                width: `${Math.min((mealTotal.carbs / (user?.macros?.carbs || 1)) * 100, 100)}%`,
                backgroundColor: Colors.carbs
              }
            ]} 
          />
          <View 
            style={[
              styles.macroBar, 
              { 
                width: `${Math.min((mealTotal.fat / (user?.macros?.fat || 1)) * 100, 100)}%`,
                backgroundColor: Colors.fat
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderMacroItem = (label: string, value: number, color: string, goal: number) => (
    <View style={styles.macroItem}>
      <View style={styles.macroLabelContainer}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
      <Text style={styles.macroValue}>
        {Math.round(value)}g / {goal}g
      </Text>
    </View>
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
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Nutrition</Text>
            <Text style={styles.subtitle}>Track your daily intake</Text>
          </View>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Daily Intake</Text>
            
          </View>
          
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesValue}>{Math.round(total.calories)}</Text>
            <Text style={styles.caloriesLabel}>/ {user?.macros?.calories || 0} Calories</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min((total.calories / (user?.macros?.calories || 1)) * 100, 100)}%`,
                    backgroundColor: total.calories > (user?.macros?.calories || 0) ? Colors.error : Colors.success
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((total.calories / (user?.macros?.calories || 1)) * 100)}% of daily goal
            </Text>
          </View>
          
          <View style={styles.macrosContainer}>
            {renderMacroItem('Protein', total.protein, Colors.protein, user?.macros?.protein || 0)}
            {renderMacroItem('Carbs', total.carbs, Colors.carbs, user?.macros?.carbs || 0)}
            {renderMacroItem('Fat', total.fat, Colors.fat, user?.macros?.fat || 0)}
          </View>
        </Card>

        {/* Date Selector */}
        <Card style={styles.dateCard}>
          <View style={styles.dateSelector}>
            <Text style={styles.dateLabel}>Your Nutrition Diary for:</Text>
            <View style={styles.dateControls}>
              <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateButton}>
                <MaterialIcons name="chevron-left" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
              <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateButton}>
                <MaterialIcons name="chevron-right" size={24} color={Colors.primary} />
              </TouchableOpacity>
              {/* {!isSameDay(selectedDate, new Date()) && (
                <TouchableOpacity onPress={() => setSelectedDate(new Date())} style={styles.todayButton}>
                  <Text style={styles.todayButtonText}>Today</Text>
                </TouchableOpacity>
              )} */}
            </View>
          </View>
        </Card>

        <View style={styles.mealListHeader}>
          <Text style={styles.sectionTitle}>Meals</Text>
        </View>
        
        <View style={styles.mealList}>
          {meals.map((meal) => (
            <View key={meal.id}>
              {renderMealItem({ item: meal })}
            </View>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.fabContainer}>
        <Button 
          variant="primary"
          onPress={() => setModalVisible(true)} 
          style={styles.fabButton}
          icon={<MaterialIcons name="add" size={24} color="white" />}
          title="Add Food"
        />
      </View>

      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Title title="Add Food" />
            <Card.Content>
              <View style={styles.sectionButtonsContainer}>
                {MEAL_SECTIONS.map((section) => (
                  <Button
                    key={section}
                    title={section}
                    onPress={() => setSelectedSection(section)}
                    variant={selectedSection === section ? 'primary' : 'outline'}
                    style={styles.sectionButton}
                  />
                ))}
              </View>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantity (grams):</Text>
                <TextInput
                  style={styles.quantityInput}
                  placeholder="100"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.gray}
                />
              </View>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter food item (e.g. rice, chicken)"
                  value={searchQuery}
                  onChangeText={handleSearchQueryChange}
                  onSubmitEditing={searchFoods}
                  placeholderTextColor={Colors.gray}
                />
                <Button
                  title={isSearching || isFoodSearchLoading ? 'Searching...' : 'Search'}
                  onPress={searchFoods}
                  variant="primary"
                  style={styles.searchButton}
                  disabled={isSearching || isFoodSearchLoading}
                />
              </View>
              
              {searchError || foodSearchError ? (
                <Text style={styles.errorText}>{searchError || foodSearchError}</Text>
              ) : null}
              
              {isSearching || isFoodSearchLoading ? (
                <Text style={styles.loadingText}>
                  Getting food macros...
                </Text>
              ) : null}
              
              <ScrollView 
                style={styles.searchResults}
                keyboardShouldPersistTaps="handled"
              >
                {searchResults.map((item) => (
                  <TouchableOpacity 
                    key={item.id}
                    style={styles.foodItem}
                    onPress={() => addFoodToMeal(item)}
                  >
                    <Text style={styles.foodItemName}>{item.name}</Text>
                    <Text style={styles.foodItemCalories}>{item.calories} cal</Text>
                  </TouchableOpacity>
                ))}
                <Card.Actions style={styles.modalActions}>
                  <Button 
                    title="Cancel" 
                    onPress={() => setModalVisible(false)} 
                    variant="outline"
                  />
                </Card.Actions>
              </ScrollView>
            </Card.Content>
            
          </Card>
        </View>
      </Modal>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  profileImageContainer: {
    position: 'absolute',
    right: 20,
    top: 40,
    zIndex: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  summaryCard: {
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 8,
  },
  caloriesLabel: {
    fontSize: 16,
    color: Colors.gray,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'right',
  },
  macrosContainer: {
    marginTop: 16,
  },
  macroItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  macroLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  mealListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
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
  mealList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  mealTime: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  mealCalories: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  mealItems: {
    marginTop: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  foodItemInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12,
  },
  foodItemName: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  foodItemCalories: {
    fontSize: 14,
    color: Colors.gray,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  },
  noFoodsText: {
    color: Colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
  macroBars: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
  },
  macroBar: {
    height: '100%',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fabButton: {
    borderRadius: 28,
    paddingHorizontal: 24,
    height: 56,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 12,
  },
  modalActions: {
    justifyContent: 'flex-end',
    padding: 16,
  },
  quantityContainer: {
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 16,
    height: 48,
    justifyContent: 'center',
  },
  searchResults: {
    maxHeight: 300,
  },
  errorText: {
    color: Colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingText: {
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  sectionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionButton: {
    width: '48%', // Roughly half minus margin
    marginVertical: 5,
    marginHorizontal: '1%',
  },
  selectedSectionButton: {
    backgroundColor: Colors.primary,
  },
  dateCard: {
    margin: 20,
    marginTop: 10,
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
    marginBottom: 8,
  },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    padding: 8,
  },
  dateText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    minWidth: 200,
  },
  todayButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  todayButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default NutritionScreen;
