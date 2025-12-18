import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Redirect to tabs appointments
export default function AppointmentsRedirect() {
  const { isAuthenticated, isChecking } = useAuth(true);

  useEffect(() => {
    if (!isChecking) {
      if (isAuthenticated) {
        router.replace('/(tabs)/appointments');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isChecking]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
