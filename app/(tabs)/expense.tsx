import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { ThemeTokens } from '../../constants/ThemeTokens';

// Mock data for expenses
const recentExpenses = [
  {
    id: '1',
    title: 'Gym Membership',
    category: 'Fitness',
    amount: 1200,
    date: 'Today',
    type: 'expense',
    icon: 'fitness-center',
  },
  {
    id: '2',
    title: 'Protein Shake',
    category: 'Supplements',
    amount: 45,
    date: 'Yesterday',
    type: 'expense',
    icon: 'local-cafe',
  },
  {
    id: '3',
    title: 'Yoga Mat',
    category: 'Equipment',
    amount: 35,
    date: 'Nov 15',
    type: 'expense',
    icon: 'fitness-center',
  },
  {
    id: '4',
    title: 'Personal Trainer',
    category: 'Services',
    amount: 80,
    date: 'Nov 14',
    type: 'expense',
    icon: 'person',
  },
];

const categories = [
  { id: '1', name: 'Food', icon: 'restaurant', color: '#FF6B6B' },
  { id: '2', name: 'Supplements', icon: 'nutrition', color: '#4ECDC4' },
  { id: '3', name: 'Equipment', icon: 'barbell', color: '#45B7D1' }, 
  { id: '4', name: 'Clothing', icon: 'shirt', color: '#FF9F43' }, 
  { id: '5', name: 'Membership', icon: 'card', color: '#5F27CD' },
  { id: '6', name: 'Services', icon: 'cut', color: '#FF6B6B' },
];
export default function ExpenseScreen() {
  const [activeTab, setActiveTab] = useState('expenses');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const totalExpenses = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyBudget = 5000;
  const budgetUsed = (totalExpenses / monthlyBudget) * 100;

  const renderExpenseItem = ({ item }: { item: typeof recentExpenses[0] }) => (
    <View style={styles.expenseItem}>
      <View style={[styles.expenseIcon, { backgroundColor: `${getCategoryColor(item.category)}20` }]}>
        <MaterialIcons 
          name={item.icon as any} 
          size={20} 
          color={getCategoryColor(item.category)} 
        />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
      </View>
      <View style={styles.expenseAmountContainer}>
        <Text style={styles.expenseAmount}>₹{item.amount.toLocaleString()}</Text>
        <Text style={styles.expenseDate}>{item.date}</Text>
      </View>
    </View>
  );

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.name === category);
    return cat ? cat.color : Colors.primary;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Expense Tracker</Text>
            <Text style={styles.subtitle}>Track your fitness expenses</Text>
          </View>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100' }}
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* Budget Overview */}
        <Card style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <View>
              <Text style={styles.budgetLabel}>Monthly Budget</Text>
              <Text style={styles.budgetAmount}>₹{monthlyBudget.toLocaleString()}</Text>
            </View>
            <Button 
              title="Edit" 
              variant="text" 
              onPress={() => {}} 
              style={styles.editButton}
              textStyle={{ fontSize: 14 }}
            />
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>Spent: ₹{totalExpenses.toLocaleString()}</Text>
              <Text style={styles.progressText}>
                {budgetUsed.toFixed(1)}% of budget
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(budgetUsed, 100)}%`,
                    backgroundColor: budgetUsed > 80 ? Colors.error : Colors.success
                  }
                ]} 
              />
            </View>
          </View>
        </Card>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
            onPress={() => setActiveTab('expenses')}
          >
            <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'income' && styles.activeTab]}
            onPress={() => setActiveTab('income')}
          >
            <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'savings' && styles.activeTab]}
            onPress={() => setActiveTab('savings')}
          >
            <Text style={[styles.tabText, activeTab === 'savings' && styles.activeTabText]}>
              Savings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.seeAllText}>See All</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity 
            style={[
              styles.categoryPill, 
              selectedCategory === 'all' && styles.selectedCategoryPill
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[
              styles.categoryPillText,
              selectedCategory === 'all' && styles.selectedCategoryPillText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id}
              style={[
                styles.categoryPill, 
                selectedCategory === category.id && styles.selectedCategoryPill
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.id ? 'white' : category.color} 
                style={styles.categoryIcon} 
              />
              <Text style={[
                styles.categoryPillText,
                selectedCategory === category.id && styles.selectedCategoryPillText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent Transactions */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.seeAllText}>See All</Text>
        </View>
        
        <Card style={styles.transactionsCard}>
          {recentExpenses.length > 0 ? (
            <FlatList
              data={recentExpenses}
              renderItem={renderExpenseItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt" size={48} color={Colors.lightGray} />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>Start adding your expenses to track them here</Text>
              <Button 
                title="Add Expense" 
                onPress={() => {}} 
                style={styles.addExpenseButton}
                icon={<Ionicons name="add" size={20} color="white" />}
              />
            </View>
          )}
        </Card>
      </ScrollView>
      
      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <Button 
          title="Add Transaction" 
          onPress={() => {}} 
          style={styles.fabButton}
          icon={<Ionicons name="add" size={24} color="white" />}
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
    padding: ThemeTokens.spacing.lg,
    paddingTop: ThemeTokens.spacing.xl * 2,
    backgroundColor: Colors.primary,
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
  budgetCard: {
    margin: ThemeTokens.spacing.lg,
    marginTop: ThemeTokens.spacing.sm,
    padding: ThemeTokens.spacing.lg,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  editButton: {
    padding: 0,
    minWidth: 0,
    paddingHorizontal: 12,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: Colors.gray,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray,
  },
  activeTabText: {
    color: 'white',
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
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  selectedCategoryPill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  selectedCategoryPillText: {
    color: 'white',
  },
  transactionsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 0,
    overflow: 'hidden',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    color: Colors.gray,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: Colors.gray,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginLeft: 68,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  addExpenseButton: {
    width: '100%',
    borderRadius: 12,
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
