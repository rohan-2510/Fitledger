import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';

// Mock data for meals
const meals = [
  {
    id: '1',
    name: 'Breakfast',
    calories: 420,
    protein: 25,
    carbs: 45,
    fat: 12,
    time: '8:00 AM',
    items: ['Oatmeal', 'Banana', 'Almond Butter']
  },
  {
    id: '2',
    name: 'Lunch',
    calories: 650,
    protein: 35,
    carbs: 55,
    fat: 20,
    time: '1:00 PM',
    items: ['Grilled Chicken', 'Brown Rice', 'Steamed Vegetables']
  },
  {
    id: '3',
    name: 'Snack',
    calories: 280,
    protein: 15,
    carbs: 30,
    fat: 10,
    time: '4:30 PM',
    items: ['Greek Yogurt', 'Mixed Berries']
  },
  {
    id: '4',
    name: 'Dinner',
    calories: 580,
    protein: 40,
    carbs: 35,
    fat: 25,
    time: '8:00 PM',
    items: ['Salmon', 'Quinoa', 'Asparagus']
  },
];

const nutritionGoals = {
  calories: 2000,
  protein: 120,
  carbs: 150,
  fat: 60,
};

export default function NutritionScreen() {
  const total = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const renderMacroItem = (label: string, value: number, goal: number, color: string) => (
    <View style={styles.macroItem}>
      <View style={styles.macroLabelContainer}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
      <Text style={styles.macroValue}>
        {value}g / {goal}g
      </Text>
    </View>
  );

  const renderMealItem = ({ item }: { item: typeof meals[0] }) => (
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View>
          <Text style={styles.mealName}>{item.name}</Text>
          <Text style={styles.mealTime}>{item.time}</Text>
        </View>
        <Text style={styles.mealCalories}>{item.calories} cal</Text>
      </View>
      
      <View style={styles.macroBars}>
        <View style={[styles.macroBar, { 
          width: `${(item.protein / 50) * 100}%`, 
          backgroundColor: Colors.protein 
        }]} />
        <View style={[styles.macroBar, { 
          width: `${(item.carbs / 100) * 100}%`, 
          backgroundColor: Colors.carbs 
        }]} />
        <View style={[styles.macroBar, { 
          width: `${(item.fat / 50) * 100}%`, 
          backgroundColor: Colors.fat 
        }]} />
      </View>
      
      <View style={styles.mealItems}>
        {item.items.map((food, index) => (
          <View key={index} style={styles.foodItem}>
            <View style={styles.foodDot} />
            <Text style={styles.foodName}>{food}</Text>
          </View>
        ))}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Nutrition</Text>
            <Text style={styles.subtitle}>Track your daily intake</Text>
          </View>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100' }}
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* Daily Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Today's Intake</Text>
            <Button 
              title="Add Meal" 
              variant="outline" 
              onPress={() => {}} 
              style={styles.addButton}
              icon={<MaterialIcons name="add" size={20} color={Colors.primary} />}
            />
          </View>
          
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesValue}>{total.calories}</Text>
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

        {/* Meal List */}
        <View style={styles.mealListHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
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
      
      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <Button 
          title="Add Food" 
          onPress={() => {}} 
          style={styles.fabButton}
          icon={<MaterialIcons name="add" size={24} color="white" />}
        />
      </View>
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
    paddingBottom: 90, // Space for FAB
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
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  summaryCard: {
    margin: 20,
    marginTop: 10,
    padding: 20,
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
    marginBottom: 16,
    padding: 16,
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
  macroBars: {
    flexDirection: 'row',
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  macroBar: {
    height: '100%',
  },
  mealItems: {
    marginTop: 8,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  foodDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray,
    marginRight: 8,
  },
  foodName: {
    fontSize: 14,
    color: Colors.text,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabButton: {
    width: '90%',
    borderRadius: 25,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
