import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '../components/Button';
import { Colors } from '../constants/Colors';
import { ThemeTokens } from '../constants/ThemeTokens';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      signIn(email);
      router.replace('/(tabs)');
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Log in to continue your fitness journey</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title={loading ? 'Signing in...' : 'Login'} onPress={handleLogin} disabled={loading} style={styles.primaryButton} />

      <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/register' as never)}>
        <Text style={styles.secondaryText}>Don’t have an account? <Text style={styles.linkText}>Create one</Text></Text>
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
  },
  error: {
    color: Colors.error,
    marginBottom: ThemeTokens.spacing.md,
  },
  primaryButton: {
    marginTop: ThemeTokens.spacing.sm,
  },
  secondaryAction: {
    marginTop: ThemeTokens.spacing.md,
    alignItems: 'center',
  },
  secondaryText: {
    color: Colors.gray,
    fontSize: 14,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
