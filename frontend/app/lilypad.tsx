import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { DragonflyIcon } from '../src/components/DragonflyIcon';

type Phase = 'inhale' | 'hold' | 'exhale' | 'rest';

interface Pattern {
  id: string;
  name: string;
  subtitle: string;
  timings: Record<Phase, number>; // seconds per phase
}

const PATTERNS: Pattern[] = [
  {
    id: '478',
    name: '4-7-8 Calm',
    subtitle: 'Inhale 4 · Hold 7 · Exhale 8 — deep relaxation',
    timings: { inhale: 4, hold: 7, exhale: 8, rest: 0 },
  },
  {
    id: 'box',
    name: 'Box Breath',
    subtitle: 'Inhale 4 · Hold 4 · Exhale 4 · Rest 4 — grounding',
    timings: { inhale: 4, hold: 4, exhale: 4, rest: 4 },
  },
  {
    id: 'coherent',
    name: 'Coherent 5-5',
    subtitle: 'Inhale 5 · Exhale 5 — heart-rhythm ease',
    timings: { inhale: 5, hold: 0, exhale: 5, rest: 0 },
  },
];

const PHASE_LABEL: Record<Phase, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
  rest: 'Rest',
};

export default function LilyPadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pattern?: string }>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [selectedPatternId, setSelectedPatternId] = useState<string>(
    (params.pattern as string) || '478'
  );
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [phaseRemaining, setPhaseRemaining] = useState<number>(0);
  const [cycleCount, setCycleCount] = useState(0);

  const scale = useRef(new Animated.Value(0.5)).current;
  const glow = useRef(new Animated.Value(0.3)).current;
  const dragonflyAngle = useRef(new Animated.Value(0)).current;

  const pattern = useMemo(
    () => PATTERNS.find((p) => p.id === selectedPatternId) || PATTERNS[0],
    [selectedPatternId]
  );

  // Continuous dragonfly hover (only when running)
  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dragonflyAngle, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(dragonflyAngle, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [running, dragonflyAngle]);

  // Drive the breath cycle
  useEffect(() => {
    if (!running) return;

    let cancelled = false;
    let currentPhase: Phase = 'inhale';

    const phaseOrder: Phase[] = ['inhale', 'hold', 'exhale', 'rest'];

    const runPhase = () => {
      if (cancelled) return;
      const duration = pattern.timings[currentPhase] * 1000;

      // Skip 0-second phases
      if (duration <= 0) {
        advance();
        return;
      }

      setPhase(currentPhase);
      setPhaseRemaining(pattern.timings[currentPhase]);

      // Countdown ticker
      const tickStart = Date.now();
      const tickInterval = setInterval(() => {
        const elapsed = (Date.now() - tickStart) / 1000;
        const remaining = Math.max(
          0,
          Math.ceil(pattern.timings[currentPhase] - elapsed)
        );
        setPhaseRemaining(remaining);
      }, 250);

      // Animate ring + glow to match phase
      const targetScale =
        currentPhase === 'inhale'
          ? 1.0
          : currentPhase === 'exhale'
          ? 0.5
          : currentPhase === 'hold'
          ? 1.0
          : 0.5;
      const targetGlow =
        currentPhase === 'inhale' || currentPhase === 'hold' ? 0.9 : 0.3;

      Animated.parallel([
        Animated.timing(scale, {
          toValue: targetScale,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: targetGlow,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      const t = setTimeout(() => {
        clearInterval(tickInterval);
        advance();
      }, duration);
      return () => {
        clearInterval(tickInterval);
        clearTimeout(t);
      };
    };

    const advance = () => {
      if (cancelled) return;
      const idx = phaseOrder.indexOf(currentPhase);
      const next = phaseOrder[(idx + 1) % phaseOrder.length];
      if (next === 'inhale') {
        setCycleCount((c) => c + 1);
      }
      currentPhase = next;
      runPhase();
    };

    const cleanup = runPhase();
    return () => {
      cancelled = true;
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, pattern.id]);

  const toggle = () => {
    if (running) {
      // Reset
      setRunning(false);
      setPhase('inhale');
      setPhaseRemaining(0);
      setCycleCount(0);
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.5, duration: 500, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]).start();
    } else {
      setCycleCount(0);
      setRunning(true);
    }
  };

  const dragonflyTranslateY = dragonflyAngle.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={theme.gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
            activeOpacity={0.7}
            testID="lilypad-close"
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>🪷 Lily Pad</Text>
          <Text style={styles.subtitle}>
            A safe pond to slow your breath. You are held here.
          </Text>
        </View>

        {/* Breath visualizer */}
        <View style={styles.ringContainer}>
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glow,
                transform: [{ scale: scale.interpolate({ inputRange: [0.5, 1], outputRange: [0.9, 1.6] }) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              {
                transform: [{ scale }],
              },
            ]}
          >
            <Animated.View
              style={{
                transform: [{ translateY: dragonflyTranslateY }],
              }}
            >
              <DragonflyIcon size={72} color={theme.goldLt} opacity={0.95} />
            </Animated.View>
          </Animated.View>
        </View>

        <View style={styles.phaseBox}>
          <Text style={styles.phaseLabel}>
            {running ? PHASE_LABEL[phase] : 'Ready when you are'}
          </Text>
          {running && phaseRemaining > 0 && (
            <Text style={styles.phaseCount}>{phaseRemaining}</Text>
          )}
          {running && (
            <Text style={styles.cycleCount}>Cycle {Math.max(1, cycleCount)}</Text>
          )}
        </View>

        {/* Pattern selector */}
        {!running && (
          <View style={styles.patternsCard}>
            <Text style={styles.patternsTitle}>Choose your rhythm</Text>
            {PATTERNS.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPatternId(p.id)}
                style={[
                  styles.patternRow,
                  selectedPatternId === p.id && styles.patternRowActive,
                ]}
                activeOpacity={0.75}
                testID={`pattern-${p.id}`}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.patternName,
                      selectedPatternId === p.id && { color: theme.goldLt },
                    ]}
                  >
                    {p.name}
                  </Text>
                  <Text style={styles.patternSubtitle}>{p.subtitle}</Text>
                </View>
                {selectedPatternId === p.id && (
                  <Text style={[styles.patternCheck, { color: theme.gold }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={toggle}
          style={[styles.startButton, running && styles.stopButton]}
          activeOpacity={0.85}
          testID="lilypad-toggle"
        >
          <Text style={[styles.startButtonText, running && { color: theme.cream }]}>
            {running ? '✕ End Session' : '🪷 Begin Breathing'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/support' as any)}
          style={styles.crisisRow}
          activeOpacity={0.7}
        >
          <Text style={styles.crisisText}>
            In crisis? Tap for confidential 24/7 support ›
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.teal },
    safeArea: { flex: 1, paddingHorizontal: 20 },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingTop: 4,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeIcon: { color: theme.cream, fontSize: 18, fontWeight: '600' },
    hero: {
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 12,
    },
    title: {
      color: theme.goldLt,
      fontSize: 26,
      fontWeight: '700',
      fontStyle: 'italic',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    subtitle: {
      color: theme.cream,
      opacity: 0.7,
      fontSize: 13,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    ringContainer: {
      alignSelf: 'center',
      width: 260,
      height: 260,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 24,
    },
    glow: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: theme.gold,
      opacity: 0.3,
      // React Native Web accepts these; native ignores box-shadow, uses elevation only
      ...Platform.select({
        web: {
          shadowColor: theme.gold,
          shadowRadius: 40,
          shadowOpacity: 0.6,
        },
        default: {},
      }),
    },
    ring: {
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 2,
      borderColor: theme.gold,
      justifyContent: 'center',
      alignItems: 'center',
    },
    phaseBox: {
      alignItems: 'center',
      marginBottom: 12,
    },
    phaseLabel: {
      color: theme.goldLt,
      fontSize: 22,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    phaseCount: {
      color: theme.gold,
      fontSize: 42,
      fontWeight: '300',
      lineHeight: 48,
    },
    cycleCount: {
      color: theme.cream,
      opacity: 0.55,
      fontSize: 12,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginTop: 6,
    },
    patternsCard: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 18,
      padding: 14,
      marginBottom: 14,
    },
    patternsTitle: {
      color: 'rgba(245,237,216,0.55)',
      fontSize: 11,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    patternRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: 'transparent',
    },
    patternRowActive: {
      backgroundColor: 'rgba(212,168,67,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(212,168,67,0.35)',
    },
    patternName: {
      color: theme.cream,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    patternSubtitle: {
      color: theme.cream,
      opacity: 0.6,
      fontSize: 11,
    },
    patternCheck: {
      fontSize: 18,
      fontWeight: '700',
      minWidth: 20,
      textAlign: 'right',
    },
    startButton: {
      backgroundColor: theme.gold,
      borderRadius: 30,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 10,
    },
    stopButton: {
      backgroundColor: 'rgba(199,74,58,0.85)',
    },
    startButtonText: {
      color: theme.teal,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.6,
    },
    crisisRow: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    crisisText: {
      color: theme.terraLt,
      fontSize: 12,
      fontStyle: 'italic',
      textAlign: 'center',
    },
  });
