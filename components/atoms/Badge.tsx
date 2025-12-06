import { View, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SalozyColors } from '@/constants/colors';
import { Text } from './Text';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'approved';
  style?: ViewStyle;
}

export function Badge({ children, variant = 'info', style }: BadgeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const variantConfig = {
    success: {
      bg: SalozyColors.statusBg.success[isDark ? 'dark' : 'light'],
      text: SalozyColors.status.success,
    },
    error: {
      bg: SalozyColors.statusBg.error[isDark ? 'dark' : 'light'],
      text: SalozyColors.status.error,
    },
    warning: {
      bg: SalozyColors.statusBg.warning[isDark ? 'dark' : 'light'],
      text: SalozyColors.status.warning,
    },
    info: {
      bg: SalozyColors.statusBg.info[isDark ? 'dark' : 'light'],
      text: SalozyColors.status.info,
    },
    pending: {
      bg: SalozyColors.statusBg.warning[isDark ? 'dark' : 'light'],
      text: SalozyColors.status.pending,
    },
    inProgress: {
      bg: SalozyColors.statusBg.info[isDark ? 'dark' : 'light'],
      text: SalozyColors.status.inProgress,
    },
    completed: {
      bg: SalozyColors.statusBg.success[isDark ? 'dark' : 'light'],
      text: SalozyColors.status.completed,
    },
    cancelled: {
      bg: SalozyColors.statusBg.error[isDark ? 'dark' : 'light'],
      text: SalozyColors.status.cancelled,
    },
    approved: {
      bg: SalozyColors.statusBg.success[isDark ? 'dark' : 'light'],
      text: SalozyColors.status.success,
    },
  };

  const config = variantConfig[variant] || variantConfig.info;

  return (
    <View
      style={[
        tw`px-3 py-1 rounded-full`,
        {
          backgroundColor: config.bg,
        },
        style,
      ]}
    >
      <Text size="sm" weight="semibold" style={{ color: config.text }}>
        {children}
      </Text>
    </View>
  );
}

