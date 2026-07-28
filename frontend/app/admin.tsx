import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { PageHeader } from '../src/components/PageHeader';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface AdminStats {
  journal_entries: number;
  life_notes: number;
  tasks: number;
  affirmations: number;
  feedback: number;
  mood_entries: number;
  total_content: number;
}

interface FeedbackItem {
  id: string;
  text: string;
  time: string;
}

interface ModerationLog {
  id: string;
  content_type: string;
  item_id: string;
  reason: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [moderationLog, setModerationLog] = useState<ModerationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'log'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError('Invalid admin password');
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);
      await loadData();
    } catch (e) {
      setError('Connection error');
    }
    setLoading(false);
  };

  const loadData = async () => {
    try {
      const [statsRes, feedbackRes, logRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats?password=${encodeURIComponent(password)}`),
        fetch(`${API_BASE}/admin/feedback?password=${encodeURIComponent(password)}`),
        fetch(`${API_BASE}/admin/moderation-log?password=${encodeURIComponent(password)}`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (feedbackRes.ok) setFeedback(await feedbackRes.json());
      if (logRes.ok) setModerationLog(await logRes.json());
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  const handleRemove = async (type: string, id: string) => {
    if (!confirm('Remove this item permanently? This cannot be undone.')) return;

    try {
      const res = await fetch(
        `${API_BASE}/admin/moderate/${type}/${id}?password=${encodeURIComponent(password)}&reason=${encodeURIComponent('Admin removal')}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        await loadData();
      } else {
        setError('Failed to remove item');
      }
    } catch (e) {
      setError('Connection error');
    }
  };

  if (!isAuthenticated) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.loginContent}>
          <View style={styles.loginCard}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.loginTitle}>Admin Access</Text>
            <Text style={styles.loginSubtitle}>
              Enter admin password to manage content
            </Text>

            <TextInput
              testID="admin-password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="Admin password"
              placeholderTextColor="rgba(245,237,216,0.3)"
              secureTextEntry
              style={styles.input}
              onSubmitEditing={handleLogin}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              testID="admin-login-btn"
              onPress={handleLogin}
              disabled={loading}
              style={[styles.button, loading && { opacity: 0.6 }]}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Verifying…' : 'Enter Dashboard ✦'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          icon="👑"
          title="Admin Dashboard"
          subtitle="Content moderation & app oversight"
        />

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['overview', 'moderation', 'log'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              testID={`admin-tab-${tab}`}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === 'overview' ? '📊 Overview' : tab === 'moderation' ? '⚖️ Moderate' : '📜 Log'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'overview' && stats && (
          <View>
            <View style={styles.statsGrid}>
              <StatCard label="Journal Entries" value={stats.journal_entries} theme={theme} styles={styles} />
              <StatCard label="Life Notes" value={stats.life_notes} theme={theme} styles={styles} />
              <StatCard label="Tasks" value={stats.tasks} theme={theme} styles={styles} />
              <StatCard label="Affirmations" value={stats.affirmations} theme={theme} styles={styles} />
              <StatCard label="Feedback" value={stats.feedback} theme={theme} styles={styles} />
              <StatCard label="Mood Entries" value={stats.mood_entries} theme={theme} styles={styles} />
            </View>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total User-Generated Content</Text>
              <Text style={styles.totalValue}>{stats.total_content}</Text>
            </View>
          </View>
        )}

        {activeTab === 'moderation' && (
          <View>
            <Text style={styles.sectionTitle}>💌 User Feedback</Text>
            <Text style={styles.sectionSubtitle}>
              Review and remove inappropriate feedback
            </Text>

            {feedback.length === 0 ? (
              <Text style={styles.emptyText}>No feedback yet.</Text>
            ) : (
              feedback.map((item) => (
                <View key={item.id} style={styles.moderationCard}>
                  <Text style={styles.moderationTime}>{item.time}</Text>
                  <Text style={styles.moderationText}>"{item.text}"</Text>
                  <TouchableOpacity
                    testID={`remove-feedback-${item.id}`}
                    onPress={() => handleRemove('feedback', item.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'log' && (
          <View>
            <Text style={styles.sectionTitle}>📜 Moderation Log</Text>
            <Text style={styles.sectionSubtitle}>
              Audit trail of all admin actions
            </Text>

            {moderationLog.length === 0 ? (
              <Text style={styles.emptyText}>No moderation actions yet.</Text>
            ) : (
              moderationLog.map((entry) => (
                <View key={entry.id} style={styles.logEntry}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logType}>
                      {entry.content_type.toUpperCase()}
                    </Text>
                    <Text style={styles.logTime}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.logReason}>Reason: {entry.reason}</Text>
                  <Text style={styles.logId}>Item ID: {entry.item_id}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <TouchableOpacity
          testID="admin-logout-btn"
          onPress={() => {
            setIsAuthenticated(false);
            setPassword('');
            setStats(null);
            setFeedback([]);
            setModerationLog([]);
          }}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const StatCard = ({ label, value, theme, styles }: any) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.teal,
    },
    content: {
      padding: 24,
      paddingBottom: 40,
    },
    loginContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    loginCard: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
    },
    lockIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    loginTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.goldLt,
      marginBottom: 8,
    },
    loginSubtitle: {
      fontSize: 13,
      color: theme.cream,
      opacity: 0.7,
      textAlign: 'center',
      marginBottom: 24,
    },
    input: {
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 12,
      color: theme.cream,
      fontSize: 14,
      padding: 14,
      marginBottom: 16,
    },
    error: {
      color: '#ff8080',
      fontSize: 13,
      marginBottom: 12,
      textAlign: 'center',
    },
    button: {
      width: '100%',
      backgroundColor: theme.gold,
      borderRadius: 30,
      padding: 14,
      alignItems: 'center',
    },
    buttonText: {
      color: theme.teal,
      fontSize: 14,
      fontWeight: '700',
    },
    tabs: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 20,
      paddingVertical: 10,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: theme.terra,
      borderColor: theme.gold,
    },
    tabText: {
      fontSize: 12,
      color: theme.cream,
      fontWeight: '600',
    },
    tabTextActive: {
      color: '#fff',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    statCard: {
      width: '48%',
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.goldLt,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      color: theme.cream,
      opacity: 0.7,
      textAlign: 'center',
    },
    totalCard: {
      backgroundColor: 'rgba(232,184,77,0.15)',
      borderWidth: 1,
      borderColor: theme.gold,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 12,
      color: theme.cream,
      opacity: 0.8,
      marginBottom: 6,
    },
    totalValue: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.gold,
    },
    sectionTitle: {
      fontSize: 18,
      color: theme.goldLt,
      fontWeight: '600',
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.cream,
      opacity: 0.6,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 13,
      color: theme.cream,
      opacity: 0.5,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 24,
    },
    moderationCard: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    moderationTime: {
      fontSize: 11,
      color: theme.terraLt,
      marginBottom: 6,
    },
    moderationText: {
      fontSize: 13,
      color: theme.cream,
      lineHeight: 20,
      fontStyle: 'italic',
      marginBottom: 10,
    },
    removeButton: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,80,80,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,80,80,0.4)',
      borderRadius: 6,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    removeButtonText: {
      color: 'rgba(255,120,120,0.9)',
      fontSize: 12,
      fontWeight: '600',
    },
    logEntry: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    logType: {
      fontSize: 11,
      color: theme.gold,
      fontWeight: '700',
      letterSpacing: 1,
    },
    logTime: {
      fontSize: 10,
      color: theme.cream,
      opacity: 0.5,
    },
    logReason: {
      fontSize: 12,
      color: theme.cream,
      marginBottom: 4,
    },
    logId: {
      fontSize: 10,
      color: theme.cream,
      opacity: 0.4,
      fontFamily: 'monospace',
    },
    logoutButton: {
      alignSelf: 'center',
      marginTop: 24,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 20,
    },
    logoutText: {
      color: theme.cream,
      opacity: 0.7,
      fontSize: 12,
    },
  });
