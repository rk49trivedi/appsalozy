import { Card, Text } from '@/components/atoms';
import { getThemeColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const { isAuthenticated, isChecking, user } = useAuth();

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  if (isChecking) {
    return (
      <SafeAreaView
        style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={tw`mt-4`} variant="secondary">
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const displayName = user?.name || 'Your profile';
  const displayEmail = user?.email || 'Not set';

  return (
    <SafeAreaView
      style={[tw`flex-1`, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Simple header */}
      <View style={tw`px-4 pt-4 pb-2`}>
        <Text size="2xl" weight="bold" variant="primary">
          Profile
        </Text>
        <Text size="sm" style={tw`mt-1`} variant="secondary">
          Update your account details
        </Text>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 pb-6 gap-4`}>
        <Card style={tw`p-5 rounded-2xl`}>
          <View style={tw`flex-row items-center`}>
            <View
              style={[
                tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
                { backgroundColor: colors.secondaryBg },
              ]}
            >
              <Text size="lg" weight="bold" variant="primary">
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={tw`flex-1`}>
              <Text size="lg" weight="bold" variant="primary">
                {displayName}
              </Text>
              <Text size="sm" variant="secondary">
                {displayEmail}
              </Text>
            </View>
          </View>
        </Card>

        {/* Placeholder section for future editable fields */}
        <Card style={tw`p-5 rounded-2xl`}>
          <Text size="sm" weight="semibold" variant="secondary" style={tw`mb-3`}>
            Account
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            style={tw`flex-row justify-between items-center py-2`}
          >
            <Text variant="primary">Manage profile details</Text>
            <Text variant="secondary">{'>'}</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}


