import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/Button';
import { Colors } from '../constants/Colors';
import { ThemeTokens } from '../constants/ThemeTokens';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signUp(email, password, name);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Start tracking your fitness and finance goals</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="John Doe"
        placeholderTextColor={Colors.placeholder}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={Colors.placeholder}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Create a password"
        placeholderTextColor={Colors.placeholder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Re-enter password"
        placeholderTextColor={Colors.placeholder}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={loading ? 'Creating account...' : 'Register'}
        onPress={handleRegister}
        disabled={loading}
        style={styles.primaryButton}
      />

      <TouchableOpacity style={styles.secondaryAction} onPress={() => router.replace('/login')}>
        <Text style={styles.secondaryText}>Already have an account? <Text style={styles.linkText}>Login</Text></Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
        <Text style={[styles.secondaryText, { marginTop: 24 }]}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: ThemeTokens.spacing.xl,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: ThemeTokens.typography.headline,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: ThemeTokens.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: ThemeTokens.spacing.xl,
  },
  label: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: ThemeTokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: ThemeTokens.radius.lg,
    padding: ThemeTokens.spacing.md,
    marginBottom: ThemeTokens.spacing.md,
    backgroundColor: '#fff',
    color: "black",
  },
  error: {
    marginBottom: ThemeTokens.spacing.md,
    color: "black",
  },
  primaryButton: {
    marginTop: ThemeTokens.spacing.sm,
  },
  secondaryAction: {
    marginTop: ThemeTokens.spacing.md,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    color: "black",
  },
  linkText: {
    fontWeight: '600',
    color: "black",
  },
});
