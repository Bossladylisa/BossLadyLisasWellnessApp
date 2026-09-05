import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { DecorativeBackground } from '../src/components/DecorativeBackground';
import { ThemePickerModal } from '../src/components/ThemePickerModal';
import { DragonflyIcon } from '../src/components/DragonflyIcon';
import { useAuthStore } from '../src/store/useAuth';

const getFeatures = (theme: Theme) => [
  {
    id: 'reset',
    icon: '🌿',
    title: 'Reset Toolkit',
    subtitle: 'Somatic mood reset with AI guidance',
    color: theme.terraLt,
  },
  {
    id: 'journal',
    icon: '📓',
    title: 'Daily Journal',
    subtitle: 'Grounded thoughts & reflections',
    color: theme.gold,
  },
  {
    id: 'notes',
    icon: '🧠',
    title: '143 Life Notes℠',
    subtitle: 'Wisdom you gather along the way',
    color: theme.goldLt,
  },
  {
    id: 'quotes',
    icon: 'DRAGONFLY',
    title: 'Quote Cards',
    subtitle: 'Beautiful visual affirmations',
    color: theme.terraLt,
  },
  {
    id: 'planner',
    icon: '📋',
    title: 'Boss Mode Planner℠',
    subtitle: 'Task management with intention',
    color: theme.terra,
  },
  {
    id: 'declutter',
    icon: '🧹',
    title: 'Declutter Tools',
    subtitle: 'Clear space + meditation timer',
    color: theme.gold,
  },
  {
    id: 'affirmations',
    icon: '⏰',
    title: 'Daily Affirmations',
    subtitle: '2:43 PM sacred reminders',
    color: theme.goldLt,
  },
  {
    id: 'rhythm',
    icon: '⏱️',
    title: 'Sacred Rhythm',
    subtitle: 'Structured reminders for time perception',
    color: theme.terra,
  },
  {
    id: 'feedback',
    icon: '💌',
    title: 'Share Feedback',
    subtitle: 'Your voice shapes this space',
    color: theme.terraLt,
  },
  {
    id: 'support',
    icon: '🤍',
    title: 'Wellness Support',
    subtitle: 'You are not in this alone',
    color: theme.gold,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [themePickerVisible, setThemePickerVisible] = useState(false);
  const [quota, setQuota] = useState<any | null>(null);
  const { user, logout } = useAuthStore();

  const features = useMemo(() => getFeatures(theme), [theme]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { api } = await import('../src/services/api');
        const q = await api.getAIUsage();
        setQuota(q);
      } catch {}
    })();
  }, [user?.user_id]);

  if (!user) return <Redirect href="/login" />;

  const tier = user?.subscription_tier;
  const isPremium =
    tier === 'blossom' || tier === 'grove' || tier === 'premium' || !!user?.is_admin;
  const PREMIUM_FEATURE_IDS = ['planner', 'declutter', 'affirmations', 'rhythm'];

  const welcomeWeekActive = !!quota?.welcome_week_active;
  const daysLeft = quota?.welcome_week_days_left ?? null;
  const isLastDayOfWelcome = welcomeWeekActive && daysLeft === 1;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container} testID="home-screen">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={theme.gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <DecorativeBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top bar with theme + user menu */}
        <View style={styles.topBar}>
          {user?.is_admin && (
            <TouchableOpacity
              testID="admin-shortcut-button"
              style={styles.topBarButton}
              onPress={() => router.push('/admin' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.topBarIcon}>👑</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="theme-picker-button"
            style={styles.topBarButton}
            onPress={() => setThemePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.topBarIcon}>🎨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="account-button"
            style={styles.topBarButton}
            onPress={() => router.push('/account' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.topBarIcon}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="logout-button"
            style={styles.topBarButton}
            onPress={logout}
            activeOpacity={0.7}
          >
            <Text style={styles.topBarIcon}>⎋</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <DragonflyIcon size={28} color={theme.terraLt} opacity={0.9} />
              <Text style={styles.brandText}>BossLadyLisa's℠</Text>
              <DragonflyIcon size={28} color={theme.terraLt} opacity={0.9} />
            </View>
            <Text style={styles.titleLine1}>BEAUTIFY</Text>
            <Text style={styles.titleLine2}>Yourself</Text>
            <Text style={styles.titleLine3}>AND BEYOND</Text>
            <View style={styles.dividerLine} />
            <Text style={styles.tagline}>
              This is where you Beautify Yourself on the inside
            </Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>

          {/* Dragonfly quote card */}
          <View style={styles.quoteCard} testID="daily-quote-card">
            <View style={styles.quoteDragonflyRow}>
              <DragonflyIcon size={36} color={theme.goldLt} opacity={0.95} />
            </View>
            <Text style={styles.quoteText}>
              "Because I can be the peace the world needs to feel."
            </Text>
            <Text style={styles.quoteAttribution}>
              We'll keep the light on for you.
            </Text>
          </View>

          {/* Feature Cards Grid */}
          <Text style={styles.sectionTitle}>Your Sanctuary Tools</Text>

          {isLastDayOfWelcome && !isPremium && (
            <TouchableOpacity
              onPress={() => router.push('/upgrade' as any)}
              style={styles.lastDayCard}
              activeOpacity={0.85}
            >
              <Text style={styles.lastDayIcon}>🌟</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.lastDayTitle}>Last day of your Welcome Week</Text>
                <Text style={styles.lastDayText}>
                  Keep unlimited AI flowing — pick Blossom Circle or Sacred Grove before it ends
                </Text>
              </View>
              <Text style={styles.lastDayArrow}>›</Text>
            </TouchableOpacity>
          )}

          {welcomeWeekActive && !isLastDayOfWelcome && !isPremium && (
            <View style={styles.welcomePill}>
              <Text style={styles.welcomePillIcon}>✨</Text>
              <Text style={styles.welcomePillText}>
                Welcome Week · {daysLeft ?? 0} day{daysLeft === 1 ? '' : 's'} of unlimited AI left
              </Text>
            </View>
          )}

          {!isPremium && !welcomeWeekActive && (
            <TouchableOpacity
              testID="upgrade-banner"
              onPress={() => router.push('/upgrade' as any)}
              style={styles.upgradeBanner}
              activeOpacity={0.7}
            >
              <Text style={styles.upgradeBannerIcon}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeBannerTitle}>
                  Bloom into more
                </Text>
                <Text style={styles.upgradeBannerText}>
                  Blossom $4.99/mo · Sacred Grove $14.99/mo — or start your free Welcome Week
                </Text>
              </View>
              <Text style={styles.upgradeBannerArrow}>›</Text>
            </TouchableOpacity>
          )}

          <View style={styles.cardsGrid}>
            {features.map((feature) => {
              const isPremiumFeature = PREMIUM_FEATURE_IDS.includes(feature.id);
              const isLocked = isPremiumFeature && !isPremium;

              return (
                <TouchableOpacity
                  key={feature.id}
                  testID={`feature-card-${feature.id}`}
                  style={[
                    styles.featureCard,
                    { borderColor: `${feature.color}55` },
                    isLocked && { opacity: 0.75 },
                  ]}
                  onPress={() =>
                    isLocked
                      ? router.push('/upgrade' as any)
                      : router.push(`/${feature.id}` as any)
                  }
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${feature.color}22` },
                    ]}
                  >
                    {feature.icon === 'DRAGONFLY' ? (
                      <DragonflyIcon size={28} color={feature.color} opacity={0.95} />
                    ) : (
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                    )}
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardTitle, { color: feature.color }]}>
                        {feature.title}
                      </Text>
                      {isPremiumFeature && (
                        <Text style={styles.premiumBadge}>
                          {isPremium ? '✨' : '🔒'}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.cardSubtitle}>{feature.subtitle}</Text>
                  </View>
                  <Text style={[styles.arrow, { color: feature.color }]}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              testID="disclaimer-link"
              onPress={() => router.push('/support' as any)}
              style={styles.disclaimerBanner}
              activeOpacity={0.7}
            >
              <Text style={styles.disclaimerBannerIcon}>🤍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.disclaimerBannerTitle}>
                  You are not in this alone.
                </Text>
                <Text style={styles.disclaimerBannerText}>
                  This app is a wellness companion — not a substitute for
                  licensed medical care. Tap for crisis resources.
                </Text>
              </View>
              <Text style={styles.disclaimerBannerArrow}>›</Text>
            </TouchableOpacity>

            <Text style={styles.footerQuote}>
              "Safety is the soil. Courage is the bloom."
            </Text>
            <Text style={styles.footerText}>
              Beautify Yourself & Beyond℠ · All Are Welcome Here
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <ThemePickerModal
        visible={themePickerVisible}
        onClose={() => setThemePickerVisible(false)}
      />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.teal,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    themeButton: {
      position: 'absolute',
      top: 12,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    themeButtonIcon: {
      fontSize: 20,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
      zIndex: 10,
    },
    topBarButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topBarIcon: {
      fontSize: 18,
      color: theme.cream,
    },
    upgradeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: 'rgba(232,184,77,0.18)',
      borderWidth: 1.5,
      borderColor: theme.gold,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    upgradeBannerIcon: {
      fontSize: 24,
    },
    upgradeBannerTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.goldLt,
      marginBottom: 2,
    },
    upgradeBannerText: {
      fontSize: 12,
      color: theme.cream,
      opacity: 0.8,
    },
    upgradeBannerArrow: {
      fontSize: 22,
      color: theme.gold,
      fontWeight: '600',
    },
    lastDayCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: 'rgba(232,184,77,0.28)',
      borderWidth: 2,
      borderColor: theme.gold,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    lastDayIcon: { fontSize: 26 },
    lastDayTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.goldLt,
      marginBottom: 3,
      letterSpacing: 0.3,
    },
    lastDayText: {
      fontSize: 12,
      color: theme.cream,
      opacity: 0.9,
      lineHeight: 17,
    },
    lastDayArrow: { fontSize: 22, color: theme.gold, fontWeight: '600' },
    welcomePill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: 'rgba(212,168,67,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(212,168,67,0.4)',
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginBottom: 16,
      alignSelf: 'center',
    },
    welcomePillIcon: { fontSize: 14 },
    welcomePillText: {
      color: theme.goldLt,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    premiumBadge: {
      fontSize: 12,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
      paddingTop: 20,
      zIndex: 1,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    brandText: {
      fontSize: 11,
      letterSpacing: 3,
      color: theme.terraLt,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    titleLine1: {
      fontSize: 42,
      fontWeight: '700',
      color: theme.gold,
      letterSpacing: 4,
      fontStyle: 'italic',
    },
    titleLine2: {
      fontSize: 48,
      fontWeight: '400',
      color: theme.goldLt,
      fontStyle: 'italic',
      marginVertical: -8,
    },
    titleLine3: {
      fontSize: 16,
      letterSpacing: 6,
      color: theme.cream,
      marginTop: 4,
    },
    dividerLine: {
      width: 60,
      height: 2,
      backgroundColor: theme.terra,
      marginVertical: 16,
    },
    tagline: {
      fontSize: 14,
      color: theme.cream,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 8,
      paddingHorizontal: 20,
    },
    dateText: {
      fontSize: 12,
      color: 'rgba(245,237,216,0.6)',
      marginTop: 4,
    },
    quoteCard: {
      backgroundColor: 'rgba(232,184,77,0.15)',
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      marginBottom: 28,
      zIndex: 1,
    },
    quoteDragonflyRow: {
      marginBottom: 16,
    },
    quoteText: {
      fontSize: 16,
      fontStyle: 'italic',
      color: theme.goldLt,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 12,
    },
    quoteAttribution: {
      fontSize: 11,
      color: theme.terraLt,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    sectionTitle: {
      fontSize: 20,
      color: theme.goldLt,
      marginBottom: 16,
      fontStyle: 'italic',
      paddingHorizontal: 4,
      textAlign: 'center',
    },
    cardsGrid: {
      gap: 12,
      zIndex: 1,
    },
    featureCard: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderRadius: 18,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    iconContainer: {
      width: 52,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureIcon: {
      fontSize: 26,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
    },
    cardSubtitle: {
      fontSize: 12,
      color: 'rgba(245,237,216,0.6)',
      lineHeight: 16,
    },
    arrow: {
      fontSize: 28,
      fontWeight: '300',
    },
    footer: {
      alignItems: 'center',
      marginTop: 32,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: theme.glassBdr,
    },
    disclaimerBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: 'rgba(232,184,77,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(232,184,77,0.35)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 24,
      width: '100%',
    },
    disclaimerBannerIcon: {
      fontSize: 22,
    },
    disclaimerBannerTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.goldLt,
      marginBottom: 2,
      fontStyle: 'italic',
    },
    disclaimerBannerText: {
      fontSize: 11,
      color: theme.cream,
      opacity: 0.75,
      lineHeight: 16,
    },
    disclaimerBannerArrow: {
      fontSize: 22,
      color: theme.goldLt,
      fontWeight: '300',
    },
    footerQuote: {
      fontSize: 13,
      color: 'rgba(245,237,216,0.5)',
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 6,
    },
    footerText: {
      fontSize: 10,
      color: 'rgba(245,237,216,0.3)',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  });
