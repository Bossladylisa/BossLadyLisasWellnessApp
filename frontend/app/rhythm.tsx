import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { PageHeader } from '../src/components/PageHeader';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { useAuth } from '../src/store/useAuth';
import {
  Reminder,
  loadReminders,
  saveReminders,
  scheduleReminder,
  cancelReminder,
  scheduleFocusSession,
  cancelAllReminders,
  requestPermissions,
  notificationsSupported,
  isExpoGo,
} from '../src/utils/notifications';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

const PRESETS: Omit<Reminder, 'id' | 'enabled' | 'notificationIds'>[] = [
  {
    title: 'Morning Intention',
    body: 'Set your sacred intention for the day. What matters most?',
    hour: 8,
    minute: 0,
    days: ALL_DAYS,
    emoji: '🌅',
  },
  {
    title: 'Midday Pause',
    body: 'Sacred pause. Three deep breaths. How are you feeling?',
    hour: 12,
    minute: 30,
    days: WEEKDAYS,
    emoji: '🌿',
  },
  {
    title: 'Body Scan Check-in',
    body: 'Notice tension. Soften your shoulders. Unclench your jaw.',
    hour: 15,
    minute: 0,
    days: WEEKDAYS,
    emoji: '🦋',
  },
  {
    title: 'Evening Wind-Down',
    body: 'Gratitude time. What served you well today?',
    hour: 20,
    minute: 30,
    days: ALL_DAYS,
    emoji: '🌙',
  },
];

export default function RhythmPage() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [focusMinutes, setFocusMinutes] = useState('25');
  const [breakMinutes, setBreakMinutes] = useState('5');
  const [cycles, setCycles] = useState('4');
  const [sessionActive, setSessionActive] = useState(false);
  const [permGranted, setPermGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    initReminders();
  }, [user]);

  const initReminders = async () => {
    const perm = await requestPermissions();
    setPermGranted(perm);

    const saved = await loadReminders();
    if (saved.length === 0) {
      // First time — seed with presets
      const seeded: Reminder[] = PRESETS.map((p) => ({
        ...p,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        enabled: false,
      }));
      setReminders(seeded);
      await saveReminders(seeded);
    } else {
      setReminders(saved);
    }
  };

  const toggleReminder = async (r: Reminder) => {
    let updated: Reminder;

    if (r.enabled) {
      if (r.notificationIds) await cancelReminder(r.notificationIds);
      updated = { ...r, enabled: false, notificationIds: [] };
    } else {
      const ids = await scheduleReminder(r);
      updated = { ...r, enabled: true, notificationIds: ids };
    }

    const newReminders = reminders.map((x) => (x.id === r.id ? updated : x));
    setReminders(newReminders);
    await saveReminders(newReminders);
  };

  const startFocusSession = async () => {
    const w = parseInt(focusMinutes, 10) || 25;
    const b = parseInt(breakMinutes, 10) || 5;
    const c = Math.min(parseInt(cycles, 10) || 4, 8);

    const ids = await scheduleFocusSession(w, b, c);
    if (ids.length === 0 && Platform.OS !== 'web') {
      alert('Please enable notifications in your device settings to use focus sessions.');
      return;
    }
    setSessionActive(true);
  };

  const endFocusSession = async () => {
    await cancelAllReminders();
    // Re-schedule all enabled reminders
    for (const r of reminders) {
      if (r.enabled) {
        const ids = await scheduleReminder(r);
        r.notificationIds = ids;
      }
    }
    await saveReminders(reminders);
    setSessionActive(false);
  };

  if (!user) return <Redirect href="/login" />;

  const isPremium = user.subscription_tier === 'premium' || user.is_admin;

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <PageHeader
            icon="⏱️"
            title="Sacred Rhythm"
            subtitle="Structure your day with gentle, sacred reminders"
          />
          <View style={styles.lockCard}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockTitle}>Premium Feature</Text>
            <Text style={styles.lockText}>
              Sacred Rhythm helps you structure your day with gentle notifications for
              intentions, focus sessions, body check-ins, and wind-down rituals — a
              powerful support for time perception and executive function.
            </Text>
            <TouchableOpacity
              testID="rhythm-upgrade-btn"
              onPress={() => router.push('/upgrade' as any)}
              style={styles.upgradeButton}
            >
              <Text style={styles.upgradeButtonText}>✨ Unlock Sacred Sanctuary</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          icon="⏱️"
          title="Sacred Rhythm"
          subtitle="Structure your day with gentle, sacred reminders"
        />

        {Platform.OS === 'web' && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              📱 Notifications only work on the mobile app. Scan the QR code or download
              the published app to enable device reminders.
            </Text>
          </View>
        )}

        {isExpoGo && Platform.OS !== 'web' && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              📱 Sacred Rhythm needs a native build to fire real notifications. Expo Go
              (SDK 53+) removed background notification support. Once your app is published
              via the Emergent Publish button, reminders will schedule automatically on your
              device.
            </Text>
          </View>
        )}

        {permGranted === false && notificationsSupported && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ Please enable notifications in your device settings to receive
              reminders.
            </Text>
          </View>
        )}

        {/* Focus Session */}
        <Text style={styles.sectionTitle}>🧘 Focus Session</Text>
        <Text style={styles.sectionSubtitle}>
          Pomodoro-style timer with gentle transition chimes
        </Text>

        <View style={styles.card}>
          {!sessionActive ? (
            <>
              <View style={styles.timerRow}>
                <View style={styles.timerInput}>
                  <Text style={styles.timerLabel}>Focus</Text>
                  <TextInput
                    testID="focus-minutes-input"
                    style={styles.timerField}
                    value={focusMinutes}
                    onChangeText={setFocusMinutes}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={styles.timerUnit}>min</Text>
                </View>
                <View style={styles.timerInput}>
                  <Text style={styles.timerLabel}>Break</Text>
                  <TextInput
                    testID="break-minutes-input"
                    style={styles.timerField}
                    value={breakMinutes}
                    onChangeText={setBreakMinutes}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={styles.timerUnit}>min</Text>
                </View>
                <View style={styles.timerInput}>
                  <Text style={styles.timerLabel}>Cycles</Text>
                  <TextInput
                    testID="cycles-input"
                    style={styles.timerField}
                    value={cycles}
                    onChangeText={setCycles}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                  <Text style={styles.timerUnit}>×</Text>
                </View>
              </View>
              <TouchableOpacity
                testID="start-focus-btn"
                onPress={startFocusSession}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>✦ Begin Sacred Session</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.activeSession}>
              <Text style={styles.activeIcon}>✨</Text>
              <Text style={styles.activeTitle}>Session in Progress</Text>
              <Text style={styles.activeText}>
                {cycles} cycles of {focusMinutes} min focus + {breakMinutes} min breaks
                {'\n'}Notifications will guide you through each transition.
              </Text>
              <TouchableOpacity
                testID="end-focus-btn"
                onPress={endFocusSession}
                style={styles.dangerButton}
              >
                <Text style={styles.dangerButtonText}>End Session</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Daily Reminders */}
        <Text style={styles.sectionTitle}>🌅 Daily Rituals</Text>
        <Text style={styles.sectionSubtitle}>
          Gentle notifications throughout your day
        </Text>

        {reminders.map((r) => (
          <View key={r.id} style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderEmoji}>{r.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderTitle}>{r.title}</Text>
                <Text style={styles.reminderTime}>
                  {String(r.hour).padStart(2, '0')}:
                  {String(r.minute).padStart(2, '0')} ·{' '}
                  {r.days.length === 7 ? 'Every day' : r.days.length === 5 ? 'Weekdays' : `${r.days.length} days`}
                </Text>
              </View>
              <Switch
                testID={`toggle-reminder-${r.id}`}
                value={r.enabled}
                onValueChange={() => toggleReminder(r)}
                trackColor={{
                  false: 'rgba(255,255,255,0.15)',
                  true: theme.gold,
                }}
                thumbColor={r.enabled ? theme.teal : '#f4f3f4'}
              />
            </View>
            <Text style={styles.reminderBody}>{r.body}</Text>
            <View style={styles.daysRow}>
              {DAY_LABELS.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.dayChip,
                    r.days.includes(i) && styles.dayChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      r.days.includes(i) && styles.dayChipTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>💡 How this helps</Text>
          <Text style={styles.infoCardText}>
            For those who experience time blindness or executive-function challenges,
            regular gentle prompts create an external rhythm your body can
            follow — reducing decision fatigue and creating sacred structure without
            rigidity.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.teal },
    content: { padding: 24, paddingBottom: 40 },
    sectionTitle: {
      fontSize: 18,
      color: theme.goldLt,
      fontWeight: '600',
      marginBottom: 4,
      marginTop: 8,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.cream,
      opacity: 0.6,
      marginBottom: 14,
    },
    card: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    timerRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    timerInput: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      padding: 12,
    },
    timerLabel: {
      fontSize: 10,
      color: theme.terraLt,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
    },
    timerField: {
      fontSize: 28,
      color: theme.goldLt,
      fontWeight: '600',
      textAlign: 'center',
      minWidth: 50,
      padding: 0,
    },
    timerUnit: {
      fontSize: 10,
      color: theme.cream,
      opacity: 0.5,
      marginTop: 4,
    },
    primaryButton: {
      backgroundColor: theme.gold,
      borderRadius: 30,
      padding: 14,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: theme.teal,
      fontSize: 15,
      fontWeight: '700',
    },
    dangerButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'rgba(255,120,120,0.5)',
      borderRadius: 30,
      padding: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    dangerButtonText: {
      color: 'rgba(255,120,120,0.9)',
      fontSize: 13,
      fontWeight: '600',
    },
    activeSession: { alignItems: 'center', paddingVertical: 20 },
    activeIcon: { fontSize: 42, marginBottom: 12 },
    activeTitle: {
      fontSize: 20,
      color: theme.goldLt,
      fontWeight: '700',
      marginBottom: 12,
    },
    activeText: {
      color: theme.cream,
      opacity: 0.8,
      textAlign: 'center',
      lineHeight: 20,
    },
    reminderCard: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
    },
    reminderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    reminderEmoji: { fontSize: 26 },
    reminderTitle: {
      fontSize: 15,
      color: theme.goldLt,
      fontWeight: '600',
    },
    reminderTime: {
      fontSize: 11,
      color: theme.terraLt,
      marginTop: 2,
    },
    reminderBody: {
      color: theme.cream,
      opacity: 0.75,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 10,
    },
    daysRow: { flexDirection: 'row', gap: 4 },
    dayChip: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayChipActive: { backgroundColor: theme.terra },
    dayChipText: {
      color: theme.cream,
      opacity: 0.5,
      fontSize: 10,
      fontWeight: '600',
    },
    dayChipTextActive: { color: '#fff', opacity: 1 },
    infoBanner: {
      backgroundColor: 'rgba(232,184,77,0.12)',
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    infoText: {
      color: theme.cream,
      fontSize: 12,
      lineHeight: 18,
    },
    warningBanner: {
      backgroundColor: 'rgba(255,120,120,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,120,120,0.35)',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    warningText: {
      color: '#ffb0b0',
      fontSize: 12,
      lineHeight: 18,
    },
    infoCard: {
      backgroundColor: 'rgba(232,184,77,0.08)',
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 14,
      padding: 16,
      marginTop: 20,
    },
    infoCardTitle: {
      fontSize: 13,
      color: theme.goldLt,
      fontWeight: '700',
      marginBottom: 6,
    },
    infoCardText: {
      color: theme.cream,
      opacity: 0.7,
      fontSize: 12,
      lineHeight: 18,
    },
    lockCard: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      marginTop: 20,
    },
    lockIcon: { fontSize: 48, marginBottom: 16 },
    lockTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.goldLt,
      marginBottom: 12,
    },
    lockText: {
      color: theme.cream,
      opacity: 0.75,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    upgradeButton: {
      backgroundColor: theme.gold,
      borderRadius: 30,
      paddingVertical: 14,
      paddingHorizontal: 24,
    },
    upgradeButtonText: {
      color: theme.teal,
      fontSize: 15,
      fontWeight: '700',
    },
  });
