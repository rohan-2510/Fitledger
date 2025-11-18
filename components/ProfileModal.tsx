import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from './Button';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onCreateAccount: () => void;
  onCheckUpdates: () => void;
}

export function ProfileModal({ visible, onClose, onLogin, onCreateAccount, onCheckUpdates }: ProfileModalProps) {
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
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    paddingHorizontal: 8,
  },
  button: {
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 16,
  },
});