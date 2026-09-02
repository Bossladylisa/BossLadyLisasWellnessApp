import React, { useState, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { useAuthStore } from '../src/store/useAuth';
import { api } from '../src/services/api';
import { DragonflyIcon } from '../src/components/DragonflyIcon';

const PREMIUM_FEATURES = [
  { icon: '🌿', title: 'AI Reset Toolkit', desc: 'Personalized somatic guidance powered by Claude' },
  { icon: '⏱️', title: 'Sacred Rhythm', desc: 'Time-structure reminders & focus sessions' },
  { icon: '📋', title: 'Boss Mode Planner℠', desc: 'Task management with priority levels' },
  { icon: '🧹', title: 'Declutter Tools', desc: 'Checklist + meditation timer' },
  { icon: '⏰', title: 'Daily Affirmations', desc: 'Streak tracking + custom library' },
  { icon: '🎨', title: 'All 4 Themes', desc: 'Sunset, Ocean, Forest, Midnight' },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user, refreshUser } = useAuthStore();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isPremium = user?.subscription_tier === 'premium';

  const handleUpgrade = async () => {
    setError('');
    setBusy(true);

    try {
      const returnTo =
        Platform.OS === 'web'
          ? window.location.origin + '/'
          : Linking.createURL('');

      const data = await api.createCheckout(returnTo);

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
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <DragonflyIcon size={64} color={theme.goldLt} opacity={0.95} />
          <Text style={styles.title}>Sacred Sanctuary</Text>
          <Text style={styles.subtitle}>
            Unlock the full power of your inner beautification journey
          </Text>
        </View>

        {isPremium ? (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeIcon}>✨</Text>
            <Text style={styles.premiumBadgeText}>You're a Premium member!</Text>
            <Text style={styles.premiumBadgeSub}>
              Thank you for supporting BossLadyLisa's mission. Enjoy all features.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Sacred Sanctuary</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>$4.99</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
              <Text style={styles.priceSubtext}>Cancel anytime</Text>
            </View>

            <Text style={styles.sectionTitle}>What's Included</Text>

            <View style={styles.features}>
              {PREMIUM_FEATURES.map((f) => (
                <View key={f.title} style={styles.feature}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              testID="upgrade-button"
              onPress={handleUpgrade}
              disabled={busy}
              style={[styles.upgradeButton, busy && { opacity: 0.6 }]}
              activeOpacity={0.8}
            >
              {busy ? (
                <ActivityIndicator color={theme.teal} />
              ) : (
                <Text style={styles.upgradeButtonText}>
                  ✨ Begin Sacred Sanctuary · $4.99/mo
                </Text>
              )}
            </TouchableOpacity>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.disclaimer}>
              Payment is processed securely by Stripe. You can cancel anytime from
              your account settings. This subscription auto-renews monthly.
            </Text>
          </>
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back to Sanctuary</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

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
    hero: {
      alignItems: 'center',
      marginBottom: 24,
      paddingVertical: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.goldLt,
      marginTop: 12,
      fontStyle: 'italic',
    },
    subtitle: {
      fontSize: 14,
      color: theme.cream,
      opacity: 0.75,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 22,
      paddingHorizontal: 12,
    },
    priceCard: {
      backgroundColor: 'rgba(232,184,77,0.15)',
      borderWidth: 2,
      borderColor: theme.gold,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
    },
    priceLabel: {
      fontSize: 12,
      color: theme.terraLt,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 10,
      fontWeight: '700',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    priceAmount: {
      fontSize: 48,
      fontWeight: '700',
      color: theme.goldLt,
    },
    pricePeriod: {
      fontSize: 18,
      color: theme.cream,
      opacity: 0.7,
    },
    priceSubtext: {
      fontSize: 11,
      color: theme.cream,
      opacity: 0.5,
      marginTop: 6,
    },
    sectionTitle: {
      fontSize: 16,
      color: theme.goldLt,
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
    },
    features: {
      gap: 10,
      marginBottom: 24,
    },
    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 14,
      padding: 14,
    },
    featureIcon: {
      fontSize: 24,
    },
    featureTitle: {
      fontSize: 14,
      color: theme.goldLt,
      fontWeight: '600',
      marginBottom: 2,
    },
    featureDesc: {
      fontSize: 12,
      color: theme.cream,
      opacity: 0.7,
    },
    checkmark: {
      color: theme.gold,
      fontSize: 20,
      fontWeight: '700',
    },
    upgradeButton: {
      backgroundColor: theme.gold,
      borderRadius: 30,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    upgradeButtonText: {
      color: theme.teal,
      fontSize: 15,
      fontWeight: '700',
    },
    error: {
      color: '#ff8080',
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 12,
    },
    disclaimer: {
      fontSize: 11,
      color: theme.cream,
      opacity: 0.5,
      textAlign: 'center',
      lineHeight: 16,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    premiumBadge: {
      backgroundColor: 'rgba(232,184,77,0.15)',
      borderWidth: 2,
      borderColor: theme.gold,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      marginVertical: 20,
    },
    premiumBadgeIcon: {
      fontSize: 42,
      marginBottom: 12,
    },
    premiumBadgeText: {
      fontSize: 22,
      color: theme.goldLt,
      fontWeight: '700',
      marginBottom: 8,
    },
    premiumBadgeSub: {
      fontSize: 13,
      color: theme.cream,
      opacity: 0.7,
      textAlign: 'center',
      lineHeight: 20,
    },
    backButton: {
      alignSelf: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    backButtonText: {
      color: theme.cream,
      opacity: 0.7,
      fontSize: 13,
    },
  });
