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
    Toast.show({
      type: 'success',
      text1: title || options?.title || 'Success',
      text2: message,
      position: 'top',
      visibilityTime: options?.duration ?? 6000,
      autoHide: true,
      topOffset: 60,
      // Allow longer text without truncation
      text1NumberOfLines: 3,
      text2NumberOfLines: 6,
    } as any);
  },

  error: (message: string, title?: string, options?: ToastOptions) => {
    Toast.show({
      type: 'error',
      text1: title || options?.title || 'Error',
      text2: message,
      position: 'top',
      visibilityTime: options?.duration ?? 5000,
      autoHide: true,
      topOffset: 60,
      text1NumberOfLines: 3,
      text2NumberOfLines: 6,
    } as any);
  },

  info: (message: string, title?: string, options?: ToastOptions) => {
    Toast.show({
      type: 'info',
      text1: title || options?.title || 'Info',
      text2: message,
      position: 'top',
      visibilityTime: options?.duration ?? 4000,
      autoHide: true,
      topOffset: 60,
      text1NumberOfLines: 3,
      text2NumberOfLines: 6,
    } as any);
  },
};

