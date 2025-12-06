/**
 * Custom Toast Configuration
 * Modern toast styling for the app
 */
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#22C55E',
        backgroundColor: '#F0FDF4',
        height: 60,
        borderLeftWidth: 4,
        borderRadius: 8,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#166534',
      }}
      text2Style={{
        fontSize: 13,
        color: '#15803D',
      }}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#EF4444',
        backgroundColor: '#FEF2F2',
        height: 60,
        borderLeftWidth: 4,
        borderRadius: 8,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#991B1B',
      }}
      text2Style={{
        fontSize: 13,
        color: '#DC2626',
      }}
    />
  ),

  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        height: 60,
        borderLeftWidth: 4,
        borderRadius: 8,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: '#1E40AF',
      }}
      text2Style={{
        fontSize: 13,
        color: '#2563EB',
      }}
    />
  ),
};

