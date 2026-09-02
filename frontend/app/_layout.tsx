import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { useTheme, useThemeStore } from '../src/store/useTheme';
import { useAuthStore } from '../src/store/useAuth';

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const theme = useTheme();
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const loadSession = useAuthStore((s) => s.loadSession);
  const authLoading = useAuthStore((s) => s.loading);

  useEffect(() => {
    loadTheme();
    loadSession();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {authLoading ? (
          <View
            style={{
              flex: 1,
              backgroundColor: theme.teal,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={theme.gold} />
          </View>
        ) : (
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.teal },
              headerTintColor: theme.gold,
              headerTitleStyle: { fontWeight: '600', fontSize: 16 },
              contentStyle: { backgroundColor: theme.teal },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="reset" options={{ title: 'Reset Toolkit' }} />
            <Stack.Screen name="journal" options={{ title: 'Grounded Thoughts' }} />
            <Stack.Screen name="notes" options={{ title: '143 Life Notes' }} />
            <Stack.Screen name="quotes" options={{ title: 'Visual Quote Cards' }} />
            <Stack.Screen name="planner" options={{ title: 'Boss Mode Planner' }} />
            <Stack.Screen name="declutter" options={{ title: 'Declutter Tools' }} />
            <Stack.Screen name="affirmations" options={{ title: 'Daily Affirmations' }} />
            <Stack.Screen name="feedback" options={{ title: 'Share Feedback' }} />
            <Stack.Screen name="support" options={{ title: 'Wellness Support' }} />
            <Stack.Screen name="admin" options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="upgrade" options={{ title: 'Upgrade to Premium' }} />
            <Stack.Screen name="rhythm" options={{ title: 'Sacred Rhythm' }} />
          </Stack>
        )}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
