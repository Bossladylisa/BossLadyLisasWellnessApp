import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { PageHeader } from '../src/components/PageHeader';
import { Colors } from '../src/constants/colors';
import { DEFAULT_AFFIRMATIONS } from '../src/constants/data';

export default function QuotesPage() {
  const [quote, setQuote] = useState(DEFAULT_AFFIRMATIONS[0]);

  const random = () => {
    const randomQuote =
      DEFAULT_AFFIRMATIONS[Math.floor(Math.random() * DEFAULT_AFFIRMATIONS.length)];
    setQuote(randomQuote);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <PageHeader
          icon="🦋"
          title="Visual Quote Cards"
          subtitle="Click any affirmation or generate a new card. Each card is a moment of healing energy."
        />

        <View style={styles.quoteCard}>
          <View style={styles.topDivider} />
          <Text style={styles.quoteText}>{quote}</Text>
          <View style={styles.bottomLine} />
          <Text style={styles.attribution}>
            BossLadyLisa℠ · Beautify Yourself & Beyond℠
          </Text>
        </View>

        <TouchableOpacity onPress={random} style={styles.button}>
          <Text style={styles.buttonText}>✦ Generate New Card</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Your Affirmation Library</Text>
        <Text style={styles.sectionSubtitle}>
          Click any affirmation to display it as your quote card
        </Text>

        <View style={styles.affirmationList}>
          {DEFAULT_AFFIRMATIONS.map((a, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setQuote(a)}
              style={[
                styles.affirmationTag,
                quote === a && styles.affirmationTagActive,
              ]}
            >
              <Text
                style={[
                  styles.affirmationText,
                  quote === a && styles.affirmationTextActive,
                ]}
              >
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.teal,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  quoteCard: {
    backgroundColor: Colors.tealMid,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.4)',
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
    marginBottom: 28,
  },
  topDivider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.gold,
  },
  quoteText: {
    fontSize: 26,
    fontStyle: 'italic',
    color: Colors.goldLt,
    lineHeight: 38,
    textAlign: 'center',
  },
  bottomLine: {
    width: 36,
    height: 1,
    backgroundColor: Colors.terra,
    marginTop: 18,
    marginBottom: 10,
  },
  attribution: {
    fontSize: 11,
    color: Colors.terraLt,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  button: {
    backgroundColor: Colors.gold,
    borderRadius: 30,
    padding: 12,
    alignItems: 'center',
    marginBottom: 28,
  },
  buttonText: {
    color: Colors.teal,
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.glassBdr,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.goldLt,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(245,237,216,0.42)',
    marginBottom: 16,
  },
  affirmationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  affirmationTag: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBdr,
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  affirmationTagActive: {
    borderColor: Colors.gold,
  },
  affirmationText: {
    fontSize: 13,
    color: Colors.cream,
  },
  affirmationTextActive: {
    color: Colors.gold,
  },
});
