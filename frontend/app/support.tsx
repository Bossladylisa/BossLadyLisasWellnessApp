import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { PageHeader } from '../src/components/PageHeader';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { DragonflyIcon } from '../src/components/DragonflyIcon';

interface Resource {
  id: string;
  name: string;
  description: string;
  action: string;
  phone?: string;
  text?: string;
  url?: string;
  emoji: string;
  urgent?: boolean;
}

const CRISIS_RESOURCES: Resource[] = [
  {
    id: 'lifeline',
    name: '988 Suicide & Crisis Lifeline',
    description: 'Free, confidential, 24/7 support for anyone in emotional distress.',
    action: 'Call or Text 988',
    phone: '988',
    emoji: '🆘',
    urgent: true,
  },
  {
    id: 'crisistext',
    name: 'Crisis Text Line',
    description: 'Text-based support with a trained crisis counselor.',
    action: 'Text HOME to 741741',
    text: '741741',
    emoji: '💬',
    urgent: true,
  },
  {
    id: 'samhsa',
    name: 'SAMHSA National Helpline',
    description: 'Treatment referral for mental health & substance use — 24/7.',
    action: 'Call 1-800-662-4357',
    phone: '18006624357',
    emoji: '🌿',
  },
  {
    id: 'trevor',
    name: 'The Trevor Project',
    description: 'Crisis support for LGBTQ+ youth. 24/7 support.',
    action: 'Call 1-866-488-7386',
    phone: '18664887386',
    emoji: '🌈',
  },
  {
    id: 'veterans',
    name: 'Veterans Crisis Line',
    description: 'For veterans, service members, and their families.',
    action: 'Call 988, Press 1',
    phone: '988',
    emoji: '🎖️',
  },
  {
    id: 'domestic',
    name: 'National Domestic Violence Hotline',
    description: 'Confidential support for anyone affected by relationship abuse.',
    action: 'Call 1-800-799-7233',
    phone: '18007997233',
    emoji: '🕊️',
  },
];

export default function SupportPage() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleText = (number?: string) => {
    if (!number) return;
    const url = Platform.OS === 'ios' ? `sms:${number}` : `sms:${number}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          icon="🤍"
          title="You Are Not Alone"
          subtitle="Support is available. Help is one call, text, or message away."
        />

        {/* Beautiful "You are not alone" affirmation card */}
        <View style={styles.affirmationCard}>
          <View style={styles.dragonflyContainer}>
            <DragonflyIcon size={44} color={theme.goldLt} opacity={0.95} />
          </View>
          <Text style={styles.affirmationText}>
            "You are not in this alone."
          </Text>
          <Text style={styles.affirmationSub}>
            Your feelings are valid. Your life matters.{'\n'}
            Reaching out is an act of courage — and strength.
          </Text>
        </View>

        {/* Important Disclaimer */}
        <View style={styles.disclaimerCard} testID="wellness-disclaimer">
          <View style={styles.disclaimerHeader}>
            <Text style={styles.disclaimerIcon}>⚠️</Text>
            <Text style={styles.disclaimerTitle}>Important Notice</Text>
          </View>
          <Text style={styles.disclaimerText}>
            This app is a{' '}
            <Text style={styles.disclaimerBold}>
              wellness companion — not a substitute
            </Text>{' '}
            for professional medical, psychological, or psychiatric care.
          </Text>
          <Text style={styles.disclaimerText}>
            The tools, reflections, and AI-generated content offered here are for
            informational and self-care purposes only. They do{' '}
            <Text style={styles.disclaimerBold}>
              not replace the advice, diagnosis, or treatment
            </Text>{' '}
            of a licensed mental health professional or medical provider.
          </Text>
          <Text style={styles.disclaimerText}>
            If you are experiencing a crisis, please reach out to one of the
            resources below or your local emergency services immediately.
          </Text>
        </View>

        {/* Urgent Crisis Resources */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>🆘</Text>
          <Text style={styles.sectionTitle}>Immediate Crisis Support</Text>
        </View>

        {CRISIS_RESOURCES.filter((r) => r.urgent).map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            theme={theme}
            styles={styles}
            onCall={handleCall}
            onText={handleText}
          />
        ))}

        {/* Additional Support Resources */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>🌿</Text>
          <Text style={styles.sectionTitle}>Additional Support</Text>
        </View>

        {CRISIS_RESOURCES.filter((r) => !r.urgent).map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            theme={theme}
            styles={styles}
            onCall={handleCall}
            onText={handleText}
          />
        ))}

        {/* International note */}
        <View style={styles.internationalCard}>
          <Text style={styles.internationalTitle}>🌍 International Support</Text>
          <Text style={styles.internationalText}>
            If you are outside the United States, please visit{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://findahelpline.com')}
            >
              findahelpline.com
            </Text>{' '}
            for a directory of crisis lines and support resources in your country.
          </Text>
        </View>

        {/* Closing message */}
        <View style={styles.closingCard}>
          <Text style={styles.closingText}>
            "We'll keep the light on for you."
          </Text>
          <Text style={styles.closingSub}>
            You are worthy of care. You are worthy of support.{'\n'}
            You are worthy of healing — at your own pace.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const ResourceCard = ({
  resource,
  theme,
  styles,
  onCall,
  onText,
}: {
  resource: Resource;
  theme: Theme;
  styles: any;
  onCall: (phone?: string) => void;
  onText: (number?: string) => void;
}) => {
  const handlePress = () => {
    if (resource.text) {
      onText(resource.text);
    } else if (resource.phone) {
      onCall(resource.phone);
    } else if (resource.url) {
      Linking.openURL(resource.url);
    }
  };

  return (
    <TouchableOpacity
      testID={`resource-${resource.id}`}
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.resourceCard,
        resource.urgent && styles.resourceCardUrgent,
      ]}
    >
      <View style={styles.resourceHeader}>
        <Text style={styles.resourceEmoji}>{resource.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.resourceName}>{resource.name}</Text>
          <Text style={styles.resourceDesc}>{resource.description}</Text>
        </View>
      </View>
      <View
        style={[
          styles.actionButton,
          resource.urgent && { backgroundColor: theme.terra },
        ]}
      >
        <Text
          style={[
            styles.actionButtonText,
            resource.urgent && { color: '#fff' },
          ]}
        >
          {resource.action} →
        </Text>
      </View>
    </TouchableOpacity>
  );
};

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
    affirmationCard: {
      backgroundColor: 'rgba(232,184,77,0.12)',
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      marginBottom: 20,
    },
    dragonflyContainer: {
      marginBottom: 12,
    },
    affirmationText: {
      fontSize: 22,
      fontStyle: 'italic',
      color: theme.goldLt,
      textAlign: 'center',
      marginBottom: 12,
      lineHeight: 30,
    },
    affirmationSub: {
      fontSize: 13,
      color: theme.cream,
      textAlign: 'center',
      lineHeight: 20,
      opacity: 0.85,
    },
    disclaimerCard: {
      backgroundColor: 'rgba(217,117,69,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(217,117,69,0.35)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    disclaimerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    disclaimerIcon: {
      fontSize: 22,
    },
    disclaimerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.terraLt,
      letterSpacing: 0.5,
    },
    disclaimerText: {
      fontSize: 13,
      color: theme.cream,
      lineHeight: 20,
      marginBottom: 10,
      opacity: 0.85,
    },
    disclaimerBold: {
      fontWeight: '700',
      color: theme.goldLt,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
      marginTop: 8,
    },
    sectionEmoji: {
      fontSize: 22,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.goldLt,
    },
    resourceCard: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    },
    resourceCardUrgent: {
      borderColor: 'rgba(217,117,69,0.5)',
      borderWidth: 1.5,
    },
    resourceHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 12,
    },
    resourceEmoji: {
      fontSize: 26,
    },
    resourceName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.goldLt,
      marginBottom: 4,
    },
    resourceDesc: {
      fontSize: 12,
      color: theme.cream,
      lineHeight: 17,
      opacity: 0.75,
    },
    actionButton: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignSelf: 'flex-start',
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.goldLt,
      letterSpacing: 0.3,
    },
    internationalCard: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 14,
      padding: 18,
      marginTop: 8,
      marginBottom: 24,
    },
    internationalTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.goldLt,
      marginBottom: 8,
    },
    internationalText: {
      fontSize: 13,
      color: theme.cream,
      lineHeight: 20,
      opacity: 0.85,
    },
    link: {
      color: theme.terraLt,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    closingCard: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    closingText: {
      fontSize: 18,
      fontStyle: 'italic',
      color: theme.goldLt,
      textAlign: 'center',
      marginBottom: 12,
    },
    closingSub: {
      fontSize: 12,
      color: theme.cream,
      textAlign: 'center',
      lineHeight: 20,
      opacity: 0.7,
    },
  });
