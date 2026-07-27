import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle: string;
}

export const PageHeader = ({ icon, title, subtitle }: PageHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: Colors.cream,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(245,237,216,0.5)',
    lineHeight: 20,
    paddingLeft: 44,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.glassBdr,
    marginTop: 16,
  },
});
