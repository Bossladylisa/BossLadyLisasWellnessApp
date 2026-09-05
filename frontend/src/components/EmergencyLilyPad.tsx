import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  View,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../store/useTheme';
import { useAuthStore } from '../store/useAuth';

/**
 * Emergency Lily Pad — floating 🪷 button visible on every authenticated screen.
 * One tap to a calming breath exercise. Never hidden behind menus.
 * Hidden on the /lilypad screen itself, on /login, and on /support.
 */
export function EmergencyLilyPad() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle continuous pulse to draw the eye when someone's dysregulating
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  if (!user) return null;
  // Never show on breathing screen (that's the destination), login, or crisis-support (those are their own emergency exits)
  const HIDDEN_ROUTES = ['/lilypad', '/login', '/support'];
  if (HIDDEN_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return null;
  }

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });
  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <Animated.View
        style={[
          styles.glow,
          { backgroundColor: theme.gold, opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />
      <TouchableOpacity
        onPress={() => router.push('/lilypad' as any)}
        style={[styles.button, { backgroundColor: theme.gold }]}
        activeOpacity={0.75}
        testID="emergency-lilypad-button"
        accessibilityLabel="Emergency breathing exercise"
        accessibilityHint="Opens a guided breathing exercise on the Lily Pad"
      >
        <Text style={styles.emoji}>🪷</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
    bottom: Platform.select({ ios: 32, android: 24, default: 24 }),
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 12,
  },
  glow: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 10 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      web: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
    }),
  },
  emoji: {
    fontSize: 30,
    lineHeight: 34,
  },
});
