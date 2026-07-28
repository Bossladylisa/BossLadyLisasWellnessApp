import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DragonflyIcon } from './DragonflyIcon';
import { useTheme } from '../store/useTheme';

// Elegant scattered dragonflies with minimal accents
const DRAGONFLIES = [
  { size: 42, top: '4%', left: '78%', rotation: '15deg', opacity: 0.28 },
  { size: 32, top: '28%', left: '3%', rotation: '-25deg', opacity: 0.22 },
  { size: 38, top: '55%', left: '82%', rotation: '20deg', opacity: 0.25 },
  { size: 28, top: '78%', left: '5%', rotation: '-15deg', opacity: 0.2 },
];

export const DecorativeBackground = () => {
  const theme = useTheme();

  return (
    <View style={styles.container} pointerEvents="none">
      {DRAGONFLIES.map((d, i) => (
        <View
          key={i}
          style={[
            styles.decoration,
            {
              top: d.top as any,
              left: d.left as any,
              transform: [{ rotate: d.rotation }],
            },
          ]}
        >
          <DragonflyIcon
            size={d.size}
            color={theme.gold}
            opacity={d.opacity}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  decoration: {
    position: 'absolute',
  },
});
