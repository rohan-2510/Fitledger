import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { ThemeTokens } from '../../constants/ThemeTokens';

// Mock data for workouts
const workoutPlans = [
  {
    id: '1',
    name: 'Chest & Triceps',
    duration: '45 min',
    exercises: 8,
    calories: 420,
    difficulty: 'Intermediate',
    image: 'https://via.placeholder.com/150/2563eb/ffffff?text=Chest',
    completed: 3,
    total: 5,
  },
  {
    id: '2',
    name: 'Back & Biceps',
    duration: '50 min',
    exercises: 7,
    calories: 380,
    difficulty: 'Intermediate',
    image: 'https://via.placeholder.com/150/10b981/ffffff?text=Back',
    completed: 2,
    total: 5,
  },
  {
    id: '3',
    name: 'Leg Day',
    duration: '60 min',
    exercises: 6,
    calories: 520,
    difficulty: 'Advanced',
    image: 'https://via.placeholder.com/150/f59e0b/ffffff?text=Legs',
    completed: 1,
    total: 5,
  },
];

const recentWorkouts = [
  {
    id: '1',
    name: 'Full Body HIIT',
    date: 'Today, 8:00 AM',
    duration: '35 min',
    calories: 480,
    type: 'HIIT',
  },
  {
    id: '2',
    name: 'Yoga Flow',
    date: 'Yesterday, 7:30 AM',
    duration: '45 min',
    calories: 280,
    type: 'Yoga',
  },
];

export default function WorkoutScreen() {
  const renderWorkoutPlan = ({ item }: { item: typeof workoutPlans[0] }) => (
    <Card style={styles.workoutCard}>
      <Image source={{ uri: item.image }} style={styles.workoutImage} />
      <View style={styles.workoutInfo}>
        <View style={styles.workoutHeader}>
          <Text style={styles.workoutName}>{item.name}</Text>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
        </View>
        
        <View style={styles.workoutStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="timer" size={16} color={Colors.gray} />
            <Text style={styles.statText}>{item.duration}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="fitness-center" size={16} color={Colors.gray} />
            <Text style={styles.statText}>{item.exercises} exercises</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="local-fire-department" size={16} color={Colors.gray} />
            <Text style={styles.statText}>{item.calories} cal</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>Progress</Text>
            <Text style={styles.progressCount}>
              {item.completed}/{item.total} workouts
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(item.completed / item.total) * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        <Button 
          title="Start Workout" 
          onPress={() => {}} 
          style={styles.startButton}
          variant="outline"
        />
      </View>
    </Card>
  );

  const renderRecentWorkout = ({ item }: { item: typeof recentWorkouts[0] }) => (
    <View style={styles.recentWorkoutCard}>
      <View style={styles.recentWorkoutIcon}>
        <Ionicons 
          name={item.type === 'HIIT' ? 'flash' : 'body'} 
          size={20} 
          color="white" 
        />
      </View>
      <View style={styles.recentWorkoutInfo}>
        <Text style={styles.recentWorkoutName}>{item.name}</Text>
        <Text style={styles.recentWorkoutDate}>{item.date}</Text>
      </View>
      <View style={styles.recentWorkoutStats}>
        <Text style={styles.recentWorkoutDuration}>{item.duration}</Text>
        <Text style={styles.recentWorkoutCalories}>{item.calories} cal</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Workout</Text>
            <Text style={styles.subtitle}>Stay active, stay healthy</Text>
          </View>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100' }}
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button 
            title="Start Workout" 
            onPress={() => {}} 
            style={styles.quickActionButton}
            icon={<Ionicons name="add" size={20} color="white" />}
          />
          <Button 
            title="Quick Start" 
            onPress={() => {}} 
            variant="outline"
            style={styles.quickActionButton}
            icon={<Ionicons name="play" size={16} color={Colors.primary} />}
          />
        </View>

        {/* Workout Plans */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Plans</Text>
          <Text style={styles.seeAllText}>See All</Text>
        </View>
        
        <FlatList
          data={workoutPlans}
          renderItem={renderWorkoutPlan}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.workoutList}
        />

        {/* Recent Workouts */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <Text style={styles.seeAllText}>See All</Text>
        </View>
        
        <FlatList
          data={recentWorkouts}
          renderItem={renderRecentWorkout}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.recentWorkoutsList}
        />

        {/* Workout Categories */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.seeAllText}>See All</Text>
        </View>
        
        <View style={styles.categoriesContainer}>
        {[
            { name: 'Strength', icon: 'barbell-outline' as const, color: '#3b82f6' },
            { name: 'Cardio', icon: 'bicycle-outline' as const, color: '#ef4444' },
            { name: 'Yoga', icon: 'body' as const, color: '#10b981' },
            { name: 'HIIT', icon: 'flash-outline' as const, color: '#f59e0b' },
        ].map((category, index) => (
            <TouchableOpacity key={index} style={styles.categoryCard}>
            <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                <Ionicons name={category.icon} size={24} color={category.color} />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
        ))}
        </View>
      </ScrollView>
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
    paddingBottom: 20,
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    height: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
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
  workoutList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  workoutCard: {
    width: 280,
    marginRight: 16,
    padding: 0,
    overflow: 'hidden',
  },
  workoutImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.lightGray,
  },
  workoutInfo: {
    padding: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: Colors.gray,
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.gray,
  },
  progressCount: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  startButton: {
    width: '100%',
    borderRadius: 8,
  },
  recentWorkoutsList: {
    paddingHorizontal: 20,
  },
  recentWorkoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recentWorkoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentWorkoutInfo: {
    flex: 1,
  },
  recentWorkoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  recentWorkoutDate: {
    fontSize: 12,
    color: Colors.gray,
  },
  recentWorkoutStats: {
    alignItems: 'flex-end',
  },
  recentWorkoutDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  recentWorkoutCalories: {
    fontSize: 12,
    color: Colors.gray,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
});
