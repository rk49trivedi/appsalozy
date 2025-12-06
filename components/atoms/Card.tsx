import { View, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getThemeColors } from '@/constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  rounded?: boolean;
}

export function Card({ children, style, padding = 6, rounded = true }: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <View
      style={[
        tw`${rounded ? 'rounded-3xl' : ''}`,
        {
          backgroundColor: colors.cardBg,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

