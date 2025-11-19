import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemeTokens } from '../constants/ThemeTokens';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: ThemeTokens.radius.lg,
    padding: ThemeTokens.spacing.lg,
    marginBottom: ThemeTokens.spacing.md,
    ...ThemeTokens.shadow.card,
  },
});
