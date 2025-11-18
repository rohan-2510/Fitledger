import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, rohangavada3!</Text>
        <Text style={styles.subtitle}>Achieve your maintain goal</Text>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/100' }}
            style={styles.profileImage}
          />
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statValue}>1,890</Text>
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
              <Text style={styles.statValue}>₹2,500</Text>
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
          <Text style={styles.sectionTitle}>Workout: Chest Day</Text>
          <Button 
            title="View All" 
            variant="text" 
            onPress={() => {}} 
            style={{ padding: 0 }}
          />
        </View>
        <View style={styles.workoutStats}>
          <View style={styles.workoutStat}>
            <Text style={styles.workoutStatValue}>12</Text>
            <Text style={styles.workoutStatLabel}>Exercises</Text>
          </View>
          <View style={styles.workoutStat}>
            <Text style={styles.workoutStatValue}>1h 30m</Text>
            <Text style={styles.workoutStatLabel}>Time</Text>
          </View>
          <View style={styles.workoutStat}>
            <Text style={styles.workoutStatValue}>1,200</Text>
            <Text style={styles.workoutStatLabel}>Calories</Text>
          </View>
        </View>
      </Card>

      {/* Progress Overview */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress Overview</Text>
          <Text style={styles.seeAllText}>This Week</Text>
        </View>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>Chart will be displayed here</Text>
        </View>
      </Card>

      {/* AI Insights */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="insights" size={20} color={Colors.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>AI Insights</Text>
          </View>
          <MaterialIcons name="more-vert" size={20} color={Colors.gray} />
        </View>
        <Text style={styles.insightText}>
          Your workout consistency is improving! Keep it up to reach your goals faster.
        </Text>
      </Card>

      {/* Diet Recommendation */}
      <Card style={[styles.sectionCard, { marginBottom: 24 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="restaurant" size={20} color={Colors.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Diet Recommendation</Text>
          </View>
        </View>
        <Text style={styles.insightText}>
          Increase your protein intake to support muscle recovery. Try adding more chicken, fish, or plant-based proteins to your meals.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
    paddingBottom: 80,
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
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -30,
    paddingHorizontal: 20,
    marginBottom: 20,
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
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  chartPlaceholder: {
    height: 200,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
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
});
