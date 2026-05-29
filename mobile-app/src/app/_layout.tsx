import '../global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    const setupNavBar = async () => {
      if (Platform.OS !== 'android') return;

      try {
        await NavigationBar.setVisibilityAsync('hidden');
      } catch (e) {
        console.log('NavigationBar error:', e);
      }
    };

    setupNavBar();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar style="light" />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="screens/voice"
          options={{ presentation: 'modal' }}
        />

        <Stack.Screen
          name="screens/loan"
          options={{ presentation: 'card' }}
        />

        <Stack.Screen
          name="screens/loan-result"
          options={{ presentation: 'card' }}
        />

        <Stack.Screen
          name="screens/borrow"
          options={{ presentation: 'card' }}
        />

        <Stack.Screen
          name="screens/borrow-result"
          options={{ presentation: 'card' }}
        />

        <Stack.Screen
          name="screens/scam"
          options={{ presentation: 'card' }}
        />

          <Stack.Screen
            name="screens/rtc"
            options={{ presentation: 'card' }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
