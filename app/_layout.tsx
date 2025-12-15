import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { GlobalSidebarProvider, OnboardingScreen, SplashScreen } from '@/components/organisms';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toastConfig } from '@/lib/toast-config';

const ONBOARDING_COMPLETED_KEY = '@salozy:onboarding_completed';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    // Check if onboarding has been completed
    const checkOnboardingStatus = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        if (onboardingCompleted === 'true') {
          // Onboarding already completed, skip it
          setShowOnboarding(false);
        } else {
          // Onboarding not completed, will show after splash
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, show onboarding to be safe
        setShowOnboarding(true);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();

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
      console.log('Handling deep link:', url);
      const parsed = Linking.parse(url);
      console.log('Parsed deep link:', parsed);
      
      // Handle email verification deep link
      // Format: salozy://auth/verify-email?token={token}&email={email}
      // or fallback: salozy://auth/verify-email/{token}?email={email}
      const isVerifyEmail = parsed.path?.includes('verify-email') || parsed.hostname === 'auth' && parsed.path?.includes('verify-email');
      
      // Handle password reset deep link
      // Format: salozy://auth/reset-password?token={token}&email={email}
      const isResetPassword = parsed.path?.includes('reset-password') || parsed.hostname === 'auth' && parsed.path?.includes('reset-password');
      
      if (isVerifyEmail) {
        let token: string | null = null;
        let email: string | null = null;
        
        // Prefer query parameters (more reliable for long tokens)
        if (parsed.queryParams) {
          token = parsed.queryParams.token as string | null;
          email = parsed.queryParams.email as string | null;
        }
        
        // Fallback: Extract from path if not in query params (for backward compatibility)
        if (!token || !email) {
          // Handle different path formats
          const fullPath = parsed.path || '';
          const pathParts = fullPath.split('/').filter(p => p.length > 0);
          const verifyIndex = pathParts.findIndex(p => p === 'verify-email' || p.includes('verify-email'));
          
          if (verifyIndex >= 0) {
            // Get token from path (everything after verify-email)
            if (!token && pathParts.length > verifyIndex + 1) {
              // Join all remaining parts in case token was split
              const remainingPath = pathParts.slice(verifyIndex + 1).join('/');
              token = decodeURIComponent(remainingPath);
            }
          } else if (fullPath.includes('verify-email')) {
            // Handle case where verify-email is in the path but not as a separate segment
            const match = fullPath.match(/verify-email[\/]?([^?]*)/);
            if (match && match[1]) {
              token = decodeURIComponent(match[1].replace(/^\//, ''));
            }
          }
          
          // Get email from query params if not already set
          if (!email && parsed.queryParams?.email) {
            email = parsed.queryParams.email as string;
          }
        }

        // Clean up token (remove any trailing slashes or query params)
        if (token) {
          token = token.split('?')[0].split('&')[0].trim();
        }

        if (token && email) {
          // Decode both values to handle URL encoding
          const decodedToken = decodeURIComponent(token);
          const decodedEmail = decodeURIComponent(email);
          
          console.log('Navigating to verify-email with:', { 
            tokenLength: decodedToken.length, 
            email: decodedEmail 
          });
          
          // Navigate to verification screen
          router.push({
            pathname: '/auth/verify-email',
            params: {
              token: decodedToken,
              email: decodedEmail,
            },
          });
        } else {
          console.error('Missing token or email in deep link:', { 
            hasToken: !!token, 
            hasEmail: !!email, 
            url,
            parsed 
          });
        }
      } else if (isResetPassword) {
        // Handle password reset deep link
        let token: string | null = null;
        let email: string | null = null;
        
        // Prefer query parameters (more reliable for long tokens)
        if (parsed.queryParams) {
          token = parsed.queryParams.token as string | null;
          email = parsed.queryParams.email as string | null;
        }
        
        // Fallback: Extract from path if not in query params (for backward compatibility)
        if (!token || !email) {
          // Handle different path formats
          const fullPath = parsed.path || '';
          const pathParts = fullPath.split('/').filter(p => p.length > 0);
          const resetIndex = pathParts.findIndex(p => p === 'reset-password' || p.includes('reset-password'));
          
          if (resetIndex >= 0) {
            // Get token from path (everything after reset-password)
            if (!token && pathParts.length > resetIndex + 1) {
              // Join all remaining parts in case token was split
              const remainingPath = pathParts.slice(resetIndex + 1).join('/');
              token = decodeURIComponent(remainingPath);
            }
          } else if (fullPath.includes('reset-password')) {
            // Handle case where reset-password is in the path but not as a separate segment
            const match = fullPath.match(/reset-password[\/]?([^?]*)/);
            if (match && match[1]) {
              token = decodeURIComponent(match[1].replace(/^\//, ''));
            }
          }
          
          // Get email from query params if not already set
          if (!email && parsed.queryParams?.email) {
            email = parsed.queryParams.email as string;
          }
        }

        // Clean up token (remove any trailing slashes or query params)
        if (token) {
          token = token.split('?')[0].split('&')[0].trim();
        }

        if (token && email) {
          // Decode both values to handle URL encoding
          const decodedToken = decodeURIComponent(token);
          const decodedEmail = decodeURIComponent(email);
          
          console.log('Navigating to reset-password with:', { 
            tokenLength: decodedToken.length, 
            email: decodedEmail 
          });
          
          // Navigate to reset password screen
          router.push({
            pathname: '/auth/reset-password',
            params: {
              token: decodedToken,
              email: decodedEmail,
            },
          });
        } else {
          console.error('Missing token or email in reset password deep link:', { 
            hasToken: !!token, 
            hasEmail: !!email, 
            url,
            parsed 
          });
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error, url);
    }
  };

  const handleOnboardingFinish = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Even if save fails, hide onboarding
      setShowOnboarding(false);
    }
  };

  // Show loading while checking onboarding status
  if (isCheckingOnboarding) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
          <ActivityIndicator size="large" color="#d5821d" />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GlobalSidebarProvider>
        {showSplash ? (
          <View style={{ flex: 1 }}>
            <SplashScreen onFinish={() => {
              setShowSplash(false);
              // Onboarding will be shown if not completed
            }} />
          </View>
        ) : showOnboarding ? (
          <View style={{ flex: 1 }}>
            <OnboardingScreen onFinish={handleOnboardingFinish} />
          </View>
        ) : (
          <>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register-vendor" options={{ headerShown: false }} />
              <Stack.Screen name="auth/verify-email" options={{ headerShown: false }} />
              <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
              <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
            <Toast config={toastConfig} />
          </>
        )}
      </GlobalSidebarProvider>
    </ThemeProvider>
  );
}
