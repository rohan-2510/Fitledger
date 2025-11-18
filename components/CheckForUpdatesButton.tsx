import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useCheckForUpdates } from '../app/hooks/useCheckForUpdates';
import { Colors } from '../constants/Colors';

export const CheckForUpdatesButton = () => {
  const { checkForUpdates, isChecking } = useCheckForUpdates();

  return (
    <TouchableOpacity 
      style={[styles.button, isChecking && styles.buttonDisabled]}
      onPress={checkForUpdates}
      disabled={isChecking}
      activeOpacity={0.7}
    >
      {isChecking ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <>
          <MaterialIcons name="system-update" size={20} color={Colors.primary} style={styles.icon} />
          <Text style={styles.text}>Check for Updates</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
