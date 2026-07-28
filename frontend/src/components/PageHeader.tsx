import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../store/useTheme';
import { Theme } from '../constants/themes';

interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle: string;
}

export const PageHeader = ({ icon, title, subtitle }: PageHeaderProps) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
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
      fontSize: 26,
      fontWeight: '600',
      color: theme.cream,
      flex: 1,
      flexWrap: 'wrap',
    },
    subtitle: {
      fontSize: 13,
      color: 'rgba(245,237,216,0.6)',
      lineHeight: 20,
      paddingLeft: 44,
    },
    divider: {
      width: '100%',
      height: 1,
      backgroundColor: theme.glassBdr,
      marginTop: 16,
    },
  });
