import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from './Button';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ThemeTokens } from '../constants/ThemeTokens';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onCreateAccount: () => void;
  onCheckUpdates: () => void;
}

export function ProfileModal({ visible, onClose, onLogin, onCreateAccount, onCheckUpdates }: ProfileModalProps) {
  const { isLoggedIn, user, signOut } = useAuth();
  const router = useRouter();

  const handleViewProfile = () => {
    onClose();
    router.push('/profile-details' as never);
  };

  const handleCompleteProfile = () => {
    onClose();
    router.push('/complete-profile' as never);
  };

  const handleLogout = () => {
    signOut();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Account</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            {isLoggedIn ? (
              <>
                {user?.email ? (
                  <View style={{ marginBottom: ThemeTokens.spacing.sm }}>
                    <Text style={{ color: Colors.gray }}>Signed in as</Text>
                    <Text style={{ color: Colors.text, fontWeight: '600' }}>{user.email}</Text>
                  </View>
                ) : null}
                <Button
                  title="View Profile"
                  onPress={handleViewProfile}
                  style={styles.button}
                  variant="outline"
                  icon={<MaterialIcons name="person" size={20} color={Colors.primary} />}
                />
                {!user?.profileCompleted && (
                  <Button
                    title="Complete Profile"
                    onPress={handleCompleteProfile}
                    style={styles.button}
                    variant="outline"
                    icon={<MaterialIcons name="assignment" size={20} color={Colors.primary} />}
                  />
                )}
                <View style={styles.divider} />
                <Button
                  title="Logout"
                  onPress={handleLogout}
                  style={styles.button}
                  variant="text"
                  icon={<MaterialIcons name="logout" size={20} color={Colors.error} />}
                />
              </>
            ) : (
              <>
                <Button
                  title="Login"
                  onPress={onLogin}
                  style={styles.button}
                  variant="outline"
                  icon={<MaterialIcons name="login" size={20} color={Colors.primary} />}
                />
                
                <Button
                  title="Create Account"
                  onPress={onCreateAccount}
                  style={styles.button}
                  variant="outline"
                  icon={<MaterialIcons name="person-add" size={20} color={Colors.primary} />}
                />
                
                <View style={styles.divider} />
                
                <Button
                  title="Check for Updates"
                  onPress={onCheckUpdates}
                  style={styles.button}
                  variant="text"
                  icon={<MaterialIcons name="system-update" size={20} color={Colors.text} />}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: ThemeTokens.radius.xl,
    borderTopRightRadius: ThemeTokens.radius.xl,
    padding: ThemeTokens.spacing.xl,
    paddingBottom: ThemeTokens.spacing.xl * 2,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeTokens.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: ThemeTokens.spacing.sm,
  },
  modalBody: {
    paddingHorizontal: ThemeTokens.spacing.sm,
  },
  button: {
    marginBottom: ThemeTokens.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: ThemeTokens.spacing.md,
  },
});