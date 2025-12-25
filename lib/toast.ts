/**
 * Toast utility for showing toast messages using React Native ToastAndroid
 * Note: ToastAndroid only works on Android platform
 */
import { ToastAndroid, Platform } from 'react-native';

type ToastOptions = {
  duration?: number;
  title?: string;
};

// Convert duration in milliseconds to ToastAndroid duration
const getToastDuration = (duration?: number): number => {
  if (!duration) return ToastAndroid.SHORT;
  // ToastAndroid.SHORT = 2 seconds, ToastAndroid.LONG = 3.5 seconds
  // For custom durations, default to LONG if > 3 seconds, otherwise SHORT
  return duration > 3000 ? ToastAndroid.LONG : ToastAndroid.SHORT;
};

// Format message with optional title
const formatMessage = (message: string, title?: string): string => {
  if (title) {
    return `${title}: ${message}`;
  }
  return message;
};

export const showToast = {
  success: (message: string, title?: string, options?: ToastOptions) => {
    if (Platform.OS !== 'android') {
      // Fallback for non-Android platforms (iOS, web)
      console.log(`[Success] ${formatMessage(message, title || options?.title || 'Success')}`);
      return;
    }
    
    const toastMessage = formatMessage(message, title || options?.title || 'Success');
    const duration = getToastDuration(options?.duration);
    
    ToastAndroid.show(toastMessage, duration);
  },

  error: (message: string, title?: string, options?: ToastOptions) => {
    if (Platform.OS !== 'android') {
      // Fallback for non-Android platforms (iOS, web)
      console.error(`[Error] ${formatMessage(message, title || options?.title || 'Error')}`);
      return;
    }
    
    const toastMessage = formatMessage(message, title || options?.title || 'Error');
    const duration = getToastDuration(options?.duration);
    
    ToastAndroid.show(toastMessage, duration);
  },

  info: (message: string, title?: string, options?: ToastOptions) => {
    if (Platform.OS !== 'android') {
      // Fallback for non-Android platforms (iOS, web)
      console.log(`[Info] ${formatMessage(message, title || options?.title || 'Info')}`);
      return;
    }
    
    const toastMessage = formatMessage(message, title || options?.title || 'Info');
    const duration = getToastDuration(options?.duration);
    
    ToastAndroid.show(toastMessage, duration);
  },
};

