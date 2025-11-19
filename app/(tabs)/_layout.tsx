import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ProfileModal } from '../../components/ProfileModal';
import React from 'react';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const [modalVisible, setModalVisible] = React.useState(false);
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  // Placeholder handlers for modal actions
  const handleLogin = () => {
    setModalVisible(false);
    router.push('/login' as never);
  };
  const handleCreateAccount = () => {
    setModalVisible(false);
    router.push('/register' as never);
  };
  const handleCheckUpdates = () => {
    setModalVisible(false);
    // Implement check updates logic
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topRightContainer}>
        <TouchableOpacity onPress={() => {
          if (isLoggedIn && user?.profileCompleted) {
            router.push('/profile-details' as never);
          } else {
            setModalVisible(true);
          }
        }}>
          <Image
            source={{ uri: 'https://via.placeholder.com/40' }}
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.gray,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.card,
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 60,
            paddingBottom: 6,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="dashboard" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="restaurant" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="fitness-center" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="expense"
          options={{
            title: 'Expense',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="attach-money" size={24} color={color} />
            ),
          }}
        />
        {/* <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="settings" size={24} color={color} />
            ),
          }}
        /> */}
      </Tabs>
      <ProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        onCheckUpdates={handleCheckUpdates}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topRightContainer: {
    position: 'absolute',
    top: 30,
    right: 20,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
});
