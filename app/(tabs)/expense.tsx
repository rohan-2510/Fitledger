import { db } from '@/utils/firebase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ProfileImageDisplay } from '../../components/ProfileImageDisplay';
import { ProfileModal } from '../../components/ProfileModal';
import { Colors } from '../../constants/Colors';
import { ThemeTokens } from '../../constants/ThemeTokens';
import { useAuth } from '../../context/AuthContext';

interface ExpenseData {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string; // ISO date string
  user_id: string;
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseData[]>([]); // Add this line
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [editBudgetModalVisible, setEditBudgetModalVisible] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Load monthly budget from user data
  useEffect(() => {
    if (user?.monthly_budget) {
      setMonthlyBudget(user.monthly_budget);
    }
  }, [user?.monthly_budget]);

  // Reset states when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setSelectedDate(new Date());
      setSelectedCategoryFilter('all');
      setExpenses([]);
      setAllExpenses([]);
      setDescription('');
      setAmount('');
      setSelectedCategory(null);
      setExpenseDate(new Date());
      setModalVisible(false);
      setIsProfileModalVisible(false);
      setMonthlyBudget(5000);
      setEditBudgetModalVisible(false);
      setNewBudget('');
    }
  }, [isLoggedIn]);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expenseDate, setExpenseDate] = useState(new Date());


  useEffect(() => {
    if (user?.id && isLoggedIn) {
      loadExpenses();
    } else {
      setExpenses([]);
    }
  }, [user?.id, isLoggedIn, selectedDate]);

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

  const loadExpenses = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const expenseDocRef = doc(db, "expense", user.id);
      const expenseDocSnap = await getDoc(expenseDocRef);
      
      if (expenseDocSnap.exists()) {
        const data = expenseDocSnap.data();
        setMonthlyBudget(data.monthly_budget || 0);
        const expensesArray = Array.isArray(data.expenses) ? data.expenses : [];
        
        // Check if any expenses don't have IDs and assign them
        const expensesWithIds = expensesArray.map((expense: any, index: number) => {
          if (!expense.id) {
            const newId = `${user.id}_${index}_fallback_${Date.now()}`;
            console.log('Assigning fallback ID:', newId, 'to expense:', expense);
            return { ...expense, id: newId };
          }
          return expense;
        });
        
        // If we assigned any new IDs, save them back to the database
        const hasNewIds = expensesWithIds.some((expense, index) => 
          expense.id !== expensesArray[index]?.id
        );
        
        if (hasNewIds) {
          console.log('Saving expenses with new IDs to database');
          await updateDoc(expenseDocRef, { expenses: expensesWithIds });
        }
        
        // Store all expenses
        const allExpensesData: ExpenseData[] = expensesWithIds.map((expense: any, index: number) => ({
          id: expense.id || `${user.id}_${index}`,
          ...expense,
        }));
        setAllExpenses(allExpensesData);
        
        // Filter expenses for selected date
        const selectedDateStr = selectedDate.toISOString().split('T')[0];
        const filteredExpenses = expensesWithIds.filter((expense: any) => {
          if (!expense.date) return false;
          return expense.date === selectedDateStr;
        });
        
        // Map expenses array to include document ID for each expense
        const expensesData: ExpenseData[] = filteredExpenses.map((expense: any, index: number) => ({
          id: expense.id || `${user.id}_${index}`,
          ...expense,
        }));
        console.log("expensesData---------------------------------",expensesData);
        setExpenses(expensesData);
      } else {
        setExpenses([]);
        setAllExpenses([]);
      }
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses. Please try again.');
      setExpenses([]);
      setAllExpenses([]);
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
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to save expenses.');
      return;
    }

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
        id: `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        description: description.trim(),
        amount: parsedAmount,
        category: selectedCategory,
        date: expenseDate.toISOString().split('T')[0], // YYYY-MM-DD
      };

      // Use document ID that matches user.id
      const expenseDocRef = doc(db, "expense", user.id);
      const expenseDocSnap = await getDoc(expenseDocRef);

      if (expenseDocSnap.exists()) {
        // If the document exists, update it by adding the new expense
        const prevData = expenseDocSnap.data();
        // Ensure prevData.expenses is an array
        const updatedExpenses = Array.isArray(prevData.expenses)
          ? [...prevData.expenses, expenseData]
          : [expenseData];
        await updateDoc(expenseDocRef, { expenses: updatedExpenses });
      } else {
        // If not exists, create a new doc with expenses as an array
        await setDoc(expenseDocRef, {
          expenses: [expenseData],
        });
      }

      setModalVisible(false);
      resetForm();
      await loadExpenses();
      Alert.alert('Success', 'Expense logged successfully!');
      triggerDashboardRefresh();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save expense. Please try again.'
      );
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyBudget = monthlyBudget > 0 ? monthlyBudget / daysInMonth : 0;
  const budgetUsed = dailyBudget > 0 ? (totalExpenses / dailyBudget) * 100 : 0;

  // Add monthly expense calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenses = allExpenses.filter((expense) => {
    if (!expense.date) return false;
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  const totalMonthlyExpenses = monthlyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const monthlyBudgetUsed = monthlyBudget > 0 ? (totalMonthlyExpenses / monthlyBudget) * 100 : 0;

  const filteredExpenses = expenses.filter((expense) => {
    console.log("expense---------------------------------",expense)
    console.log("selectedCategoryFilter---------------------------------",selectedCategoryFilter)
    if (selectedCategoryFilter === 'all') return true;
    console.log("expenseCategories---------------------------------",expenseCategories)
    const categoryName = expenseCategories.find(cat => cat.id === selectedCategoryFilter)?.name;
    console.log("categoryName---------------------------------",categoryName)
    return expense.category?.toLowerCase() === categoryName?.toLowerCase();
  });

  const renderExpenseItem = ({ item }: { item: any }) => (
    <View style={styles.expenseItem}>
      <View style={[styles.expenseIcon, { backgroundColor: `${getCategoryColor(item.category)}20` }]}>
        <MaterialIcons 
          name={getCategoryIcon(item?.category)} 
          size={20} 
          color={getCategoryColor(item?.category)} 
        />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseTitle}>{item.description}</Text>
        <Text style={styles.expenseCategory}>{item?.category}</Text>
      </View>
      <View style={styles.expenseAmountContainer}>
        <Text style={styles.expenseAmount}>₹{item?.amount?.toLocaleString()}</Text>
        <Text style={styles.expenseDate}>
          {item.date
            ? new Date(
                typeof item?.date === 'number'
                  ? item.date
                  : typeof item?.date === 'object' && item?.date?.seconds
                  ? item?.date?.seconds * 1000
                  : item?.date
              ).toLocaleDateString()
            : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={() => deleteExpense(item.id)} style={styles.deleteButton}>
        <MaterialIcons name="delete" size={18} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  const getCategoryColor = (category: string) => {
    const cat = expenseCategories.find((c) => c?.name?.toLowerCase() === category?.toLowerCase());
    return cat ? cat.color : Colors.primary;
  };

  const getCategoryIcon = (category: string) => {
    const cat = expenseCategories.find((c) => c?.name?.toLowerCase() === category?.toLowerCase());
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
      // save to firebase db expense collection as budget
      const expenseDocRef = doc(db, "expense", user?.id || '');
      const expenseDocSnap = await getDoc(expenseDocRef);
      
      if (expenseDocSnap.exists()) {
        // If document exists, update it
        await updateDoc(expenseDocRef, { monthly_budget: parsedBudget });
      } else {
        // If document doesn't exist, create it with the budget
        await setDoc(expenseDocRef, {
          monthly_budget: parsedBudget,
          expenses: []
        });
      }
      
      setMonthlyBudget(parsedBudget);
      setEditBudgetModalVisible(false);
      setNewBudget('');
      triggerDashboardRefresh();
    } catch (error: any) {
      console.error('Error saving monthly budget:', error);
      Alert.alert('Error', 'Failed to save budget. Please try again.');
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to delete expenses.');
      return;
    }

    try {
      if (!user?.id) return;
      const expenseDocRef = doc(db, "expense", user.id);
      const expenseDocSnap = await getDoc(expenseDocRef);

      if (expenseDocSnap.exists()) {
        const prevData = expenseDocSnap.data();
        const expensesArray = Array.isArray(prevData.expenses) ? prevData.expenses : [];
        
        console.log('Deleting expense with ID:', id);
        console.log('Current expenses:', expensesArray);
        
        // Filter out the expense with the matching id
        const updatedExpenses = expensesArray.filter((expense: any) => {
          console.log('Checking expense:', expense, 'ID:', expense.id, 'matches:', expense.id !== id);
          return expense.id !== id;
        });
        
        console.log('Updated expenses after deletion:', updatedExpenses);
        
        await updateDoc(expenseDocRef, { expenses: updatedExpenses });
        await loadExpenses(); // Reload all expenses
      }
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense.');
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
            <Text style={styles.progressText}>Spent today: ₹{totalExpenses.toLocaleString()}</Text>
          </View>
          
          {/* Add Monthly Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>Spent this month: ₹{totalMonthlyExpenses.toLocaleString()}</Text>
              <Text style={styles.progressText}>
                {monthlyBudgetUsed.toFixed(1)}% of budget
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(monthlyBudgetUsed, 100)}%`,
                    backgroundColor: monthlyBudgetUsed > 80 ? Colors.error : Colors.success
                  }
                ]} 
              />
            </View>
          </View>
        </Card>

        {/* Date Selector */}
        <Card style={styles.dateCard}>
          <View style={styles.dateSelector}>
            <Text style={styles.dateLabel}>Your Expense Diary for:</Text>
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

        {/* Header for Expenses */}
        <View style={styles.expenseHeaderContainer}>
          <Text style={styles.expenseHeaderText}>
            Expenses
          </Text>
        </View>

        {/* Tabs */}
        

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
            <View>
              {filteredExpenses.map((item: any, index) => (
                <View key={item?.id || item?.date || index}>
                  {renderExpenseItem({ item })}
                  {index < filteredExpenses.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt" size={48} color={Colors.lightGray} />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>Start adding your expenses to track them here</Text>
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
                  placeholderTextColor={Colors.placeholder}
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
                  placeholderTextColor={Colors.placeholder}
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
                  placeholderTextColor={Colors.placeholder}
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
    paddingTop: ThemeTokens.spacing.xl * 2 + 8,
    paddingBottom: ThemeTokens.spacing.xl + 4,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: ThemeTokens.typography.headline,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
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
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  editButton: {
    padding: 0,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
  },
  progressContainer: {
    marginTop: 14,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  expenseHeaderContainer: {
    marginHorizontal: ThemeTokens.spacing.lg,
    marginBottom: ThemeTokens.spacing.md,
    marginTop: ThemeTokens.spacing.md,
    backgroundColor: Colors.primary + '08',
    borderRadius: 12,
    paddingVertical: ThemeTokens.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '15',
  },
  expenseHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
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
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  selectedCategoryPill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    elevation: 3,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
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
    padding: 14,
    paddingHorizontal: 16,
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
  },
  expenseCategory: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 11,
    color: Colors.gray,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginLeft: 68,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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
  dateCard: {
    margin: ThemeTokens.spacing.lg,
    marginTop: ThemeTokens.spacing.sm,
    borderRadius: 14,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: ThemeTokens.spacing.sm,
  },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateButton: {
    padding: ThemeTokens.spacing.xs,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
    minWidth: 200,
    textAlign: 'center',
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
});
