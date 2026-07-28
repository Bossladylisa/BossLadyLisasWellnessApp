import React from 'react';
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
import { Colors } from '../src/constants/colors';

const FEATURES = [
  {
    id: 'reset',
    icon: '🌿',
    title: 'Reset Toolkit',
    subtitle: 'Somatic mood reset with AI guidance',
    color: '#E8835A',
    gradient: ['#8B3A1A', '#E8835A'],
  },
  {
    id: 'journal',
    icon: '📓',
    title: 'Daily Journal',
    subtitle: 'Grounded thoughts & reflections',
    color: '#D4A843',
    gradient: ['#8B7614', '#D4A843'],
  },
  {
    id: 'notes',
    icon: '🧠',
    title: '143 Life Notes℠',
    subtitle: 'Wisdom you gather along the way',
    color: '#F0C96A',
    gradient: ['#8B7614', '#F0C96A'],
  },
  {
    id: 'quotes',
    icon: '🦋',
    title: 'Quote Cards',
    subtitle: 'Beautiful visual affirmations',
    color: '#A8A0C8',
    gradient: ['#5C4E8C', '#A8A0C8'],
  },
  {
    id: 'planner',
    icon: '📋',
    title: 'Boss Mode Planner℠',
    subtitle: 'Task management with intention',
    color: '#C4622D',
    gradient: ['#8B3A1A', '#C4622D'],
  },
  {
    id: 'declutter',
    icon: '🧹',
    title: 'Declutter Tools',
    subtitle: 'Clear space + meditation timer',
    color: '#DDB892',
    gradient: ['#8B6F47', '#DDB892'],
  },
  {
    id: 'affirmations',
    icon: '⏰',
    title: 'Daily Affirmations',
    subtitle: '2:43 PM sacred reminders',
    color: '#F0C96A',
    gradient: ['#8B7614', '#F0C96A'],
  },
  {
    id: 'feedback',
    icon: '💌',
    title: 'Share Feedback',
    subtitle: 'Your voice shapes this space',
    color: '#E8835A',
    gradient: ['#8B3A1A', '#E8835A'],
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container} testID="home-screen">
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandText}>BossLadyLisa's℠</Text>
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
            <Text style={styles.dragonflyIcon}>🦋</Text>
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
            {FEATURES.map((feature) => (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.teal,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  brandText: {
    fontSize: 11,
    letterSpacing: 3,
    color: Colors.terraLt,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontWeight: '600',
  },
  titleLine1: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 4,
    fontStyle: 'italic',
  },
  titleLine2: {
    fontSize: 48,
    fontWeight: '400',
    color: Colors.goldLt,
    fontStyle: 'italic',
    marginVertical: -8,
  },
  titleLine3: {
    fontSize: 16,
    letterSpacing: 6,
    color: Colors.cream,
    marginTop: 4,
  },
  dividerLine: {
    width: 60,
    height: 2,
    backgroundColor: Colors.terra,
    marginVertical: 16,
  },
  tagline: {
    fontSize: 14,
    color: Colors.cream,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(245,237,216,0.5)',
    marginTop: 4,
  },
  quoteCard: {
    backgroundColor: 'rgba(196,98,45,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.3)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  dragonflyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: Colors.goldLt,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  quoteAttribution: {
    fontSize: 11,
    color: Colors.terraLt,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 20,
    color: Colors.goldLt,
    marginBottom: 16,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  cardsGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: Colors.glass,
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
    color: 'rgba(245,237,216,0.55)',
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
    borderTopColor: Colors.glassBdr,
  },
  footerQuote: {
    fontSize: 13,
    color: 'rgba(245,237,216,0.4)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 10,
    color: 'rgba(245,237,216,0.25)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
