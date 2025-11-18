import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';

type ProgressBarProps = {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  showPercentage?: boolean;
  style?: ViewStyle;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = Colors.primary,
  height = 8,
  showPercentage = false,
  style,
}) => {
  const progressWidth = Math.min(Math.max(progress, 0), 1) * 100;

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={[styles.progressBar, { width: `${progressWidth}%`, backgroundColor: color }]} />
      {showPercentage && (
        <Text style={styles.percentageText}>
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    position: 'absolute',
    right: 8,
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
});
