import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckForUpdatesButton } from '../../components/CheckForUpdatesButton';
import { Colors } from '../../constants/Colors';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.sectionContent}>
            <CheckForUpdatesButton />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.versionText}>FitLedger v1.0.0</Text>
            <Text style={styles.copyrightText}>
              © {new Date().getFullYear()} FitLedger. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.cardHighlight,
  },
  sectionContent: {
    padding: 16,
  },
  versionText: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: Colors.lightGray,
  },
});
