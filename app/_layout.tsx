import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { GlobalSidebarProvider } from '@/components/global-sidebar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toastConfig } from '@/lib/toast-config';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    try {
      const parsed = Linking.parse(url);
      
      // Handle email verification deep link
      // Format: salozy://auth/verify-email/{token}?email={email}
      if (parsed.path && parsed.path.includes('auth/verify-email')) {
        // Extract token from path (last segment after verify-email/)
        const pathParts = parsed.path.split('/');
        const verifyIndex = pathParts.indexOf('verify-email');
        const token = verifyIndex >= 0 && pathParts.length > verifyIndex + 1 
          ? pathParts[verifyIndex + 1] 
          : null;
        
        const email = parsed.queryParams?.email as string;

        if (token && email) {
          // Navigate to verification screen
          router.push({
            pathname: '/auth/verify-email',
            params: {
              token: token,
              email: email,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GlobalSidebarProvider>
      <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register-vendor" options={{ headerShown: false }} />
          <Stack.Screen name="auth/verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="appointments" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
        <Toast config={toastConfig} />
      </GlobalSidebarProvider>
    </ThemeProvider>
  );
}
