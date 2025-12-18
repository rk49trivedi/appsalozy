/**
 * Toast utility for showing modern toast messages
 */
import Toast from 'react-native-toast-message';

type ToastOptions = {
  duration?: number;
  title?: string;
};

export const showToast = {
  success: (message: string, title?: string, options?: ToastOptions) => {
    // Short messages show at bottom, long messages should use inline errors
    const isShortMessage = message.length <= 100;
    Toast.show({
      type: 'success',
      text1: title || options?.title || 'Success',
      text2: message,
      position: isShortMessage ? 'bottom' : 'top',
      visibilityTime: options?.duration ?? (message.length > 200 ? 10000 : 6000),
      autoHide: true,
      topOffset: isShortMessage ? 0 : 60,
      bottomOffset: isShortMessage ? 60 : 0,
    } as any);
  },

  error: (message: string, title?: string, options?: ToastOptions) => {
    // Short messages show at bottom, long messages should use inline errors
    const isShortMessage = message.length <= 100;
    Toast.show({
      type: 'error',
      text1: title || options?.title || 'Error',
      text2: message,
      position: isShortMessage ? 'bottom' : 'top',
      visibilityTime: options?.duration ?? (message.length > 200 ? 10000 : 5000),
      autoHide: true,
      topOffset: isShortMessage ? 0 : 60,
      bottomOffset: isShortMessage ? 60 : 0,
    } as any);
  },

  info: (message: string, title?: string, options?: ToastOptions) => {
    // Short messages show at bottom, long messages should use inline errors
    const isShortMessage = message.length <= 100;
    Toast.show({
      type: 'info',
      text1: title || options?.title || 'Info',
      text2: message,
      position: isShortMessage ? 'bottom' : 'top',
      visibilityTime: options?.duration ?? (message.length > 200 ? 9000 : 4000),
      autoHide: true,
      topOffset: isShortMessage ? 0 : 60,
      bottomOffset: isShortMessage ? 60 : 0,
    } as any);
  },
};

