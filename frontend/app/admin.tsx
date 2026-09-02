import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PageHeader } from '../src/components/PageHeader';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { useAuth, authFetch } from '../src/store/useAuth';

interface AdminStats {
  users: number;
  premium_users: number;
  admins: number;
  journal_entries: number;
  life_notes: number;
  tasks: number;
  affirmations: number;
  feedback: number;
  mood_entries: number;
}

interface AdminUser {
  user_id: string;
  email: string;
  name?: string;
  is_admin: boolean;
  subscription_tier: string;
  created_at?: string;
}

interface FeedbackItem {
  id: string;
  text: string;
  time: string;
  user_email?: string;
}

interface LogEntry {
  id: string;
  content_type: string;
  item_id: string;
  reason: string;
  admin_email?: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [tab, setTab] = useState<'overview' | 'users' | 'moderate' | 'log'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.is_admin) {
      loadAll();
    }
  }, [user]);

  const loadAll = async () => {
    try {
      const [s, u, f, l] = await Promise.all([
        authFetch('/admin/stats'),
        authFetch('/admin/users'),
        authFetch('/admin/feedback'),
        authFetch('/admin/moderation-log'),
      ]);
      if (s.ok) setStats(await s.json());
      if (u.ok) setUsers(await u.json());
      if (f.ok) setFeedback(await f.json());
      if (l.ok) setLog(await l.json());
    } catch (e: any) {
      setError('Failed to load admin data: ' + e?.message);
    }
  };

  const toggleAdmin = async (userId: string, current: boolean) => {
    try {
      const res = await authFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_admin: !current }),
      });
      if (res.ok) {
        await loadAll();
      } else {
        const err = await res.json();
        setError(err?.detail || 'Update failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Update failed');
    }
  };

  const togglePremium = async (userId: string, currentTier: string) => {
    try {
      const newTier = currentTier === 'premium' ? 'free' : 'premium';
      const res = await authFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ subscription_tier: newTier }),
      });
      if (res.ok) {
        await loadAll();
      }
    } catch (e: any) {
      setError(e?.message || 'Update failed');
    }
  };

  const removeContent = async (type: string, id: string) => {
    if (typeof confirm !== 'undefined' && !confirm('Remove this permanently?')) return;
    try {
      const res = await authFetch(
        `/admin/moderate/${type}/${id}?reason=${encodeURIComponent('Admin removal')}`,
        { method: 'DELETE' }
      );
      if (res.ok) await loadAll();
    } catch (e: any) {
      setError(e?.message);
    }
  };

  if (!user?.is_admin) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.lockCard}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockTitle}>Admin Access Only</Text>
            <Text style={styles.lockText}>
              You don't have admin privileges. If you should, please contact
              BossLadyLisa to be promoted.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Return to Sanctuary</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          icon="👑"
          title="Admin Dashboard"
          subtitle={`Signed in as ${user.email}`}
        />

        <View style={styles.tabs}>
          {(['overview', 'users', 'moderate', 'log'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              testID={`admin-tab-${t}`}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'overview' ? '📊' : t === 'users' ? '👥' : t === 'moderate' ? '⚖️' : '📜'}{' '}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {tab === 'overview' && stats && (
          <View>
            <View style={styles.statsGrid}>
              <StatCard label="Total Users" value={stats.users} theme={theme} />
              <StatCard label="Premium Users" value={stats.premium_users} theme={theme} />
              <StatCard label="Admins" value={stats.admins} theme={theme} />
              <StatCard label="Journal Entries" value={stats.journal_entries} theme={theme} />
              <StatCard label="Life Notes" value={stats.life_notes} theme={theme} />
              <StatCard label="Tasks" value={stats.tasks} theme={theme} />
              <StatCard label="Affirmations" value={stats.affirmations} theme={theme} />
              <StatCard label="Feedback" value={stats.feedback} theme={theme} />
              <StatCard label="Mood Entries" value={stats.mood_entries} theme={theme} />
            </View>
          </View>
        )}

        {tab === 'users' && (
          <View>
            <Text style={styles.sectionTitle}>👥 Manage Users</Text>
            {users.map((u) => (
              <View key={u.user_id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userEmail}>
                      {u.email}
                      {u.user_id === user.user_id && ' (You)'}
                    </Text>
                    {u.name && <Text style={styles.userName}>{u.name}</Text>}
                    <View style={styles.badges}>
                      {u.is_admin && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>👑 Admin</Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.tierBadge,
                          u.subscription_tier === 'premium' && styles.tierBadgePremium,
                        ]}
                      >
                        <Text style={styles.tierBadgeText}>
                          {u.subscription_tier === 'premium' ? '✨ Premium' : '🌱 Free'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    testID={`toggle-admin-${u.user_id}`}
                    onPress={() => toggleAdmin(u.user_id, u.is_admin)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>
                      {u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID={`toggle-premium-${u.user_id}`}
                    onPress={() => togglePremium(u.user_id, u.subscription_tier)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>
                      {u.subscription_tier === 'premium' ? 'Set Free' : 'Grant Premium'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'moderate' && (
          <View>
            <Text style={styles.sectionTitle}>💌 User Feedback</Text>
            {feedback.length === 0 ? (
              <Text style={styles.emptyText}>No feedback yet.</Text>
            ) : (
              feedback.map((item) => (
                <View key={item.id} style={styles.moderationCard}>
                  <Text style={styles.moderationTime}>
                    {item.time} {item.user_email && `· ${item.user_email}`}
                  </Text>
                  <Text style={styles.moderationText}>"{item.text}"</Text>
                  <TouchableOpacity
                    onPress={() => removeContent('feedback', item.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'log' && (
          <View>
            <Text style={styles.sectionTitle}>📜 Moderation Log</Text>
            {log.length === 0 ? (
              <Text style={styles.emptyText}>No moderation actions yet.</Text>
            ) : (
              log.map((entry) => (
                <View key={entry.id} style={styles.logEntry}>
                  <Text style={styles.logType}>{entry.content_type.toUpperCase()}</Text>
                  <Text style={styles.logMeta}>
                    {new Date(entry.timestamp).toLocaleString()} · {entry.admin_email || 'admin'}
                  </Text>
                  <Text style={styles.logReason}>{entry.reason}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const StatCard = ({ label, value, theme }: any) => (
  <View
    style={{
      width: '48%',
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginBottom: 8,
    }}
  >
    <Text style={{ fontSize: 26, fontWeight: '700', color: theme.goldLt }}>
      {value}
    </Text>
    <Text style={{ fontSize: 11, color: theme.cream, opacity: 0.7, marginTop: 4 }}>
      {label}
    </Text>
  </View>
);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.teal },
    content: { padding: 24, paddingBottom: 40 },
    tabs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      minWidth: '22%',
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 18,
      paddingVertical: 8,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: theme.terra,
      borderColor: theme.gold,
    },
    tabText: { fontSize: 11, color: theme.cream, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    error: { color: '#ff8080', fontSize: 13, marginBottom: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    sectionTitle: {
      fontSize: 16,
      color: theme.goldLt,
      fontWeight: '600',
      marginBottom: 10,
    },
    emptyText: {
      color: theme.cream,
      opacity: 0.5,
      fontStyle: 'italic',
      textAlign: 'center',
      padding: 20,
    },
    userCard: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    userHeader: { marginBottom: 10 },
    userEmail: { color: theme.goldLt, fontSize: 14, fontWeight: '600' },
    userName: { color: theme.cream, opacity: 0.7, fontSize: 12, marginTop: 2 },
    badges: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
    adminBadge: {
      backgroundColor: 'rgba(232,184,77,0.2)',
      borderWidth: 1,
      borderColor: theme.gold,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    adminBadgeText: { color: theme.gold, fontSize: 10, fontWeight: '700' },
    tierBadge: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    tierBadgePremium: {
      backgroundColor: 'rgba(232,184,77,0.15)',
      borderColor: theme.gold,
    },
    tierBadgeText: { color: theme.cream, fontSize: 10, fontWeight: '600' },
    userActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    actionBtn: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    actionBtnText: { color: theme.cream, fontSize: 11, fontWeight: '600' },
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
      color: theme.cream,
      fontSize: 13,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    removeBtn: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,80,80,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,80,80,0.4)',
      borderRadius: 6,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    removeBtnText: { color: 'rgba(255,120,120,0.9)', fontSize: 11, fontWeight: '600' },
    logEntry: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    logType: { color: theme.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    logMeta: { color: theme.cream, opacity: 0.6, fontSize: 10, marginTop: 4 },
    logReason: { color: theme.cream, fontSize: 12, marginTop: 4 },
    lockCard: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      marginTop: 60,
    },
    lockIcon: { fontSize: 48, marginBottom: 16 },
    lockTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.goldLt,
      marginBottom: 12,
    },
    lockText: {
      color: theme.cream,
      opacity: 0.7,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    backButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.glassBdr,
    },
    backButtonText: { color: theme.cream, opacity: 0.8 },
  });
