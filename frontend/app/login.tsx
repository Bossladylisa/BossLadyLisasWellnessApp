import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/store/useTheme';
import { Theme } from '../src/constants/themes';
import { useAuthStore } from '../src/store/useAuth';
import { DragonflyIcon } from '../src/components/DragonflyIcon';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const user = useAuthStore((s) => s.user);
  const processSessionToken = useAuthStore((s) => s.processSessionToken);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      router.replace('/' as any);
    }
  }, [user]);

  // On web, process session_id from URL hash on mount
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    const processWebSession = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      let sessionId = '';
      if (hash.includes('session_id=')) {
        sessionId = hash.split('session_id=')[1].split('&')[0];
      } else if (search.includes('session_id=')) {
        sessionId = new URLSearchParams(search).get('session_id') || '';
      }

      if (sessionId) {
        setBusy(true);
        const user = await processSessionToken(sessionId);
        window.history.replaceState(null, '', window.location.pathname);
        if (user) {
          router.replace('/' as any);
        } else {
          setError('Authentication failed. Please try again.');
        }
        setBusy(false);
      }
    };

    processWebSession();
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    setBusy(true);

    try {
      const redirectUrl =
        Platform.OS === 'web'
          ? window.location.origin + '/login'
          : Linking.createURL('login');

      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(
        redirectUrl
      )}`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
        return;
      }

      // Mobile flow
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type !== 'success' || !result.url) {
        setBusy(false);
        return;
      }

      // Parse session_id from redirect URL
      const url = result.url;
      let sessionId = '';
      if (url.includes('#session_id=')) {
        sessionId = url.split('#session_id=')[1].split('&')[0];
      } else if (url.includes('?session_id=')) {
        sessionId = url.split('?session_id=')[1].split('&')[0];
      }

      if (!sessionId) {
        setError('No session token received');
        setBusy(false);
        return;
      }

      const user = await processSessionToken(sessionId);
      if (user) {
        router.replace('/' as any);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (e: any) {
      console.error('Login error:', e);
      setError('Login failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.dragonflyContainer}>
              <DragonflyIcon size={64} color={theme.goldLt} opacity={0.95} />
            </View>

            <Text style={styles.brandText}>BossLadyLisa's℠</Text>
            <Text style={styles.titleLine1}>BEAUTIFY</Text>
            <Text style={styles.titleLine2}>Yourself</Text>
            <Text style={styles.titleLine3}>AND BEYOND</Text>

            <View style={styles.divider} />

            <Text style={styles.welcomeText}>Welcome to your sanctuary.</Text>
            <Text style={styles.subText}>
              Sign in to begin your journey of inner beauty and transformation.
            </Text>

            <TouchableOpacity
              testID="google-login-button"
              onPress={handleGoogleLogin}
              disabled={busy}
              style={[styles.googleButton, busy && { opacity: 0.6 }]}
              activeOpacity={0.8}
            >
              {busy ? (
                <ActivityIndicator color={theme.teal} />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.disclaimer}>
              By continuing, you agree that this app is a wellness companion —{' '}
              not a substitute for licensed medical care.
            </Text>

            <Text style={styles.footer}>
              "We'll keep the light on for you."
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
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
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBdr,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
    },
    dragonflyContainer: {
      marginBottom: 20,
    },
    brandText: {
      fontSize: 11,
      letterSpacing: 3,
      color: theme.terraLt,
      textTransform: 'uppercase',
      marginBottom: 8,
      fontWeight: '600',
    },
    titleLine1: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.gold,
      letterSpacing: 3,
      fontStyle: 'italic',
    },
    titleLine2: {
      fontSize: 42,
      fontWeight: '400',
      color: theme.goldLt,
      fontStyle: 'italic',
      marginVertical: -6,
    },
    titleLine3: {
      fontSize: 14,
      letterSpacing: 5,
      color: theme.cream,
      marginTop: 4,
    },
    divider: {
      width: 60,
      height: 2,
      backgroundColor: theme.terra,
      marginVertical: 20,
    },
    welcomeText: {
      fontSize: 18,
      color: theme.goldLt,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 12,
    },
    subText: {
      fontSize: 13,
      color: theme.cream,
      opacity: 0.75,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 28,
      paddingHorizontal: 8,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: theme.gold,
      borderRadius: 30,
      paddingVertical: 14,
      paddingHorizontal: 32,
      width: '100%',
      minHeight: 50,
    },
    googleIcon: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.teal,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    googleButtonText: {
      color: theme.teal,
      fontSize: 15,
      fontWeight: '700',
    },
    error: {
      color: '#ff8080',
      fontSize: 13,
      marginTop: 16,
      textAlign: 'center',
    },
    disclaimer: {
      fontSize: 11,
      color: theme.cream,
      opacity: 0.5,
      textAlign: 'center',
      marginTop: 24,
      lineHeight: 16,
    },
    footer: {
      fontSize: 12,
      color: theme.goldLt,
      fontStyle: 'italic',
      marginTop: 20,
      opacity: 0.7,
    },
  });
