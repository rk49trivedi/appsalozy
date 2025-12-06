import { TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <View style={[tw`mb-5`, containerStyle]}>
      {label && (
        <Text style={[tw`text-base font-semibold mb-3`, { color: colors.textPrimary }]}>
          {label}
        </Text>
      )}
      <View style={tw`relative`}>
        {leftIcon && (
          <View style={tw`absolute left-5 top-0 bottom-0 justify-center z-10`}>
            {leftIcon}
          </View>
        )}
        <TextInput
          style={[
            tw`w-full ${leftIcon ? 'pl-14' : 'pl-5'} ${rightIcon ? 'pr-14' : 'pr-5'} py-4 rounded-2xl border text-base`,
            {
              backgroundColor: colors.inputBg,
              borderColor: error ? SalozyColors.status.error : colors.inputBorder,
              color: colors.textPrimary,
              minHeight: 56,
            },
            style,
          ]}
          placeholderTextColor={colors.placeholder}
          {...props}
        />
        {rightIcon && (
          <View style={tw`absolute right-5 top-0 bottom-0 justify-center`}>
            {rightIcon}
          </View>
        )}
      </View>
      {error && (
        <Text style={[tw`text-sm mt-2`, { color: SalozyColors.status.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

