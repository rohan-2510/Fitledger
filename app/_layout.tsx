import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Alert, View, StyleSheet, Text } from 'react-native';
import * as Updates from 'expo-updates';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  // Removed isProfileModalVisible state
  // Removed useAuth hook

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!__DEV__) {
        try {
          const { isAvailable } = await Updates.checkForUpdateAsync();
          if (isAvailable) {
            Alert.alert(
              'Update Available',
              'A new app update is available. Apply it now?',
              [
                { text: 'Later', style: 'cancel' },
                { text: 'Update', onPress: () => Updates.fetchUpdateAsync().then(() => Updates.reloadAsync()) }
              ]
            );
          }
        } catch (error) {
          console.warn('Failed to check for updates:', error);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}> {/* Use a simple View for the root layout */}
        
          <Stack>
            <Stack.Screen 
              name="(tabs)" 
              options={{ headerShown: false }} 
            />
            <Stack.Screen name="login" options={{ title: 'Login' }} />
            <Stack.Screen name="register" options={{ title: 'Register' }} />
            <Stack.Screen name="complete-profile" options={{ title: 'Complete Profile' }} />
            <Stack.Screen name="profile-details" options={{ title: 'Profile Details' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  // Removed rootContainer and globalProfileImageContainer styles as they are no longer needed here.
});
