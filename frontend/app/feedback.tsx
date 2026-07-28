import React, { useState, useEffect, useMemo } from 'react';
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
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { api } from '../src/services/api';

interface Feedback {
  id: string;
  text: string;
  time: string;
}

export default function FeedbackPage() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const data = await api.getFeedback();
      setFeedback(data);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    }
  };

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await api.createFeedback(text);
      setText('');
      await loadFeedback();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <PageHeader
          icon="💌"
          title="Share Your Feedback"
          subtitle="Your voice shapes this sanctuary. Tell us what feels aligned — and what could flow better."
        />

        <View style={styles.card}>
          <Text style={styles.label}>Your Thoughts</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="What do you love? What could serve you better? All feedback is sacred here."
            placeholderTextColor="rgba(245,237,216,0.3)"
            multiline
            numberOfLines={5}
            style={styles.textarea}
          />
          <TouchableOpacity onPress={submit} style={styles.button}>
            <Text style={styles.buttonText}>Submit with Love ✦</Text>
          </TouchableOpacity>
        </View>

        {feedback.map((f) => (
          <View key={f.id} style={styles.feedbackCard}>
            <Text style={styles.feedbackTime}>{f.time}</Text>
            <Text style={styles.feedbackText}>"{f.text}"</Text>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 24,
  },
  label: {
    color: 'rgba(245,237,216,0.7)',
    fontSize: 13,
    marginBottom: 8,
  },
  textarea: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.glassBdr,
    borderRadius: 10,
    color: theme.cream,
    fontSize: 14,
    padding: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  button: {
    backgroundColor: theme.gold,
    borderRadius: 30,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.teal,
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.12)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  feedbackTime: {
    fontSize: 11,
    color: theme.terraLt,
    marginBottom: 6,
  },
  feedbackText: {
    color: theme.cream,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
