import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { useAuthStore, authFetch } from '../src/store/useAuth';
import { PageHeader } from '../src/components/PageHeader';

export default function AccountScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, logout } = useAuthStore();
  const [deleting, setDeleting] = useState(false);

  if (!user) return <Redirect href="/login" />;

  const confirmDelete = () => {
    const message =
      'This permanently deletes your account, journal, notes, tasks, affirmations, mood history, and cancels any active subscription. This cannot be undone.';

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      const ok = typeof window !== 'undefined' && window.confirm(`Delete your account?\n\n${message}`);
      if (ok) performDelete();
      return;
    }

    Alert.alert(
      'Delete your account?',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: performDelete,
        },
      ],
      { cancelable: true },
    );
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      const res = await authFetch('/auth/account', { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (Platform.OS === 'web') {
          window.alert(body.detail || 'Could not delete your account. Please try again.');
        } else {
          Alert.alert('Delete failed', body.detail || 'Please try again.');
        }
        setDeleting(false);
        return;
      }
      // Clear local session and route to login
      await logout();
      router.replace('/login' as any);
    } catch (e: any) {
      if (Platform.OS === 'web') {
        window.alert('Delete failed. Please try again.');
      } else {
        Alert.alert('Delete failed', 'Please try again.');
      }
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          icon="⚙️"
          title="Account"
          subtitle="Manage your BossLadyLisa's℠ account, subscription, and personal data."
        />

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Signed in as</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.name ? <Text style={styles.name}>{user.name}</Text> : null}
          <View style={styles.tierRow}>
            <Text style={styles.tierPill}>
              {user.subscription_tier === 'grove'
                ? '🦋 Sacred Grove'
                : user.subscription_tier === 'blossom' || user.subscription_tier === 'premium'
                ? '🌸 Blossom Circle'
                : '🌱 Sanctuary Seed'}
            </Text>
            {user.is_admin ? <Text style={styles.adminPill}>👑 Admin</Text> : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/upgrade' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Subscription</Text>
            <Text style={styles.actionSubtitle}>View tiers, upgrade or downgrade</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>⎋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Sign out</Text>
            <Text style={styles.actionSubtitle}>You can sign back in anytime</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.dangerSection}>
          <Text style={styles.dangerLabel}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Delete Account</Text>
            <Text style={styles.dangerBody}>
              Permanently remove your account and all personal data — journal entries, notes,
              tasks, affirmations, mood history, and subscription. This action cannot be
              undone.
            </Text>
            <TouchableOpacity
              onPress={confirmDelete}
              disabled={deleting}
              style={[styles.dangerButton, deleting && { opacity: 0.6 }]}
              activeOpacity={0.75}
              testID="delete-account-button"
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.dangerButtonText}>Delete My Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.privacyNote}>
          Your data is stored securely and never sold. Anonymized moderation logs and payment
          records may be retained for legal/audit purposes as required by law.
        </Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.teal },
    content: { padding: 24, paddingBottom: 40 },
    card: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 18,
      padding: 20,
      marginBottom: 20,
    },
    cardLabel: {
      fontSize: 11,
      color: 'rgba(245,237,216,0.45)',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    email: {
      color: theme.goldLt,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    name: {
      color: theme.cream,
      opacity: 0.7,
      fontSize: 13,
    },
    tierRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      flexWrap: 'wrap',
    },
    tierPill: {
      backgroundColor: 'rgba(212,168,67,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(212,168,67,0.4)',
      color: theme.goldLt,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 12,
      fontSize: 12,
      fontWeight: '600',
    },
    adminPill: {
      backgroundColor: 'rgba(232,184,77,0.25)',
      borderWidth: 1,
      borderColor: theme.gold,
      color: theme.gold,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 12,
      fontSize: 12,
      fontWeight: '700',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
    },
    actionIcon: { fontSize: 20 },
    actionTitle: {
      color: theme.cream,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 2,
    },
    actionSubtitle: {
      color: theme.cream,
      opacity: 0.55,
      fontSize: 12,
    },
    actionArrow: {
      color: theme.gold,
      fontSize: 24,
      fontWeight: '300',
    },
    dangerSection: { marginTop: 28 },
    dangerLabel: {
      fontSize: 11,
      color: '#ff9080',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 10,
      fontWeight: '700',
    },
    dangerCard: {
      backgroundColor: 'rgba(255,100,100,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,100,100,0.35)',
      borderRadius: 16,
      padding: 18,
    },
    dangerTitle: {
      color: '#ffa090',
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 8,
    },
    dangerBody: {
      color: theme.cream,
      opacity: 0.8,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 16,
    },
    dangerButton: {
      backgroundColor: '#c74a3a',
      borderRadius: 30,
      padding: 12,
      alignItems: 'center',
    },
    dangerButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    privacyNote: {
      color: theme.cream,
      opacity: 0.5,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 22,
      paddingHorizontal: 8,
    },
  });
