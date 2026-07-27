import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { PageHeader } from '../src/components/PageHeader';
import { Colors } from '../src/constants/colors';
import { DECLUTTER_ITEMS } from '../src/constants/data';
import { api } from '../src/services/api';

export default function DeclutterPage() {
  const [declutter, setDeclutter] = useState<Record<string, boolean>>({});
  const [timerDur, setTimerDur] = useState(5);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDeclutterState();
  }, []);

  useEffect(() => {
    if (running && timeLeft !== null && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0));
      }, 1000);
    } else if (timeLeft === 0) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, timeLeft]);

  const loadDeclutterState = async () => {
    try {
      const data = await api.getDeclutterState();
      if (data.items && Object.keys(data.items).length > 0) {
        setDeclutter(data.items);
      } else {
        const initialState = Object.fromEntries(
          DECLUTTER_ITEMS.map((i) => [i, false])
        );
        setDeclutter(initialState);
      }
    } catch (error) {
      console.error('Failed to load declutter state:', error);
    }
  };

  const toggle = async (item: string) => {
    const newState = { ...declutter, [item]: !declutter[item] };
    setDeclutter(newState);
    try {
      await api.updateDeclutterState(newState);
    } catch (error) {
      console.error('Failed to save declutter state:', error);
    }
  };

  const checked = Object.values(declutter).filter(Boolean).length;
  const total = DECLUTTER_ITEMS.length;
  const pct = Math.round((checked / total) * 100);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(
      2,
      '0'
    )}`;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <PageHeader
          icon="🧹"
          title="Declutter Tools"
          subtitle="Clear space within and around you. Each check is a somatic act of self-care."
        />

        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Today's Progress</Text>
            <Text style={styles.progressPercent}>{pct}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {checked} of {total} practices complete
          </Text>
        </View>

        {DECLUTTER_ITEMS.map((item) => {
          const isChecked = declutter[item];
          return (
            <TouchableOpacity
              key={item}
              onPress={() => toggle(item)}
              style={styles.checkItem}
            >
              <View
                style={[
                  styles.checkbox,
                  isChecked && styles.checkboxChecked,
                ]}
              >
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.checkText,
                  isChecked && styles.checkTextDone,
                ]}
              >
                {item}
              </Text>
              {isChecked && <Text style={styles.doneIcon}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />

        <View style={styles.card}>
          <Text style={styles.timerTitle}>🧘 Meditation Timer</Text>
          <Text style={styles.timerSubtitle}>
            Set your practice duration and let your nervous system soften.
          </Text>

          {timeLeft === null ? (
            <View style={styles.timerSetup}>
              <Text style={styles.label}>Duration (min)</Text>
              <TextInput
                value={String(timerDur)}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  setTimerDur(Math.min(60, Math.max(1, num)));
                }}
                keyboardType="number-pad"
                style={styles.timerInput}
              />
              <TouchableOpacity
                onPress={() => {
                  setTimeLeft(timerDur * 60);
                  setRunning(true);
                }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Begin ✦</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timerDisplay}>
              <Text style={styles.timerTime}>{fmt(timeLeft)}</Text>
              <Text style={styles.timerStatus}>
                {timeLeft === 0
                  ? '✨ Practice complete. Well done.'
                  : running
                  ? 'Breathe… you are held.'
                  : 'Paused — take your time.'}
              </Text>
              <View style={styles.timerActions}>
                <TouchableOpacity
                  onPress={() => setRunning((r) => !r)}
                  style={styles.ghostButton}
                >
                  <Text style={styles.ghostButtonText}>
                    {running ? '⏸ Pause' : '▶ Resume'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setRunning(false);
                    setTimeLeft(null);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                  }}
                  style={styles.resetButton}
                >
                  <Text style={styles.resetButtonText}>↺ Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.teal,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBdr,
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    color: 'rgba(245,237,216,0.6)',
  },
  progressPercent: {
    fontSize: 22,
    color: Colors.gold,
  },
  progressBar: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.terra,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(245,237,216,0.38)',
    marginTop: 8,
  },
  checkItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.12)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: 'rgba(212,168,67,0.4)',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: Colors.terra,
    backgroundColor: Colors.terra,
  },
  checkmark: {
    color: 'white',
    fontSize: 11,
  },
  checkText: {
    flex: 1,
    color: Colors.cream,
    fontSize: 14,
  },
  checkTextDone: {
    color: 'rgba(245,237,216,0.38)',
    textDecorationLine: 'line-through',
  },
  doneIcon: {
    color: '#6dd5c4',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.glassBdr,
    marginVertical: 20,
  },
  timerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.goldLt,
    marginBottom: 4,
  },
  timerSubtitle: {
    fontSize: 13,
    color: 'rgba(245,237,216,0.5)',
    marginBottom: 20,
  },
  timerSetup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  label: {
    color: 'rgba(245,237,216,0.7)',
    fontSize: 13,
  },
  timerInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.glassBdr,
    borderRadius: 10,
    color: Colors.cream,
    fontSize: 14,
    padding: 14,
    width: 70,
    textAlign: 'center',
  },
  button: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: 30,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.teal,
    fontSize: 14,
    fontWeight: '700',
  },
  timerDisplay: {
    alignItems: 'center',
  },
  timerTime: {
    fontSize: 62,
    fontWeight: '300',
    color: Colors.goldLt,
    letterSpacing: 4,
  },
  timerStatus: {
    color: 'rgba(245,237,216,0.45)',
    fontSize: 13,
    marginBottom: 16,
  },
  timerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.glassBdr,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  ghostButtonText: {
    color: Colors.cream,
    fontSize: 14,
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    color: 'rgba(255,120,120,0.8)',
    fontSize: 14,
  },
});
