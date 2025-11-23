import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { ThemeTokens } from '../../constants/ThemeTokens';
import apiClient from '../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { ProfileImageDisplay } from '../../components/ProfileImageDisplay'; // Import ProfileImageDisplay
import { ProfileModal } from '../../components/ProfileModal'; // Import ProfileModal
import { useRouter } from 'expo-router'; // Import useRouter

interface ExpenseItem {
  id: number;
  description: string;
  category: string;
  amount: number;
  date: string; // ISO date string
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

const expenseCategories: Category[] = [
  { id: 'food', name: 'Food', icon: 'restaurant', color: '#FF6B6B' },
  { id: 'supplements', name: 'Supplements', icon: 'local-drink', color: '#4ECDC4' },
  { id: 'equipment', name: 'Equipment', icon: 'fitness-center', color: '#45B7D1' },
  { id: 'clothing', name: 'Clothing', icon: 'checkroom', color: '#FF9F43' },
  { id: 'membership', name: 'Membership', icon: 'card-membership', color: '#5F27CD' },
  { id: 'services', name: 'Services', icon: 'room-service', color: '#FF6B6B' },
  { id: 'other', name: 'Other', icon: 'add-circle', color: Colors.gray },
];

export default function ExpenseScreen() {
  const router = useRouter();
  const { user, isLoggedIn, signOut, triggerDashboardRefresh } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false); // State for profile modal
  const [monthlyBudget, setMonthlyBudget] = useState(5000); // New state for monthly budget
  const [editBudgetModalVisible, setEditBudgetModalVisible] = useState(false); // New state for edit budget modal
  const [newBudget, setNewBudget] = useState(''); // State for new budget input
  
  // Reset states when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setActiveTab('expenses');
      setSelectedCategoryFilter('all');
      setExpenses([]);
      setDescription('');
      setAmount('');
      setSelectedCategory(null);
      setExpenseDate(new Date());
      setModalVisible(false);
      setIsProfileModalVisible(false);
      setMonthlyBudget(5000); // Reset monthly budget on logout
      setEditBudgetModalVisible(false); // Close budget edit modal on logout
      setNewBudget(''); // Clear new budget input on logout
    }
  }, [isLoggedIn]);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expenseDate, setExpenseDate] = useState(new Date());

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<any>('/expenses/logs/');
      let fetchedExpenses: ExpenseItem[] = [];
      if (Array.isArray(response)) {
        fetchedExpenses = response;
      } else if (response && response.results && Array.isArray(response.results)) {
        fetchedExpenses = response.results;
      }
      setExpenses(fetchedExpenses);
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      // if (error.response?.status !== 401) {
        Alert.alert('Error', 'Failed to load expenses. Please try again.');
      // }
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setSelectedCategory(null);
    setExpenseDate(new Date());
  };

  const openModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const saveExpense = async () => {
    if (!description.trim() || !amount.trim() || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      const expenseData = {
        description: description.trim(),
        amount: parsedAmount,
        category: selectedCategory,
        date: expenseDate.toISOString().split('T')[0], // YYYY-MM-DD
      };

      await apiClient.post('/expenses/logs/', expenseData);
      setModalVisible(false);
      resetForm();
      await loadExpenses();
      Alert.alert('Success', 'Expense logged successfully!');
      triggerDashboardRefresh(); // Trigger dashboard refresh
    } catch (error: any) {
      console.error('Error saving expense:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to save expense. Please try again.'
      );
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  // const monthlyBudget = 5000; // This should ideally come from user settings or API
  const budgetUsed = (totalExpenses / monthlyBudget) * 100;

  const filteredExpenses = expenses.filter((expense) => {
    if (selectedCategoryFilter === 'all') return true;
    return expense.category.toLowerCase() === selectedCategoryFilter;
  });

  const renderExpenseItem = ({ item }: { item: ExpenseItem }) => (
    <View style={styles.expenseItem}>
      <View style={[styles.expenseIcon, { backgroundColor: `${getCategoryColor(item.category)}20` }]}>
        <MaterialIcons 
          name={getCategoryIcon(item.category)} 
          size={20} 
          color={getCategoryColor(item.category)} 
        />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseTitle}>{item.description}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
      </View>
      <View style={styles.expenseAmountContainer}>
        <Text style={styles.expenseAmount}>₹{item.amount.toLocaleString()}</Text>
        <Text style={styles.expenseDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  const getCategoryColor = (category: string) => {
    const cat = expenseCategories.find((c) => c.name.toLowerCase() === category.toLowerCase());
    return cat ? cat.color : Colors.primary;
  };

  const getCategoryIcon = (category: string) => {
    const cat = expenseCategories.find((c) => c.name.toLowerCase() === category.toLowerCase());
    return cat ? cat.icon : 'help-outline';
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

  const handleSaveBudget = async () => { // Made function async
    const parsedBudget = parseFloat(newBudget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      Alert.alert('Error', 'Please enter a valid positive number for the budget.');
      return;
    }
    try {
      await apiClient.patch('/users/me/', { monthly_budget: parsedBudget });
      setMonthlyBudget(parsedBudget);
      setEditBudgetModalVisible(false);
      setNewBudget('');
      Alert.alert('Success', 'Monthly budget updated successfully!');
      // Refresh user context to ensure the budget is updated globally
      await user?.id; // This line is not needed, refreshUser will handle it
      // Also trigger a dashboard refresh to update any displayed budget info
      triggerDashboardRefresh();
    } catch (error: any) {
      console.error('Error saving monthly budget:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to update monthly budget. Please try again.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Image Display - now inside ScrollView */}
        <View style={styles.profileImageContainerGlobal}>
          <ProfileImageDisplay
            size={40}
            onPress={() => setIsProfileModalVisible(true)}
            profileImageUrl={user?.profile_image_url}
          />
        </View>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Expense Tracker</Text>
            <Text style={styles.subtitle}>Track your fitness expenses</Text>
          </View>
          {/* Removed old profile image display */}
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
              onPress={() => {
                setNewBudget(monthlyBudget.toString()); // Pre-fill with current budget
                setEditBudgetModalVisible(true);
              }} 
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
          {/*<TouchableOpacity 
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
          </TouchableOpacity>*/}
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setSelectedCategoryFilter('all')}>
          <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity 
            style={[
              styles.categoryPill, 
              selectedCategoryFilter === 'all' && styles.selectedCategoryPill
            ]}
            onPress={() => setSelectedCategoryFilter('all')}
          >
            <Text style={[
              styles.categoryPillText,
              selectedCategoryFilter === 'all' && styles.selectedCategoryPillText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {expenseCategories.map((category) => (
            <TouchableOpacity 
              key={category.id}
              style={[
                styles.categoryPill, 
                selectedCategoryFilter === category.id && styles.selectedCategoryPill
              ]}
              onPress={() => setSelectedCategoryFilter(category.id)}
            >
              <MaterialIcons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategoryFilter === category.id ? 'white' : category.color} 
                style={styles.categoryIcon} 
              />
              <Text style={[
                styles.categoryPillText,
                selectedCategoryFilter === category.id && styles.selectedCategoryPillText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent Transactions */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={openModal}>
            <Text style={styles.seeAllText}>Add New</Text>
          </TouchableOpacity>
        </View>
        
        <Card style={styles.transactionsCard}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ padding: 20 }} />
          ) : filteredExpenses.length > 0 ? (
            <FlatList
              data={filteredExpenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt" size={48} color={Colors.lightGray} />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>Start adding your expenses to track them here</Text>
              {/* <Button 
   334|                title="Add Expense" 
   335|                onPress={openModal} 
   336|                style={styles.addExpenseButton}
   337|                icon={<Ionicons name="add" size={20} color="white" />}
   338|              /> */}
            </View>
          )}
        </Card>
      </ScrollView>
      
      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <Button 
          title="Add Transaction" 
          onPress={openModal} 
          style={styles.fabButton}
          icon={<Ionicons name="add" size={24} color="white" />}
        />
      </View>

      {/* Add Expense Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g., Gym Membership, Protein Powder"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Amount (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="500"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <View style={styles.categoryPickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {expenseCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryPill,
                          selectedCategory === cat.name && styles.selectedCategoryPill,
                        ]}
                        onPress={() => setSelectedCategory(cat.name)}
                      >
                        <MaterialIcons
                          name={cat.icon as any}
                          size={16}
                          color={selectedCategory === cat.name ? 'white' : cat.color}
                          style={styles.categoryIcon}
                        />
                        <Text
                          style={[
                            styles.categoryPillText,
                            selectedCategory === cat.name && styles.selectedCategoryPillText,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity onPress={() => console.log('Open date picker')} style={styles.datePickerButton}>
                  <MaterialIcons name="calendar-today" size={20} color={Colors.text} />
                  <Text style={styles.datePickerText}>{expenseDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
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
                title="Save Expense"
                onPress={saveExpense}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        visible={editBudgetModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditBudgetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Monthly Budget</Text>
              <TouchableOpacity onPress={() => setEditBudgetModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>New Monthly Budget (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={newBudget}
                  onChangeText={setNewBudget}
                  keyboardType="numeric"
                  placeholder="e.g., 7500"
                />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setEditBudgetModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Save Budget"
                onPress={handleSaveBudget}
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
  profileImageContainerGlobal: { // Renamed from profileImageContainer to avoid conflict
    position: 'absolute',
    right: 20,
    top: 40,
    zIndex: 10, // Ensure it's above other content
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
  categoryPickerContainer: {
    flexDirection: 'row',
    marginTop: ThemeTokens.spacing.xs,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: ThemeTokens.radius.md,
    padding: ThemeTokens.spacing.md,
    backgroundColor: 'white',
  },
  datePickerText: {
    marginLeft: ThemeTokens.spacing.sm,
    fontSize: 16,
    color: Colors.text,
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
});
