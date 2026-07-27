import { Drawer } from 'expo-router/drawer';
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { Colors } from '../src/constants/colors';


// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots.
  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerStyle: {
            backgroundColor: 'rgba(10,26,22,0.98)',
            width: 240,
          },
          headerStyle: {
            backgroundColor: 'rgba(10,26,22,0.65)',
          },
          headerTintColor: Colors.cream,
          drawerActiveTintColor: Colors.gold,
          drawerInactiveTintColor: 'rgba(245,237,216,0.6)',
          drawerActiveBackgroundColor: 'rgba(196,98,45,0.28)',
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Reset Toolkit',
            title: 'Reset Toolkit',
            drawerIcon: () => <Text style={styles.icon}>🌿</Text>,
          }}
        />
        <Drawer.Screen
          name="journal"
          options={{
            drawerLabel: 'Daily Journal',
            title: 'Grounded Thoughts',
            drawerIcon: () => <Text style={styles.icon}>📓</Text>,
          }}
        />
        <Drawer.Screen
          name="notes"
          options={{
            drawerLabel: '143 Life Notes',
            title: '143 Life Notes℠',
            drawerIcon: () => <Text style={styles.icon}>🧠</Text>,
          }}
        />
        <Drawer.Screen
          name="quotes"
          options={{
            drawerLabel: 'Quote Cards',
            title: 'Visual Quote Cards',
            drawerIcon: () => <Text style={styles.icon}>🦋</Text>,
          }}
        />
        <Drawer.Screen
          name="planner"
          options={{
            drawerLabel: 'Boss Mode Planner',
            title: 'Boss Mode Planner℠',
            drawerIcon: () => <Text style={styles.icon}>📋</Text>,
          }}
        />
        <Drawer.Screen
          name="declutter"
          options={{
            drawerLabel: 'Declutter Tools',
            title: 'Declutter Tools',
            drawerIcon: () => <Text style={styles.icon}>🧹</Text>,
          }}
        />
        <Drawer.Screen
          name="affirmations"
          options={{
            drawerLabel: 'Affirmations',
            title: 'Daily 2:43 Affirmations℠',
            drawerIcon: () => <Text style={styles.icon}>⏰</Text>,
          }}
        />
        <Drawer.Screen
          name="feedback"
          options={{
            drawerLabel: 'Feedback',
            title: 'Share Your Feedback',
            drawerIcon: () => <Text style={styles.icon}>💌</Text>,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 18,
  },
});
