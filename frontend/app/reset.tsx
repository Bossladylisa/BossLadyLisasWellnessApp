import React, { useState, useEffect, useMemo } from 'react';
import { Redirect, useRouter } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { PageHeader } from '../src/components/PageHeader';
import { useTheme } from '../src/store/useTheme';
import { useAuth } from '../src/store/useAuth';
import { Theme } from '../src/constants/themes';
import { MOODS, RESET_CARDS } from '../src/constants/data';
import { api } from '../src/services/api';

export default function ResetToolkit() {
  const theme = useTheme();
  const router = useRouter();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { user: _authUser } = useAuth();
  const [selected, setSelected] = useState<{
    label: string;
    emoji: string;
    color: string;
  } | null>(null);
  const [card, setCard] = useState<{
    quote: string;
    tip: string;
    focus: string;
  } | null>(null);
  const [aiCard, setAiCard] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [usage, setUsage] = useState<any | null>(null);
  const [moodHistory, setMoodHistory] = useState<
    Array<{ mood: string; color: string }>
  >([]);

  useEffect(() => {
    loadMoodHistory();
    loadUsage();
  }, []);

  const loadMoodHistory = async () => {
    try {
      const data = await api.getMoodHistory();
      setMoodHistory(data.slice(0, 7));
    } catch (error) {
      console.error('Failed to load mood history:', error);
    }
  };

  const loadUsage = async () => {
    try {
      const data = await api.getAIUsage();
      setUsage(data);
    } catch (e) {
      // silent
    }
  };

  const generate = async () => {
    if (!selected) return;

    setCard(RESET_CARDS[selected.label]);
    setAiLoading(true);
    setAiCard('');
    setAiError(null);

    try {
      // Save mood to history
      await api.createMoodEntry(selected.label, selected.color);
      await loadMoodHistory();

      // Get AI-generated reset
      const response = await api.generateAIReset(selected.label);
      if (!response.ok) {
        if (response.status === 429) {
          const body = await response.json().catch(() => ({}));
          setAiError(body.detail || 'Daily free AI limit reached. Upgrade to Premium for unlimited access.');
          setAiLoading(false);
          return;
        }
        setAiError('AI service unavailable right now. Please try again shortly.');
        setAiLoading(false);
        return;
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }
              fullText += data;
              setAiCard(fullText);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate reset:', error);
      setAiError('Something went wrong. Please try again.');
    }
    setAiLoading(false);
    loadUsage();
  };

  if (!_authUser) return <Redirect href="/login" />;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <PageHeader
          icon="🌿"
          title="Reset Toolkit"
          subtitle="Select your current emotional state and receive a somatic reset card to help you return to center."
        />

        {usage && (
          <View style={styles.usagePill}>
            <Text style={styles.usagePillText}>{usage.reason || (usage.unlimited ? '✨ Unlimited AI' : '')}</Text>
            {!usage.unlimited && (
              <TouchableOpacity onPress={() => router.push('/upgrade' as any)}>
                <Text style={styles.usagePillUpgrade}>Upgrade →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {moodHistory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Recent Mood Tracking</Text>
            <View style={styles.moodHistory}>
              {moodHistory.map((m, i) => (
                <View key={i} style={styles.moodDot}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: m.color },
                    ]}
                  />
                  <Text style={styles.moodLabel}>{m.mood}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.moodGrid}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.label}
              onPress={() => setSelected(m)}
              style={[
                styles.moodButton,
                selected?.label === m.label && {
                  backgroundColor: `${m.color}28`,
                  borderColor: m.color,
                },
              ]}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text
                style={[
                  styles.moodText,
                  selected?.label === m.label && { color: m.color },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={generate}
          disabled={!selected}
          style={[
            styles.generateButton,
            !selected && { opacity: 0.45 },
          ]}
        >
          <Text style={styles.generateButtonText}>✦ Generate My Reset Card</Text>
        </TouchableOpacity>

        {card && (
          <View style={[styles.card, { borderColor: 'rgba(212,168,67,0.35)' }]}>
            <Text style={styles.resetHeader}>
              {selected?.emoji} {selected?.label} · DBT-Somatic Reset
            </Text>
            <Text style={styles.quote}>"{card.quote}"</Text>
            <Text style={styles.tip}>{card.tip}</Text>
            <View style={styles.focusContainer}>
              {card.focus.split(' · ').map((f) => (
                <View key={f} style={styles.focusTag}>
                  <Text style={styles.focusText}>✦ {f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {aiLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.gold} />
            <Text style={styles.loadingText}>
              Channeling your personalized somatic guidance…
            </Text>
          </View>
        )}

        {aiError && !aiLoading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{aiError}</Text>
            <TouchableOpacity
              style={styles.errorUpgradeBtn}
              onPress={() => router.push('/upgrade' as any)}
            >
              <Text style={styles.errorUpgradeText}>✨ Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        )}

        {aiCard && !aiLoading && (
          <View style={styles.aiCard}>
            <Text style={styles.aiHeader}>✦ Your Personalized Somatic Guidance</Text>
            <Text style={styles.aiText}>{aiCard}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.teal,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBdr,
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 11,
    color: 'rgba(245,237,216,0.45)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  moodHistory: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  moodDot: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  moodLabel: {
    fontSize: 10,
    color: 'rgba(245,237,216,0.4)',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  moodButton: {
    width: '30%',
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBdr,
    borderRadius: 14,
    padding: 13,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodText: {
    fontSize: 12,
    color: theme.cream,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: theme.gold,
    borderRadius: 30,
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  generateButtonText: {
    color: theme.teal,
    fontSize: 14,
    fontWeight: '700',
  },
  resetHeader: {
    fontSize: 11,
    color: theme.terraLt,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  quote: {
    fontSize: 24,
    fontStyle: 'italic',
    color: theme.goldLt,
    lineHeight: 34,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: theme.terra,
    paddingLeft: 16,
  },
  tip: {
    color: theme.cream,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  focusContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  focusTag: {
    backgroundColor: 'rgba(212,168,67,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.22)',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  focusText: {
    fontSize: 11,
    color: theme.gold,
  },
  loadingCard: {
    backgroundColor: theme.glass,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: 'rgba(245,237,216,0.5)',
    fontSize: 13,
    marginTop: 12,
  },
  aiCard: {
    backgroundColor: theme.terraDk,
    borderRadius: 18,
    padding: 24,
  },
  aiHeader: {
    fontSize: 11,
    color: 'rgba(245,237,216,0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  aiText: {
    color: theme.cream,
    fontSize: 14,
    lineHeight: 24,
  },
  usagePill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(232,184,77,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,184,77,0.3)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  usagePillText: {
    color: theme.goldLt,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  usagePillUpgrade: {
    color: theme.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: 'rgba(255,120,120,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,120,120,0.35)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: theme.cream,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorUpgradeBtn: {
    backgroundColor: theme.gold,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  errorUpgradeText: {
    color: theme.teal,
    fontSize: 13,
    fontWeight: '700',
  },
});
