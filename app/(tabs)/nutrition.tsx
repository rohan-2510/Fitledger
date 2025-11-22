// app/(tabs)/nutrition.tsx
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card } from 'react-native-paper';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import api from '../api/apiClient';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { ProfileImageDisplay } from '../../components/ProfileImageDisplay'; // Import ProfileImageDisplay
import { ProfileModal } from '../../components/ProfileModal'; // Import ProfileModal
import { useRouter } from 'expo-router';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface Meal {
  id: string;
  name: string;
  foods: FoodItem[];
  time?: string;
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const NutritionScreen: React.FC = () => {
  const router = useRouter();
  const { user, isLoggedIn, signOut } = useAuth(); // Use useAuth hook
  const [meals, setMeals] = useState<Meal[]>([
    { id: '1', name: 'Breakfast', foods: [] },
    { id: '2', name: 'Lunch', foods: [] },
    { id: '3', name: 'Dinner', foods: [] },
    { id: '4', name: 'Snacks', foods: [] },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedMeal, setSelectedMeal] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false); // State for profile modal

  const nutritionGoals = {
    calories: 2000,
    protein: 120,
    carbs: 150,
    fat: 60,
  };

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

  // Calculate totals for all meals
  const total = meals.reduce(
    (acc, meal) => {
      const mealTotal = meal.foods.reduce(
        (mealAcc, food) => ({
          calories: mealAcc.calories + (food.calories || 0),
          protein: mealAcc.protein + (food.protein || 0),
          carbs: mealAcc.carbs + (food.carbs || 0),
          fat: mealAcc.fat + (food.fat || 0),
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

  const searchFoods = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError('Please enter a food name to search');
      return;
    }
    
    setSearchError('');
    setIsSearching(true);
    
    try {
      console.log('Searching for:', searchQuery);
      // apiClient.get already returns the parsed response.data
      const response = await api.get<ApiResponse<FoodItem>>(`/meals/food/?search=${encodeURIComponent(searchQuery)}`);
      console.log('Search response:', response);

      // API client returns the data directly (axios response.data), so response is already { results: [...], count: ... }
      if (response && response.results && Array.isArray(response.results)) {
        const foodItems = response.results.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fats || 0  // Backend uses 'fats', not 'fat'
        }));
        
        setSearchResults(foodItems);
        if (foodItems.length === 0) {
          setSearchError('No results found. Try a different search term.');
        }
      } else if (Array.isArray(response)) {
        // Handle case where API returns array directly (if pagination is disabled)
        const foodItems = response.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fats || 0
        }));
        setSearchResults(foodItems);
        if (foodItems.length === 0) {
          setSearchError('No results found. Try a different search term.');
        }
      } else {
        console.error('Unexpected API response format:', response);
        setSearchError('Invalid response from server');
        setSearchResults([]);
      }
    } catch (error) {
        let errorMessage = 'Failed to search for food. Please try again.';
        
        if (error instanceof Error) {
          console.error('Search error:', {
            message: error.message,
            status: (error as any).response?.status,
            data: (error as any).response?.data
          });
          errorMessage = (error as any).response?.data?.message || errorMessage;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setSearchError(errorMessage);
        setSearchResults([]);
      } finally {
      setIsSearching(false);
    }
  };

  const addFoodToMeal = async (food: FoodItem) => {
    if (!selectedMeal) {
      alert('Please select a meal first');
      return;
    }

    try {
      // Use food_id for backend, but allow it to be optional if custom_name is provided
      const logData: any = {
        custom_name: food.name,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fats: food.fat || 0,
        quantity: 1,
      };

      // If food has an ID (from database), use it, otherwise use custom_name only
      if (food.id && !isNaN(parseInt(food.id))) {
        logData.food_id = parseInt(food.id);
      }

      const response = await api.post('/meals/logs/', logData);
      
      // Add to local state
      setMeals(prevMeals => 
        prevMeals.map(meal => 
          meal.id === selectedMeal
            ? { ...meal, foods: [...meal.foods, food] }
            : meal
        )
      );
      
      setModalVisible(false);
      setSearchQuery('');
      setSearchResults([]);
      
      // Show success message
      alert('Food added successfully!');
    } catch (error: any) {
      console.error('Error adding food:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to add food. Please try again.';
      alert(errorMessage);
    }
  };

  const renderMealItem = ({ item }: { item: Meal }) => {
    const mealTotal = item.foods.reduce(
      (acc, food) => ({
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0),
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
            {item.foods.map((food, index) => (
              <View key={`food-${food.id}-${index}`} style={styles.foodItem}>
                <Text>{food.name}</Text>
                <Text>{food.calories} cal</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noFoodsText}>No foods added yet</Text>
        )}
        
        <View style={styles.macroBars}>
          <View 
            style={[
              styles.macroBar, 
              { 
                width: `${Math.min((mealTotal.protein / nutritionGoals.protein) * 100, 100)}%`,
                backgroundColor: Colors.protein
              }
            ]} 
          />
          <View 
            style={[
              styles.macroBar, 
              { 
                width: `${Math.min((mealTotal.carbs / nutritionGoals.carbs) * 100, 100)}%`,
                backgroundColor: Colors.carbs
              }
            ]} 
          />
          <View 
            style={[
              styles.macroBar, 
              { 
                width: `${Math.min((mealTotal.fat / nutritionGoals.fat) * 100, 100)}%`,
                backgroundColor: Colors.fat
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderMacroItem = (label: string, value: number, goal: number, color: string) => (
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
            <Text style={styles.summaryTitle}>Today&apos;s Intake</Text>
            
          </View>
          
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesValue}>{Math.round(total.calories)}</Text>
            <Text style={styles.caloriesLabel}>/ {nutritionGoals.calories} Calories</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min((total.calories / nutritionGoals.calories) * 100, 100)}%`,
                    backgroundColor: total.calories > nutritionGoals.calories ? Colors.error : Colors.success
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((total.calories / nutritionGoals.calories) * 100)}% of daily goal
            </Text>
          </View>
          
          <View style={styles.macrosContainer}>
            {renderMacroItem('Protein', total.protein, nutritionGoals.protein, Colors.protein)}
            {renderMacroItem('Carbs', total.carbs, nutritionGoals.carbs, Colors.carbs)}
            {renderMacroItem('Fat', total.fat, nutritionGoals.fat, Colors.fat)}
          </View>
        </Card>

        <View style={styles.mealListHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
          <Text style={styles.seeAllText}>See All</Text>
        </View>
        
        <FlatList
          data={meals}
          renderItem={renderMealItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.mealList}
        />
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
            <Card.Title title="Log Food" />
            <Card.Content>
              <Text style={styles.mealSelectLabel}>Select Meal:</Text>
              <View style={styles.mealButtons}>
                {meals.map((meal) => (
                  <Button
                    key={meal.id}
                    title={meal.name}
                    variant={selectedMeal === meal.id ? 'primary' : 'outline'}
                    onPress={() => setSelectedMeal(meal.id)}
                    style={styles.mealButton}
                  />
                ))}
              </View>
            
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for food..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={searchFoods}
                  placeholderTextColor={Colors.gray}
                />
                <Button
                  title={isSearching ? 'Searching...' : 'Search'}
                  onPress={searchFoods}
                  variant="primary"
                  style={styles.searchButton}
                  disabled={isSearching}
                />
              </View>
              
              {searchError ? (
                <Text style={styles.errorText}>{searchError}</Text>
              ) : null}
              
              {isSearching ? (
                <Text style={styles.loadingText}>Searching for food items...</Text>
              ) : null}
              
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.foodItem}
                    onPress={() => addFoodToMeal(item)}
                  >
                    <Text style={styles.foodItemName}>{item.name}</Text>
                    <Text style={styles.foodItemCalories}>{item.calories} cal</Text>
                  </TouchableOpacity>
                )}
                style={styles.searchResults}
                keyboardShouldPersistTaps="handled"
              />
            </Card.Content>
            <Card.Actions style={styles.modalActions}>
              <Button 
                title="Cancel" 
                onPress={() => setModalVisible(false)} 
                variant="outline"
              />
            </Card.Actions>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  foodItemName: {
    fontSize: 14,
    color: Colors.text,
  },
  foodItemCalories: {
    fontSize: 14,
    color: Colors.gray,
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
  mealSelectLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.text,
    fontWeight: '500',
  },
  mealButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  mealButton: {
    marginRight: 8,
    marginBottom: 8,
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
});

export default NutritionScreen;
