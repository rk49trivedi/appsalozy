import { useSidebar } from '@/components/organisms';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

interface GlobalHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightAction?: ReactNode;
}

export function GlobalHeader({ 
  title, 
  subtitle, 
  showBackButton = false,
  rightAction 
}: GlobalHeaderProps) {
  const { openSidebar } = useSidebar();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';

  return (
    <View style={[tw`px-4 pt-4 pb-2 flex-row justify-between items-center`, { backgroundColor: bgColor }]}>
      <View style={tw`flex-row items-center flex-1`}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              tw`p-2 rounded-xl mr-3`,
              { backgroundColor: isDark ? '#374151' : '#F3F4F6' }
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={tw`text-2xl`}>←</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={openSidebar}
            style={[
              tw`p-2 rounded-xl mr-3`,
              { backgroundColor: isDark ? '#374151' : '#F3F4F6' }
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={tw`text-2xl`}>☰</Text>
          </TouchableOpacity>
        )}
        <View style={tw`flex-1`}>
          {title && (
            <Text style={[tw`text-2xl font-bold`, { color: textPrimary }]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[tw`text-sm mt-1`, { color: textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && (
        <View style={tw`ml-2`}>
          {rightAction}
        </View>
      )}
    </View>
  );
}
