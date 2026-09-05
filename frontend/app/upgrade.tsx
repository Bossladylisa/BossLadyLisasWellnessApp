import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking as RNLinking,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter, Redirect } from 'expo-router';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { useAuthStore } from '../src/store/useAuth';
import { api } from '../src/services/api';
import { DragonflyIcon } from '../src/components/DragonflyIcon';

type TierId = 'free' | 'blossom' | 'grove';

interface TierDef {
  id: TierId;
  emoji: string;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  ai: string;
  perks: string[];
  cta: string;
  accent: 'seed' | 'blossom' | 'grove';
}

const TIERS: TierDef[] = [
  {
    id: 'free',
    emoji: '🌱',
    name: 'Sanctuary Seed',
    price: 'Free',
    cadence: 'forever',
    tagline: 'Where every journey begins',
    ai: 'Welcome Week: 7 days unlimited AI · then 3 AI resets / week',
    perks: [
      'Daily Journal',
      '143 Life Notes℠',
      'Quote Cards',
      'Wellness Support',
      'Feedback channel',
    ],
    cta: 'Current tier',
    accent: 'seed',
  },
  {
    id: 'blossom',
    emoji: '🌸',
    name: 'Blossom Circle',
    price: '$4.99',
    cadence: '/ month',
    tagline: 'Everyday tools for a rooted life',
    ai: '30 AI responses / month',
    perks: [
      'Everything in Sanctuary Seed',
      'Boss Mode Planner℠',
      'Declutter Tools',
      'Daily Affirmations℠',
      'All 4 themes unlocked',
    ],
    cta: 'Begin Blossom Circle',
    accent: 'blossom',
  },
  {
    id: 'grove',
    emoji: '🦋',
    name: 'Sacred Grove',
    price: '$14.99',
    cadence: '/ month',
    tagline: 'The full sanctuary experience',
    ai: 'Unlimited AI · always flowing',
    perks: [
      'Everything in Blossom Circle',
      'Sacred Rhythm notifications',
      'Advanced Weekly AI Insights',
      'Community Garden early access',
      'Priority support',
    ],
    cta: 'Ascend to Sacred Grove',
    accent: 'grove',
  },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuthStore();

  const [busyTier, setBusyTier] = useState<TierId | null>(null);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const q = await api.getAIUsage();
        setQuota(q);
      } catch {
        // silent
      }
    })();
  }, []);

  if (!user) return <Redirect href="/login" />;

  // Normalize legacy 'premium' → 'blossom' for display
  const currentTier: TierId =
    user.subscription_tier === 'premium'
      ? 'blossom'
      : (user.subscription_tier as TierId) || 'free';

  const isAdmin = !!user.is_admin;

  const handleSubscribe = async (tier: TierId) => {
    if (tier === 'free') return;
    setError('');
    setBusyTier(tier);
    try {
      const returnTo =
        Platform.OS === 'web' ? window.location.origin + '/' : Linking.createURL('');
      const data = await api.createCheckout(returnTo, tier);
      if (data?.checkout_url) {
        if (Platform.OS === 'web') {
          window.location.href = data.checkout_url;
        } else {
          await RNLinking.openURL(data.checkout_url);
        }
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError('Could not start checkout. Please try again.');
      }
    } catch (e: any) {
      setError('Checkout error: ' + (e?.message || 'Please try again'));
    } finally {
      setBusyTier(null);
    }
  };

  const handleStartWelcomeWeek = async () => {
    try {
      const res = await api.startWelcomeWeek();
      if (res?.quota) setQuota(res.quota);
    } catch (e) {
      // handled by UI state below via next getAIUsage refresh
    }
  };

  const canStartWelcomeWeek =
    currentTier === 'free' &&
    !quota?.welcome_week_active &&
    quota?.welcome_week_days_left === undefined;

  const isCurrent = (tier: TierId) => {
    if (isAdmin) return tier === 'grove'; // admins effectively have grove
    return tier === currentTier;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <DragonflyIcon size={54} color={theme.goldLt} opacity={0.95} />
          <Text style={styles.title}>Choose Your Sanctuary</Text>
          <Text style={styles.subtitle}>
            Three tiers · one journey inward. Cancel anytime.
          </Text>
        </View>

        {/* Welcome Week widget */}
        {quota?.welcome_week_active && (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeIcon}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeTitle}>Your Welcome Week is Active</Text>
              <Text style={styles.welcomeText}>
                {quota.welcome_week_days_left ?? 0} day
                {quota.welcome_week_days_left === 1 ? '' : 's'} left of unlimited AI ✦{' '}
                {quota.welcome_week_days_left === 1
                  ? 'Consider upgrading before it ends'
                  : 'Enjoy the flow'}
              </Text>
            </View>
          </View>
        )}

        {canStartWelcomeWeek && (
          <TouchableOpacity
            onPress={handleStartWelcomeWeek}
            style={styles.startWelcomeBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.startWelcomeIcon}>🌟</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.startWelcomeTitle}>Start My Welcome Week</Text>
              <Text style={styles.startWelcomeText}>
                7 days of unlimited AI — no card needed
              </Text>
            </View>
            <Text style={styles.startWelcomeArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Tier Cards */}
        {TIERS.map((tier) => {
          const current = isCurrent(tier.id);
          const busy = busyTier === tier.id;
          const accent =
            tier.accent === 'seed'
              ? theme.terraLt
              : tier.accent === 'blossom'
              ? theme.gold
              : theme.goldLt;

          return (
            <View
              key={tier.id}
              style={[
                styles.tierCard,
                { borderColor: current ? accent : `${accent}55` },
                current && styles.tierCardCurrent,
                tier.id === 'grove' && !current && styles.tierCardHighlight,
              ]}
            >
              {tier.id === 'grove' && !current && (
                <View style={styles.mostLoved}>
                  <Text style={styles.mostLovedText}>MOST LOVED</Text>
                </View>
              )}

              <View style={styles.tierHeader}>
                <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierName, { color: accent }]}>{tier.name}</Text>
                  <Text style={styles.tierTagline}>{tier.tagline}</Text>
                </View>
                {current && (
                  <View style={styles.currentPill}>
                    <Text style={styles.currentPillText}>Active</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceRow}>
                <Text style={[styles.priceAmount, { color: accent }]}>{tier.price}</Text>
                {tier.cadence !== 'forever' && (
                  <Text style={styles.pricePeriod}>{tier.cadence}</Text>
                )}
                {tier.cadence === 'forever' && (
                  <Text style={styles.pricePeriodMuted}>{tier.cadence}</Text>
                )}
              </View>

              <View style={styles.aiRow}>
                <Text style={styles.aiIcon}>✦</Text>
                <Text style={styles.aiText}>{tier.ai}</Text>
              </View>

              <View style={styles.perks}>
                {tier.perks.map((p, i) => (
                  <View key={i} style={styles.perkRow}>
                    <Text style={[styles.perkCheck, { color: accent }]}>✓</Text>
                    <Text style={styles.perkText}>{p}</Text>
                  </View>
                ))}
              </View>

              {!current && tier.id !== 'free' && (
                <TouchableOpacity
                  onPress={() => handleSubscribe(tier.id)}
                  disabled={busy}
                  style={[
                    styles.ctaButton,
                    { backgroundColor: accent },
                    busy && { opacity: 0.6 },
                  ]}
                  activeOpacity={0.8}
                >
                  {busy ? (
                    <ActivityIndicator color={theme.teal} />
                  ) : (
                    <Text style={styles.ctaText}>✨ {tier.cta}</Text>
                  )}
                </TouchableOpacity>
              )}

              {current && (
                <View style={styles.ctaGhost}>
                  <Text style={styles.ctaGhostText}>{tier.cta}</Text>
                </View>
              )}
            </View>
          );
        })}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.footerLegal}>
          Payments processed securely by Stripe. Subscriptions auto-renew monthly and can be
          cancelled anytime from your account. See our Wellness Support page for crisis resources.
        </Text>

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Sanctuary</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.teal },
    content: { padding: 20, paddingBottom: 40 },
    hero: { alignItems: 'center', paddingVertical: 20, marginBottom: 8 },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.goldLt,
      marginTop: 10,
      fontStyle: 'italic',
      letterSpacing: 0.4,
    },
    subtitle: {
      fontSize: 13,
      color: theme.cream,
      opacity: 0.7,
      textAlign: 'center',
      marginTop: 8,
    },
    welcomeCard: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: 'rgba(212,168,67,0.14)',
      borderWidth: 1,
      borderColor: theme.gold,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      alignItems: 'center',
    },
    welcomeIcon: { fontSize: 28 },
    welcomeTitle: {
      color: theme.goldLt,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 2,
    },
    welcomeText: { color: theme.cream, opacity: 0.85, fontSize: 12, lineHeight: 18 },
    startWelcomeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: 'rgba(212,168,67,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(212,168,67,0.5)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 14,
    },
    startWelcomeIcon: { fontSize: 26 },
    startWelcomeTitle: {
      color: theme.goldLt,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 2,
    },
    startWelcomeText: { color: theme.cream, opacity: 0.75, fontSize: 12 },
    startWelcomeArrow: { color: theme.gold, fontSize: 22 },
    tierCard: {
      backgroundColor: theme.glass,
      borderWidth: 1.5,
      borderRadius: 20,
      padding: 20,
      marginBottom: 14,
      position: 'relative',
    },
    tierCardCurrent: {
      borderWidth: 2,
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    tierCardHighlight: {
      borderWidth: 2,
    },
    mostLoved: {
      position: 'absolute',
      top: -10,
      right: 20,
      backgroundColor: theme.gold,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 12,
      zIndex: 1,
    },
    mostLovedText: {
      color: theme.teal,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    tierHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    tierEmoji: { fontSize: 30 },
    tierName: { fontSize: 18, fontWeight: '700' },
    tierTagline: {
      fontSize: 12,
      color: theme.cream,
      opacity: 0.65,
      marginTop: 2,
      fontStyle: 'italic',
    },
    currentPill: {
      backgroundColor: 'rgba(212,168,67,0.2)',
      borderWidth: 1,
      borderColor: theme.gold,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    currentPillText: {
      color: theme.goldLt,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 12,
    },
    priceAmount: { fontSize: 36, fontWeight: '700' },
    pricePeriod: {
      fontSize: 14,
      color: theme.cream,
      opacity: 0.7,
    },
    pricePeriodMuted: {
      fontSize: 12,
      color: theme.cream,
      opacity: 0.5,
      marginLeft: 6,
      fontStyle: 'italic',
    },
    aiRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: 'rgba(212,168,67,0.08)',
      borderRadius: 10,
      padding: 10,
      marginBottom: 12,
    },
    aiIcon: { color: theme.gold, fontSize: 13, marginTop: 1 },
    aiText: { flex: 1, color: theme.cream, fontSize: 13, lineHeight: 18 },
    perks: { gap: 8, marginBottom: 16 },
    perkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    perkCheck: { fontSize: 14, fontWeight: '700', marginTop: 1, minWidth: 14 },
    perkText: {
      flex: 1,
      color: theme.cream,
      fontSize: 13,
      lineHeight: 20,
      opacity: 0.9,
    },
    ctaButton: {
      borderRadius: 30,
      padding: 14,
      alignItems: 'center',
    },
    ctaText: {
      color: theme.teal,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    ctaGhost: {
      borderRadius: 30,
      padding: 14,
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    ctaGhostText: {
      color: theme.cream,
      opacity: 0.55,
      fontSize: 13,
      fontStyle: 'italic',
    },
    error: {
      color: '#ff8080',
      fontSize: 13,
      textAlign: 'center',
      marginVertical: 12,
    },
    footerLegal: {
      fontSize: 10,
      color: theme.cream,
      opacity: 0.45,
      textAlign: 'center',
      lineHeight: 16,
      marginTop: 8,
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    backButton: {
      alignSelf: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    backButtonText: { color: theme.cream, opacity: 0.7, fontSize: 13 },
  });
