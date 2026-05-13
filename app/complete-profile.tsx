import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/Button';
import { Colors } from '../constants/Colors';
import { ThemeTokens } from '../constants/ThemeTokens';
import { useAuth } from '../context/AuthContext';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { saveProfile } = useAuth();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(''); // New state for gender
  const [activityLevel, setActivityLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activityOpen, setActivityOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false); // New state for gender modal

  const activityOptions = ['Sedentary', 'Light', 'Moderate', 'Very Active', 'Extreme'];
  const goalOptions = ['Cut', 'Maintain', 'Bulk'];
  const genderOptions = ['Male', 'Female', 'Other']; // Options for gender

  const handleSave = async () => {
    if (!height || !weight || !age || !activityLevel || !goal || !gender) { // Add gender to validation
      alert('Please fill in all fields.');
      return;
    }

    setSaving(true);
    try {
      // Map activity level to backend format
      let mappedActivity = activityLevel.toLowerCase();
      if (mappedActivity === 'low') mappedActivity = 'sedentary';
      else if (mappedActivity === 'moderate') mappedActivity = 'moderate';
      else if (mappedActivity === 'high') mappedActivity = 'very';

      // Map goal to backend format
      let mappedGoal = goal.toLowerCase();
      if (mappedGoal.includes('lose') || mappedGoal.includes('cut')) {
        mappedGoal = 'cut';
      } else if (mappedGoal.includes('gain') || mappedGoal.includes('bulk')) {
        mappedGoal = 'bulk';
      } else {
        mappedGoal = 'maintain';
      }

      // Map gender to backend format
      let mappedGender = gender.substring(0, 1).toUpperCase(); // M, F, O

      const result = await saveProfile({
        height,
        weight,
        age,
        activityLevel: mappedActivity,
        goal: mappedGoal,
        gender: mappedGender // Add gender here
      });

      if (result.success) {
        router.replace({ pathname: '/(tabs)', params: { profileSaved: 'true' } });
      } else {
        alert(result.error || 'Failed to save profile. Please try again.');
        setSaving(false);
      }
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred.');
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        placeholderTextColor={"gray"}
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />
      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        placeholderTextColor={"gray"}
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        placeholderTextColor={"gray"}
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />

      {/* Gender Selection */}
      <TouchableOpacity style={styles.select} onPress={() => setGenderOpen(true)}>
        <Text style={[styles.selectText, !gender && styles.placeholderText]}>
          {gender || 'Select Gender'}
        </Text>
      </TouchableOpacity>

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

      {/* Gender Modal */}
      <Modal transparent visible={genderOpen} animationType="fade" onRequestClose={() => setGenderOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {genderOptions.map((opt) => (
              <TouchableOpacity key={opt} style={styles.option} onPress={() => { setGender(opt); setGenderOpen(false); }}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cancel" variant="text" onPress={() => setGenderOpen(false)} />
          </View>
        </View>
      </Modal>

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
    color: "black",
  },
  select: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: ThemeTokens.radius.lg,
    padding: ThemeTokens.spacing.md,
    marginBottom: ThemeTokens.spacing.md,
    backgroundColor: Colors.card,
    color: "black",
  },
  selectText: {
    fontSize: 16,
    color: "black",
  },
  placeholderText: {
    color: "grey",
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
