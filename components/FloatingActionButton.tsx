import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';

type FloatingActionButtonProps = {
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  style?: ViewStyle;
  position?: 'left' | 'right' | 'center';
};

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = 'add',
  iconSize = 24,
  iconColor = '#fff',
  style,
  position = 'right',
}) => {
  const getPositionStyle = (): ViewStyle => {
    switch (position) {
      case 'left':
        return { left: 20 };
      case 'center':
        return { alignSelf: 'center' };
      case 'right':
      default:
        return { right: 20 };
    }
  };

  return (
    <TouchableOpacity
      style={[styles.fab, getPositionStyle(), style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name={icon} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
