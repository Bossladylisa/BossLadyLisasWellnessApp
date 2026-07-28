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

interface LifeNote {
  id: string;
  text: string;
}

export default function NotesPage() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [notes, setNotes] = useState<LifeNote[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const data = await api.getLifeNotes();
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const add = async () => {
    if (!note.trim()) return;
    try {
      await api.createLifeNote(note);
      setNote('');
      await loadNotes();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const del = async (id: string) => {
    try {
      await api.deleteLifeNote(id);
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <PageHeader
          icon="🧠"
          title="143 Life Notes℠"
          subtitle="Quick insights, reminders, and wisdom you gather along your journey. Your personal nuggets of truth."
        />

        <View style={styles.card}>
          <Text style={styles.label}>Add a Life Note</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={note}
              onChangeText={setNote}
              onSubmitEditing={add}
              placeholder="e.g., I am enough. Small steps lead to big changes."
              placeholderTextColor="rgba(245,237,216,0.3)"
              style={styles.input}
            />
            <TouchableOpacity onPress={add} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add ✦</Text>
            </TouchableOpacity>
          </View>
        </View>

        {notes.map((n, idx) => (
          <View key={n.id} style={styles.noteCard}>
            <Text style={styles.noteNumber}>#{String(notes.length - idx).padStart(3, '0')}</Text>
            <Text style={styles.noteText}>{n.text}</Text>
            <TouchableOpacity onPress={() => del(n.id)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {notes.length === 0 && (
          <Text style={styles.emptyText}>
            No notes yet — start capturing your wisdom.
          </Text>
        )}
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
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.glassBdr,
    borderRadius: 10,
    color: theme.cream,
    fontSize: 14,
    padding: 14,
  },
  addButton: {
    backgroundColor: theme.gold,
    borderRadius: 30,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    color: theme.teal,
    fontSize: 14,
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.12)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noteNumber: {
    fontSize: 11,
    color: theme.gold,
    paddingTop: 2,
    minWidth: 36,
  },
  noteText: {
    flex: 1,
    color: theme.cream,
    fontSize: 14,
    lineHeight: 22,
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
  emptyText: {
    color: 'rgba(245,237,216,0.35)',
    fontStyle: 'italic',
    fontSize: 14,
  },
});
