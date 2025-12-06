/**
 * Salozy Color Scheme
 * Matches the web application's color scheme
 * Primary color: orange-800 (#9A3412)
 */

export const SalozyColors = {
  // Primary Brand Colors
  primary: {
    DEFAULT: '#9A3412', // orange-800
    light: '#C2410C', // orange-700
    dark: '#7C2D12', // orange-900
    bg: '#FFF7ED', // orange-50
    bgLight: '#FFEDD5', // orange-100
  },

  // Text Colors
  text: {
    primary: {
      light: '#111827', // gray-900
      dark: '#FFFFFF',
    },
    secondary: {
      light: '#4B5563', // gray-600
      dark: '#9CA3AF', // gray-400
    },
    tertiary: {
      light: '#6B7280', // gray-500
      dark: '#6B7280', // gray-500
    },
  },

  // Background Colors
  background: {
    light: '#FFFFFF',
    dark: '#111827', // gray-900
    card: {
      light: '#FFFFFF',
      dark: '#1F2937', // gray-800
    },
    secondary: {
      light: '#F9FAFB', // gray-50
      dark: '#1F2937', // gray-800
    },
  },

  // Border Colors
  border: {
    light: '#E5E7EB', // gray-200
    dark: '#374151', // gray-700
    input: {
      light: '#E5E7EB', // gray-200
      dark: '#4B5563', // gray-600
    },
  },

  // Status Colors
  status: {
    success: '#22C55E', // green-500
    error: '#EF4444', // red-500
    warning: '#FBBF24', // yellow-400
    info: '#3B82F6', // blue-500
    pending: '#FBBF24', // yellow-400
    inProgress: '#3B82F6', // blue-500
    completed: '#22C55E', // green-500
    cancelled: '#EF4444', // red-500
  },

  // Status Background Colors (with opacity)
  statusBg: {
    success: {
      light: 'rgba(34, 197, 94, 0.1)',
      dark: 'rgba(34, 197, 94, 0.2)',
    },
    error: {
      light: 'rgba(239, 68, 68, 0.1)',
      dark: 'rgba(239, 68, 68, 0.2)',
    },
    warning: {
      light: 'rgba(251, 191, 36, 0.1)',
      dark: 'rgba(251, 191, 36, 0.2)',
    },
    info: {
      light: 'rgba(59, 130, 246, 0.1)',
      dark: 'rgba(59, 130, 246, 0.2)',
    },
  },

  // Input Colors
  input: {
    background: {
      light: '#F9FAFB', // gray-50
      dark: '#374151', // gray-700
    },
    placeholder: {
      light: '#6B7280', // gray-500
      dark: '#9CA3AF', // gray-400
    },
  },

  // Gradient Colors
  gradient: {
    light: ['#F8FAFC', '#FFFFFF', '#FFF7ED'] as const,
    dark: ['#0F172A', '#1E293B', '#0F172A'] as const,
  },
};

/**
 * Get theme colors based on color scheme
 */
export const getThemeColors = (isDark: boolean) => {
  return {
    primary: SalozyColors.primary.DEFAULT,
    textPrimary: isDark ? SalozyColors.text.primary.dark : SalozyColors.text.primary.light,
    textSecondary: isDark ? SalozyColors.text.secondary.dark : SalozyColors.text.secondary.light,
    textTertiary: isDark ? SalozyColors.text.tertiary.dark : SalozyColors.text.tertiary.light,
    background: isDark ? SalozyColors.background.dark : SalozyColors.background.light,
    cardBg: isDark ? SalozyColors.background.card.dark : SalozyColors.background.card.light,
    secondaryBg: isDark ? SalozyColors.background.secondary.dark : SalozyColors.background.secondary.light,
    border: isDark ? SalozyColors.border.dark : SalozyColors.border.light,
    inputBg: isDark ? SalozyColors.input.background.dark : SalozyColors.input.background.light,
    inputBorder: isDark ? SalozyColors.border.input.dark : SalozyColors.border.input.light,
    placeholder: isDark ? SalozyColors.input.placeholder.dark : SalozyColors.input.placeholder.light,
    gradient: isDark ? SalozyColors.gradient.dark : SalozyColors.gradient.light,
  };
};

