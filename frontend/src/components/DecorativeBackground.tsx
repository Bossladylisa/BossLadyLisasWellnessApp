import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Decorative elements scattered around the screen
const DECORATIONS = [
  { emoji: '🦋', size: 24, top: '5%', left: '85%', rotation: '15deg', opacity: 0.35 },
  { emoji: '🌸', size: 18, top: '15%', left: '8%', rotation: '-20deg', opacity: 0.25 },
  { emoji: '🦋', size: 20, top: '32%', left: '92%', rotation: '-25deg', opacity: 0.3 },
  { emoji: '🌼', size: 22, top: '48%', left: '3%', rotation: '35deg', opacity: 0.28 },
  { emoji: '🦋', size: 26, top: '62%', left: '88%', rotation: '10deg', opacity: 0.32 },
  { emoji: '🌺', size: 20, top: '78%', left: '6%', rotation: '-15deg', opacity: 0.25 },
  { emoji: '✨', size: 16, top: '25%', left: '15%', rotation: '0deg', opacity: 0.4 },
  { emoji: '✨', size: 14, top: '55%', left: '78%', rotation: '0deg', opacity: 0.4 },
  { emoji: '✨', size: 12, top: '38%', left: '25%', rotation: '0deg', opacity: 0.35 },
  { emoji: '🌿', size: 18, top: '88%', left: '85%', rotation: '20deg', opacity: 0.22 },
];

export const DecorativeBackground = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      {DECORATIONS.map((dec, i) => (
        <Text
          key={i}
          style={[
            styles.decoration,
            {
              fontSize: dec.size,
              top: dec.top as any,
              left: dec.left as any,
              opacity: dec.opacity,
              transform: [{ rotate: dec.rotation }],
            },
          ]}
        >
          {dec.emoji}
        </Text>
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
