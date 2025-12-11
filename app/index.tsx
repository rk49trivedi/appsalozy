import { SalozyColors } from '@/constants/colors';
import { apiClient } from '@/lib/api/client';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import tw from 'twrnc';
import LoginScreen from './login';

/**
 * Root index route
 * Checks authentication and redirects accordingly
 * Re-checks when route is focused (e.g., after logout)
 */
export default function Index() {
  const [isChecking, setIsChecking] = useState(true);

  const checkAuthAndRedirect = useCallback(async () => {
    try {
      setIsChecking(true);
      const token = await apiClient.getStoredToken();
      if (token) {
        // Verify token is valid
        try {
          await apiClient.getProfile();
          // User is logged in, redirect to dashboard
          router.replace('/(tabs)');
          return;
        } catch {
          // Token invalid, clear it
          await apiClient.logout();
        }
      }
      // User is not logged in, show login screen
      setIsChecking(false);
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, show login screen
      setIsChecking(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuthAndRedirect();
  }, [checkAuthAndRedirect]);

  // Re-check auth when route is focused (e.g., after logout navigation)
  useFocusEffect(
    useCallback(() => {
      checkAuthAndRedirect();
    }, [checkAuthAndRedirect])
  );

  // Show loading while checking
  if (isChecking) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white`}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
      </View>
    );
  }

  return <LoginScreen />;
}

