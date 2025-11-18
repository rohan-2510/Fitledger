import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

type UpdateStatus = 'idle' | 'checking' | 'downloading' | 'up-to-date' | 'error';

type ErrorWithMessage = {
  message: string;
};

export const useCheckForUpdates = () => {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkForUpdates = useCallback(async (manualCheck = false): Promise<{ isAvailable: boolean }> => {
    try {
      console.log('--- Update Check Started ---');
      console.log('Platform:', Platform.OS);
      console.log('Manual check:', manualCheck);
      console.log('Environment:', __DEV__ ? 'Development' : 'Production');
      console.log('App version:', Constants.expoConfig?.version || 'not set');
      console.log('Runtime version:', Constants.expoConfig?.runtimeVersion || 'not set');
      console.log('EAS Project ID:', Constants.expoConfig?.extra?.eas?.projectId || 'not set');
      console.log('Update URL:', Constants.expoConfig?.updates?.url || 'not set');
      console.log('Update channel:', (Constants.expoConfig as any)?.updates?.channel || 'default');
      console.log('Current update ID:', Updates.updateId || 'not available');

      if (__DEV__) {
        console.log('In development mode, checking for updates anyway...');
        // Don't return early in development so we can test the update flow
      }

      // Check if running in a development client
      if (Constants.expoConfig?.extra?.eas?.projectId) {
        console.log('Running in development client, checking for updates...');
      }

      setStatus('checking');
      
      console.log('Checking for updates...');
      const update = await Updates.checkForUpdateAsync();
      console.log('Update check result:', update);
      
      setLastChecked(new Date());
      
      if (update.isAvailable) {
        console.log('Update is available!', update.manifest);
        console.log('Update available, downloading...');
        setStatus('downloading');
        
        try {
          await Updates.fetchUpdateAsync();
          console.log('Update downloaded successfully');
          
          if (manualCheck) {
            Alert.alert(
              'Update Available',
              'A new version is available. Restart the app to apply the update.',
              [
                {
                  text: 'Restart Now',
                  onPress: () => Updates.reloadAsync(),
                },
                {
                  text: 'Later',
                  style: 'cancel',
                },
              ]
            );
          } else {
            // Auto-reload for non-manual checks
            await Updates.reloadAsync();
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error fetching update:', errorMessage);
          throw new Error(`Failed to fetch update: ${errorMessage}`);
        }
      } else if (manualCheck) {
        console.log('No updates available');
        setStatus('up-to-date');
        Alert.alert('No Updates', 'You are using the latest version of the app.');
      } else {
        setStatus('idle');
      }

      return update;
    } catch (error) {
      let errorMessage = 'Failed to check for updates. Please try again later.';
      
      if (error instanceof Error) {
        console.error('Update error:', error.message);
        errorMessage += `\n\nError: ${error.message}`;
      } else {
        console.error('Unknown update error occurred');
      }
      
      setStatus('error');
      
      if (manualCheck) {
        Alert.alert('Update Error', errorMessage);
      }
      
      return { isAvailable: false };
    }
  }, []);

  // Auto-check on app start (only in production)
  useEffect(() => {
    const checkForUpdatesOnStart = async () => {
      if (__DEV__) {
        console.log('Development mode: Checking for updates in development...');
      } else {
        console.log('Production mode: Checking for updates...');
      }

      console.log('--- App Started: Checking for Updates ---');
      try {
        await checkForUpdates(false);
      } catch (error) {
        console.error('Auto-update check failed:', error);
      }
    };

    checkForUpdatesOnStart();
  }, [checkForUpdates]);

  return {
    checkForUpdates: () => checkForUpdates(true),
    status,
    lastChecked,
    isChecking: status === 'checking' || status === 'downloading',
  };
};