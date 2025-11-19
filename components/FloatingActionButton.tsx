import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemeTokens } from '../constants/ThemeTokens';

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
    bottom: ThemeTokens.spacing.xl,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...ThemeTokens.shadow.button,
  },
});
