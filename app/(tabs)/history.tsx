import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { ThemeTokens } from '../../constants/ThemeTokens';
import { Card } from '../../components/Card';
import apiClient from '../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment'; // You might need to install moment: npm install moment

interface DailySummary {
  date: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  workouts: {
    total_duration_minutes: number;
    total_calories_burned: number;
    workout_types: string[];
  };
  expenses: {
    total_amount: number;
    categories_spent: { [key: string]: number };
  };
}

export default function HistoryScreen() {
  const { user, isLoggedIn, dashboardRefreshKey } = useAuth();
  const [selectedDate, setSelectedDate] = useState(moment()); // Defaults to today
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Placeholder for fetching data - will be implemented in a later step
  const fetchDailySummary = async (date: moment.Moment) => {
    if (!isLoggedIn) {
      setDailySummary(null);
      return;
    }

    setLoading(true);
    try {
      const formattedDate = date.format('YYYY-MM-DD');

      // Fetch Macros Summary
      const macrosResponse = await apiClient.get<any>(`/meals/logs/daily_summary/?date=${formattedDate}`);
      console.log('Macros Response:', macrosResponse); // Added log

      // Fetch Workouts Summary
      const workoutsResponse = await apiClient.get<any>(`/workouts/logs/daily_summary/?date=${formattedDate}`);
      console.log('Workouts Response:', workoutsResponse); // Added log

      // Fetch Expenses Summary
      const expensesResponse = await apiClient.get<any>(`/expenses/logs/daily_summary/?date=${formattedDate}`);
      console.log('Expenses Response:', expensesResponse); // Added log

      setDailySummary({
        date: formattedDate,
        macros: {
          calories: macrosResponse.total_calories || 0,
          protein: macrosResponse.total_protein || 0,
          carbs: macrosResponse.total_carbs || 0,
          fats: macrosResponse.total_fats || 0,
        },
        workouts: {
          total_duration_minutes: workoutsResponse.total_duration_minutes || 0,
          total_calories_burned: workoutsResponse.total_calories_burned || 0,
          workout_types: workoutsResponse.workout_types || [],
        },
        expenses: {
          total_amount: expensesResponse.total_amount || 0,
          categories_spent: expensesResponse.categories_spent || {},
        },
      });
    } catch (error) {
      console.error("Failed to fetch daily summary:", error);
      setDailySummary({
        date: date.format('YYYY-MM-DD'),
        macros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        workouts: { total_duration_minutes: 0, total_calories_burned: 0, workout_types: [] },
        expenses: { total_amount: 0, categories_spent: {} },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySummary(selectedDate);
  }, [selectedDate, isLoggedIn, dashboardRefreshKey]); // Add dashboardRefreshKey here

  const handlePreviousDay = () => {
    setSelectedDate(selectedDate.clone().subtract(1, 'day'));
  };

  const handleNextDay = () => {
    setSelectedDate(selectedDate.clone().add(1, 'day'));
  };

  const renderMacroCard = () => (
    <Card style={styles.summaryCard}>
      <Text style={styles.cardTitle}>Macro Intake</Text>
      {dailySummary?.macros ? (
        <View>
          <Text style={styles.cardText}>Calories: {dailySummary.macros.calories} kcal</Text>
          <Text style={styles.cardText}>Protein: {dailySummary.macros.protein}g</Text>
          <Text style={styles.cardText}>Carbs: {dailySummary.macros.carbs}g</Text>
          <Text style={styles.cardText}>Fats: {dailySummary.macros.fats}g</Text>
        </View>
      ) : (
        <Text style={styles.emptyCardText}>No macro data for this day.</Text>
      )}
    </Card>
  );

  const renderWorkoutCard = () => (
    <Card style={styles.summaryCard}>
      <Text style={styles.cardTitle}>Workouts</Text>
      {dailySummary?.workouts ? (
        <View>
          <Text style={styles.cardText}>Duration: {dailySummary.workouts.total_duration_minutes} mins</Text>
          <Text style={styles.cardText}>Calories Burned: {dailySummary.workouts.total_calories_burned} kcal</Text>
          <Text style={styles.cardText}>Types: {dailySummary.workouts.workout_types.join(', ')}</Text>
        </View>
      ) : (
        <Text style={styles.emptyCardText}>No workout data for this day.</Text>
      )}
    </Card>
  );

  const renderExpenseCard = () => (
    <Card style={styles.summaryCard}>
      <Text style={styles.cardTitle}>Expenses</Text>
      {dailySummary?.expenses ? (
        <View>
          <Text style={styles.cardText}>Total Spent: ₹{dailySummary.expenses.total_amount.toLocaleString()}</Text>
          {Object.entries(dailySummary.expenses.categories_spent).map(([category, amount]) => (
            <Text key={category} style={styles.cardText}>  {category}: ₹{amount.toLocaleString()}</Text>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyCardText}>No expense data for this day.</Text>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header with Date Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePreviousDay} style={styles.navButton}>
          <MaterialIcons name="chevron-left" size={30} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{selectedDate.format('LL')}</Text>
        <TouchableOpacity onPress={handleNextDay} style={styles.navButton}>
          <MaterialIcons name="chevron-right" size={30} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loadingIndicator} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {dailySummary ? (
            <>
              {renderMacroCard()}
              {renderWorkoutCard()}
              {renderExpenseCard()}
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="info-outline" size={48} color={Colors.gray} />
              <Text style={styles.emptyStateText}>No data for this day.</Text>
              {!isLoggedIn && <Text style={styles.emptyStateSubtext}>Log in to view your history.</Text>}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ThemeTokens.spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navButton: {
    padding: ThemeTokens.spacing.sm,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    padding: ThemeTokens.spacing.lg,
    paddingBottom: ThemeTokens.spacing.xl * 2, // Ensure space for bottom tab bar
  },
  summaryCard: {
    marginBottom: ThemeTokens.spacing.lg,
    padding: ThemeTokens.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: ThemeTokens.spacing.md,
  },
  cardText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: ThemeTokens.spacing.xs,
  },
  emptyCardText: {
    fontSize: 16,
    color: Colors.gray,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ThemeTokens.spacing.xl * 2,
    minHeight: 300, // Ensure it takes up enough space
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: ThemeTokens.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: ThemeTokens.spacing.sm,
  },
});
