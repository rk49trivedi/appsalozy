import { SalozyColors } from '@/constants/colors';
import { ActivityIndicator, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import tw from 'twrnc';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: tw`py-2 px-4`,
    md: tw`py-4 px-6`,
    lg: tw`py-5 px-8`,
  };

  const variantStyles = {
    primary: {
      bg: SalozyColors.primary.DEFAULT,
      text: '#FFFFFF',
      border: 'transparent',
    },
    secondary: {
      bg: '#F3F4F6',
      text: '#111827',
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      text: SalozyColors.primary.DEFAULT,
      border: SalozyColors.primary.DEFAULT,
    },
    danger: {
      bg: SalozyColors.status.error,
      text: '#FFFFFF',
      border: 'transparent',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        sizeStyles[size],
        tw`rounded-2xl items-center justify-center ${fullWidth ? 'w-full' : ''}`,
        {
          backgroundColor: variant === 'outline' ? 'transparent' : currentVariant.bg,
          borderWidth: variant === 'outline' ? 2 : 0,
          borderColor: variant === 'outline' ? currentVariant.border : 'transparent',
          opacity: isDisabled ? 0.6 : 1,
          minHeight: size === 'lg' ? 56 : size === 'md' ? 48 : 40,
        },
        style,
      ]}
    >
      {loading ? (
        <View style={tw`flex-row items-center`}>
          <ActivityIndicator color={currentVariant.text} size="small" style={tw`mr-3`} />
          <Text style={[tw`font-bold text-lg`, { color: currentVariant.text }, textStyle]}>
            Loading...
          </Text>
        </View>
      ) : (
        <Text style={[tw`font-bold text-lg`, { color: currentVariant.text }, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

