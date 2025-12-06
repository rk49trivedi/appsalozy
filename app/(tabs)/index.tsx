import { View, Text } from 'react-native';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={tw`flex-1 items-center justify-center px-6`}>
      <Text style={[
        tw`text-2xl font-bold mb-4`,
        { color: isDark ? '#FFFFFF' : '#111827' }
      ]}>
        Home
      </Text>
      <Text style={[
        tw`text-base text-center`,
        { color: isDark ? '#9CA3AF' : '#4B5563' }
      ]}>
        Welcome to Salozy
      </Text>
    </View>
  );
}
