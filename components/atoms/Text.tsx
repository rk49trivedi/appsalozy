import { Text as RNText, TextProps, TextStyle } from 'react-native';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getThemeColors, SalozyColors } from '@/constants/colors';

interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'primaryBrand';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  style?: TextStyle;
}

export function Text({
  variant = 'primary',
  size = 'base',
  weight = 'normal',
  style,
  children,
  ...props
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  const variantColors = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    primaryBrand: SalozyColors.primary.DEFAULT,
  };

  const sizeStyles = {
    xs: tw`text-xs`,
    sm: tw`text-sm`,
    base: tw`text-base`,
    lg: tw`text-lg`,
    xl: tw`text-xl`,
    '2xl': tw`text-2xl`,
    '3xl': tw`text-3xl`,
  };

  const weightStyles = {
    normal: tw`font-normal`,
    medium: tw`font-medium`,
    semibold: tw`font-semibold`,
    bold: tw`font-bold`,
  };

  return (
    <RNText
      style={[
        sizeStyles[size],
        weightStyles[weight],
        { color: variantColors[variant] },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

