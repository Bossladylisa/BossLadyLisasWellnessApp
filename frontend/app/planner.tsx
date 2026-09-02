import React, { useState, useEffect, useMemo } from 'react';
import { Redirect } from 'expo-router';
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
import { Picker } from '@react-native-picker/picker';
import { PageHeader } from '../src/components/PageHeader';
import { useTheme } from '../src/store/useTheme';
import { useAuth } from '../src/store/useAuth';
import { Theme } from '../src/constants/themes';
import { api } from '../src/services/api';

interface Task {
  id: string;
  text: string;
  priority: string;
  completed: boolean;
}

export default function PlannerPage() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { user: _authUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const add = async () => {
    if (!taskText.trim()) return;
    try {
      await api.createTask(taskText, priority);
      setTaskText('');
      await loadTasks();
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const complete = async (id: string) => {
    try {
      await api.updateTask(id, true);
      await loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const del = async (id: string) => {
    try {
      await api.deleteTask(id);
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const incomplete = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  const getPriorityColor = (p: string) =>
    p === 'High' ? '#ff8080' : p === 'Medium' ? theme.gold : '#6dd5c4';

  const getPriorityBg = (p: string) =>
    p === 'High'
      ? 'rgba(220,60,60,0.2)'
      : p === 'Medium'
      ? 'rgba(212,168,67,0.2)'
      : 'rgba(26,107,97,0.3)';

  if (!_authUser) return <Redirect href="/login" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <PageHeader
          icon="📋"
          title="Boss Mode Planner℠"
          subtitle="Organize your tasks with intention. Prioritize what serves your highest self."
        />

        <View style={styles.card}>
          <Text style={styles.label}>New Task</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={taskText}
              onChangeText={setTaskText}
              onSubmitEditing={add}
              placeholder="e.g., Set financial boundaries, morning journaling…"
              placeholderTextColor="rgba(245,237,216,0.3)"
              style={styles.input}
            />
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={priority}
                onValueChange={(value) => setPriority(value)}
                style={styles.picker}
                dropdownIconColor={theme.cream}
              >
                <Picker.Item label="High" value="High" />
                <Picker.Item label="Medium" value="Medium" />
                <Picker.Item label="Low" value="Low" />
              </Picker>
            </View>
          </View>
          <TouchableOpacity onPress={add} style={styles.button}>
            <Text style={styles.buttonText}>Add to Planner</Text>
          </TouchableOpacity>
        </View>

        {incomplete.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Active Tasks</Text>
            {incomplete.map((t) => (
              <View key={t.id} style={styles.taskCard}>
                <View style={{ flex: 1 }}>
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor: getPriorityBg(t.priority),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(t.priority) },
                      ]}
                    >
                      {t.priority}
                    </Text>
                  </View>
                  <Text style={styles.taskText}>{t.text}</Text>
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    onPress={() => complete(t.id)}
                    style={styles.doneButton}
                  >
                    <Text style={styles.doneText}>✓ Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => del(t.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {done.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={[styles.sectionTitle, { color: 'rgba(245,237,216,0.4)' }]}>
              Completed
            </Text>
            {done.map((t) => (
              <View key={t.id} style={styles.completedTask}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.completedText}>{t.text}</Text>
                <TouchableOpacity onPress={() => del(t.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {tasks.length === 0 && (
          <Text style={styles.emptyText}>
            No tasks yet — add what calls for your attention today.
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
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
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
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.glassBdr,
    borderRadius: 10,
    justifyContent: 'center',
    minWidth: 110,
  },
  picker: {
    color: theme.cream,
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
  sectionTitle: {
    fontSize: 20,
    color: theme.goldLt,
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.12)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskText: {
    color: theme.cream,
    fontSize: 14,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 6,
  },
  doneButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.glassBdr,
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  doneText: {
    color: theme.cream,
    fontSize: 12,
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
  divider: {
    height: 1,
    backgroundColor: theme.glassBdr,
    marginVertical: 20,
  },
  completedTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  checkmark: {
    color: '#6dd5c4',
  },
  completedText: {
    flex: 1,
    color: 'rgba(245,237,216,0.28)',
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  emptyText: {
    color: 'rgba(245,237,216,0.35)',
    fontStyle: 'italic',
    fontSize: 14,
  },
});
