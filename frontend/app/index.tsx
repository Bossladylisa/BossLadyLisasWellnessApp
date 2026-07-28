import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { DecorativeBackground } from '../src/components/DecorativeBackground';
import { ThemePickerModal } from '../src/components/ThemePickerModal';
import { DragonflyIcon } from '../src/components/DragonflyIcon';

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
    icon: '🦋',
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
    id: 'feedback',
    icon: '💌',
    title: 'Share Feedback',
    subtitle: 'Your voice shapes this space',
    color: theme.terraLt,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [themePickerVisible, setThemePickerVisible] = useState(false);

  const features = useMemo(() => getFeatures(theme), [theme]);
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
        {/* Theme picker button - top right */}
        <TouchableOpacity
          testID="theme-picker-button"
          style={styles.themeButton}
          onPress={() => setThemePickerVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.themeButtonIcon}>🎨</Text>
        </TouchableOpacity>

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

          <View style={styles.cardsGrid}>
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                testID={`feature-card-${feature.id}`}
                style={[
                  styles.featureCard,
                  { borderColor: `${feature.color}55` },
                ]}
                onPress={() => router.push(`/${feature.id}` as any)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${feature.color}22` },
                  ]}
                >
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: feature.color }]}>
                    {feature.title}
                  </Text>
                  <Text style={styles.cardSubtitle}>{feature.subtitle}</Text>
                </View>
                <Text style={[styles.arrow, { color: feature.color }]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
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
      marginBottom: 2,
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
