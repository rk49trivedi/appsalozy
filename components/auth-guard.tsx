import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { SalozyColors } from '@/constants/colors';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Authentication Guard Component
 * Protects routes that require authentication
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isChecking } = useAuth(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const bgColor = isDark ? '#111827' : '#F9FAFB';

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={[tw`mt-4 text-base`, { color: textSecondary }]}>Checking authentication...</Text>
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    useEffect(() => {
      router.replace('/login');
    }, []);
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

