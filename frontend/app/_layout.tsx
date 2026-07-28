import { Stack } from 'expo-router';
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { Colors } from '../src/constants/colors';

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.teal,
            },
            headerTintColor: Colors.gold,
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 16,
            },
            contentStyle: {
              backgroundColor: Colors.teal,
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="reset" options={{ title: 'Reset Toolkit' }} />
          <Stack.Screen name="journal" options={{ title: 'Grounded Thoughts' }} />
          <Stack.Screen name="notes" options={{ title: '143 Life Notes℠' }} />
          <Stack.Screen name="quotes" options={{ title: 'Visual Quote Cards' }} />
          <Stack.Screen name="planner" options={{ title: 'Boss Mode Planner℠' }} />
          <Stack.Screen name="declutter" options={{ title: 'Declutter Tools' }} />
          <Stack.Screen name="affirmations" options={{ title: 'Daily Affirmations℠' }} />
          <Stack.Screen name="feedback" options={{ title: 'Share Feedback' }} />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
