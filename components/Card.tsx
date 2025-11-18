import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';

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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
