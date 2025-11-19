import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { Button } from '../components/Button';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ThemeTokens } from '../constants/ThemeTokens';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { saveProfile } = useAuth();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  const activityOptions = ['Low', 'Moderate', 'High'];
  const goalOptions = ['Lose Weight', 'Maintain', 'Gain Muscle'];

  const handleSave = () => {
    setSaving(true);
    // Simulate saving and redirect
    setTimeout(() => {
      setSaving(false);
      saveProfile({ height, weight, age, activityLevel, goal });
      router.replace({ pathname: '/(tabs)', params: { profileSaved: 'true' } });
    }, 1200);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />
      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />
      <TouchableOpacity style={styles.select} onPress={() => setActivityOpen(true)}>
        <Text style={[styles.selectText, !activityLevel && styles.placeholderText]}>
          {activityLevel || 'Select Activity Level'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.select} onPress={() => setGoalOpen(true)}>
        <Text style={[styles.selectText, !goal && styles.placeholderText]}>
          {goal || 'Select Goal'}
        </Text>
      </TouchableOpacity>
      <Button
        title={saving ? 'Saving...' : 'Save'}
        onPress={handleSave}
        disabled={saving}
        style={styles.saveButton}
      />

      {/* Activity Level Modal */}
      <Modal transparent visible={activityOpen} animationType="fade" onRequestClose={() => setActivityOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Activity Level</Text>
            {activityOptions.map((opt) => (
              <TouchableOpacity key={opt} style={styles.option} onPress={() => { setActivityLevel(opt); setActivityOpen(false); }}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cancel" variant="text" onPress={() => setActivityOpen(false)} />
          </View>
        </View>
      </Modal>

      {/* Goal Modal */}
      <Modal transparent visible={goalOpen} animationType="fade" onRequestClose={() => setGoalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Goal</Text>
            {goalOptions.map((opt) => (
              <TouchableOpacity key={opt} style={styles.option} onPress={() => { setGoal(opt); setGoalOpen(false); }}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cancel" variant="text" onPress={() => setGoalOpen(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: ThemeTokens.spacing.xl,
    backgroundColor: Colors.background,
    justifyContent: 'center',
  },
  title: {
    fontSize: ThemeTokens.typography.title,
    fontWeight: '800',
    marginBottom: ThemeTokens.spacing.xl,
    color: Colors.primary,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: ThemeTokens.radius.lg,
    padding: ThemeTokens.spacing.md,
    marginBottom: ThemeTokens.spacing.md,
    backgroundColor: Colors.card,
    fontSize: 16,
  },
  select: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: ThemeTokens.radius.lg,
    padding: ThemeTokens.spacing.md,
    marginBottom: ThemeTokens.spacing.md,
    backgroundColor: Colors.card,
  },
  selectText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.gray,
  },
  saveButton: {
    marginTop: ThemeTokens.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ThemeTokens.spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: ThemeTokens.radius.lg,
    padding: ThemeTokens.spacing.lg,
    ...ThemeTokens.shadow.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: ThemeTokens.spacing.md,
  },
  option: {
    paddingVertical: ThemeTokens.spacing.sm,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
});
