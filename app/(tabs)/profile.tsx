import { Text } from '@/components/atoms';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

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
      style={[tw`flex-1`, { backgroundColor: bgColor }]}
      edges={['top']}
    >
      {/* Global Header */}
      <GlobalHeader
        title="Profile"
        subtitle="Update your account details"
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 pb-6 gap-3`}>
        <View style={[
          tw`rounded-2xl p-5`,
          { backgroundColor: cardBg, borderWidth: 1, borderColor }
        ]}>
          <View style={tw`flex-row items-center`}>
            <View
              style={[
                tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
                { backgroundColor: colors.secondaryBg },
              ]}
            >
              <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                {displayName}
              </Text>
              <Text style={[tw`text-sm`, { color: textSecondary }]}>
                {displayEmail}
              </Text>
            </View>
          </View>
        </View>

        {/* Placeholder section for future editable fields */}
        <View style={[
          tw`rounded-2xl p-5`,
          { backgroundColor: cardBg, borderWidth: 1, borderColor }
        ]}>
          <Text style={[tw`text-sm font-semibold mb-3`, { color: textSecondary }]}>
            Account
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            style={tw`flex-row justify-between items-center py-2`}
          >
            <Text style={{ color: textPrimary }}>Manage profile details</Text>
            <Text style={{ color: textSecondary }}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


