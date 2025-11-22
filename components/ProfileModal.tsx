import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemeTokens } from '../constants/ThemeTokens';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { User } from '../context/AuthContext';

interface ProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onCreateAccount: () => void;
  onCheckUpdates: () => void;
  isLoggedIn: boolean; // Add this prop
  user: User | null; // Add this prop
  onSignOut: () => void; // Add this prop
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isVisible,
  onClose,
  onLogin, // Keep for potential external logic
  onCreateAccount, // Keep for potential external logic
  onCheckUpdates,
  isLoggedIn,
  user,
  onSignOut, // Destructure onSignOut
}) => {
  const router = useRouter();

  console.log('ProfileModal: isLoggedIn', isLoggedIn, 'user?.profileCompleted', user?.profileCompleted, 'user', user);

  const handleLoginPress = () => {
    onClose();
    router.push('/login' as never);
    onLogin();
  };

  const handleCreateAccountPress = () => {
    onClose();
    router.push('/register' as never);
    onCreateAccount();
  };

  const handleCompleteProfilePress = () => {
    onClose();
    router.push('/complete-profile' as never);
  };

  const handleViewProfilePress = () => {
    onClose();
    router.push('/profile-details' as never);
  };

  const handleCheckUpdatesPress = () => {
    onClose();
    console.log('Checking for updates...');
    onCheckUpdates();
  };

  const handleSignOutPress = () => {
    onClose(); // Close modal first
    onSignOut(); // Call the signOut function passed from AuthContext
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profile Options</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {!isLoggedIn ? (
              // Not logged in: Show Login and Create Account
              <>
                {console.log('ProfileModal: Rendering Not Logged In buttons')}
                <TouchableOpacity onPress={handleLoginPress} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateAccountPress} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Create Account</Text>
                </TouchableOpacity>
              </>
            ) : !user?.profileCompleted ? (
              // Logged in but profile not complete: Show Complete Profile
              <>
                {console.log('ProfileModal: Rendering Complete Profile button')}
                <TouchableOpacity onPress={handleCompleteProfilePress} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Complete Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Logged in and profile complete: Show View Profile
              <>
                {console.log('ProfileModal: Rendering View Profile button')}
                <TouchableOpacity onPress={handleViewProfilePress} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>View Profile</Text>
                </TouchableOpacity>
              </>
            )}
            
            {/* Always show Check for Updates for now */}
            <TouchableOpacity onPress={handleCheckUpdatesPress} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Check for Updates</Text>
            </TouchableOpacity>
            {isLoggedIn && (
              <TouchableOpacity onPress={handleSignOutPress} style={[styles.modalButton, { backgroundColor: Colors.error }]} >
                <Text style={styles.modalButtonText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: ThemeTokens.radius.lg,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ThemeTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    color: Colors.primary,
    fontSize: 16,
  },
  modalBody: {
    padding: ThemeTokens.spacing.md,
  },
  modalButton: {
    marginTop: ThemeTokens.spacing.sm,
    padding: ThemeTokens.spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: ThemeTokens.radius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
