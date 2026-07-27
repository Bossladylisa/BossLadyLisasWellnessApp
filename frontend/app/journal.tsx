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

interface JournalEntry {
  id: string;
  text: string;
  time: string;
}

export default function JournalPage() {
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [entry, setEntry] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadJournalEntries();
  }, []);

  const loadJournalEntries = async () => {
    try {
      const data = await api.getJournalEntries();
      setJournal(data);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    }
  };

  const save = async () => {
    if (!entry.trim()) return;
    try {
      await api.createJournalEntry(entry);
      setEntry('');
      await loadJournalEntries();
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const del = async (id: string) => {
    try {
      await api.deleteJournalEntry(id);
      await loadJournalEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const filtered = journal.filter((e) =>
    e.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <PageHeader
          icon="📓"
          title="Grounded Thoughts"
          subtitle="Your sacred space for emotional snapshots, reflections, and DBT reframes."
        />

        <View style={styles.card}>
          <Text style={styles.label}>Your Emotional Snapshot</Text>
          <TextInput
            value={entry}
            onChangeText={setEntry}
            placeholder="Describe your mood, thoughts, or a DBT reframe you're working with…"
            placeholderTextColor="rgba(245,237,216,0.3)"
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />
          <TouchableOpacity onPress={save} style={styles.button}>
            <Text style={styles.buttonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>

        {journal.length > 0 && (
          <>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="🔍  Search your entries…"
              placeholderTextColor="rgba(245,237,216,0.3)"
              style={[styles.input, { marginBottom: 14 }]}
            />
            <Text style={styles.count}>
              {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}
            </Text>

            {filtered.map((e) => (
              <View key={e.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTime}>{e.time}</Text>
                  <TouchableOpacity onPress={() => del(e.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>✕ Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.entryText}>{e.text}</Text>
              </View>
            ))}
          </>
        )}

        {journal.length === 0 && (
          <Text style={styles.emptyText}>
            No entries yet — begin your first reflection above.
          </Text>
        )}
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
  card: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBdr,
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
    borderColor: Colors.glassBdr,
    borderRadius: 10,
    color: Colors.cream,
    fontSize: 14,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.glassBdr,
    borderRadius: 10,
    color: Colors.cream,
    fontSize: 14,
    padding: 14,
  },
  button: {
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
  count: {
    fontSize: 12,
    color: 'rgba(245,237,216,0.38)',
    marginBottom: 14,
  },
  entryCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.12)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTime: {
    fontSize: 11,
    color: Colors.terraLt,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  deleteText: {
    color: 'rgba(255,120,120,0.8)',
    fontSize: 12,
  },
  entryText: {
    color: Colors.cream,
    fontSize: 14,
    lineHeight: 22,
  },
  emptyText: {
    color: 'rgba(245,237,216,0.35)',
    fontStyle: 'italic',
    fontSize: 14,
  },
});
