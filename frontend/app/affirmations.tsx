import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PageHeader } from '../src/components/PageHeader';
import { Colors } from '../src/constants/colors';
import { api } from '../src/services/api';

interface Affirmation {
  id: string;
  text: string;
}

export default function AffirmationsPage() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [newAff, setNewAff] = useState('');
  const [displayed, setDisplayed] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [lastDate, setLastDate] = useState<string | null>(null);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const today = now.toDateString();

  useEffect(() => {
    loadAffirmations();
    loadStats();
  }, []);

  const loadAffirmations = async () => {
    try {
      const data = await api.getAffirmations();
      setAffirmations(data);
    } catch (error) {
      console.error('Failed to load affirmations:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getUserStats();
      setStreak(data.affirmation_streak || 0);
      setLastDate(data.last_affirmation_date);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const getAffirmation = async () => {
    if (affirmations.length === 0) return;

    const randomAff =
      affirmations[Math.floor(Math.random() * affirmations.length)];
    setDisplayed(randomAff.text);

    if (lastDate !== today) {
      const newStreak = streak + 1;
      setLastDate(today);
      setStreak(newStreak);
      try {
        await api.updateUserStats(newStreak, today);
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }
  };

  const add = async () => {
    if (!newAff.trim()) return;
    if (affirmations.some((a) => a.text === newAff)) return;

    try {
      await api.createAffirmation(newAff);
      setNewAff('');
      await loadAffirmations();
    } catch (error) {
      console.error('Failed to add affirmation:', error);
    }
  };

  const del = async (id: string) => {
    try {
      await api.deleteAffirmation(id);
      await loadAffirmations();
    } catch (error) {
      console.error('Failed to delete affirmation:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <PageHeader
          icon="⏰"
          title="Daily 2:43 Affirmations℠"
          subtitle="Receive a powerful affirmation at 2:43 PM daily to uplift your spirit and keep you aligned."
        />

        <View style={styles.statsCard}>
          <View>
            <Text style={styles.statsLabel}>Current Time</Text>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
          <View style={styles.streakContainer}>
            <Text style={styles.statsLabel}>Your Streak</Text>
            <Text style={styles.streakText}>
              🔥 {streak} day{streak !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={getAffirmation} style={styles.button}>
            <Text style={styles.buttonText}>Receive Affirmation ✦</Text>
          </TouchableOpacity>
        </View>

        {displayed && (
          <View style={styles.displayCard}>
            <Text style={styles.displayLabel}>✦ Your Affirmation ✦</Text>
            <Text style={styles.displayText}>"{displayed}"</Text>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Manage Your Collection</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={newAff}
            onChangeText={setNewAff}
            onSubmitEditing={add}
            placeholder="Add your own powerful affirmation…"
            placeholderTextColor="rgba(245,237,216,0.3)"
            style={styles.input}
          />
          <TouchableOpacity onPress={add} style={styles.addButton}>
            <Text style={styles.addButtonText}>Save ✦</Text>
          </TouchableOpacity>
        </View>

        {affirmations.map((a) => (
          <View key={a.id} style={styles.affirmationCard}>
            <Text style={styles.affIcon}>✦</Text>
            <Text style={styles.affText}>{a.text}</Text>
            <TouchableOpacity onPress={() => del(a.id)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
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
  statsCard: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBdr,
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  statsLabel: {
    fontSize: 11,
    color: 'rgba(245,237,216,0.4)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 34,
    color: Colors.gold,
    letterSpacing: 2,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakText: {
    fontSize: 26,
    color: Colors.terraLt,
  },
  button: {
    backgroundColor: Colors.gold,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: Colors.teal,
    fontSize: 14,
    fontWeight: '700',
  },
  displayCard: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.38)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  displayLabel: {
    fontSize: 11,
    color: Colors.terraLt,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  displayText: {
    fontSize: 26,
    fontStyle: 'italic',
    color: Colors.goldLt,
    lineHeight: 36,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.glassBdr,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: Colors.goldLt,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.glassBdr,
    borderRadius: 10,
    color: Colors.cream,
    fontSize: 14,
    padding: 14,
  },
  addButton: {
    backgroundColor: Colors.gold,
    borderRadius: 30,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    color: Colors.teal,
    fontSize: 14,
    fontWeight: '700',
  },
  affirmationCard: {
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
  affIcon: {
    color: Colors.gold,
    fontSize: 12,
    minWidth: 20,
  },
  affText: {
    flex: 1,
    color: Colors.cream,
    fontSize: 14,
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)',
    borderRadius: 6,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: 'rgba(255,120,120,0.8)',
    fontSize: 16,
  },
});
