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
        minHeight: 60,
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
      text1NumberOfLines={props.text1NumberOfLines ?? 3}
      text2NumberOfLines={props.text2NumberOfLines ?? 6}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#EF4444',
        backgroundColor: '#FEF2F2',
        minHeight: 60,
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
      text1NumberOfLines={props.text1NumberOfLines ?? 3}
      text2NumberOfLines={props.text2NumberOfLines ?? 6}
    />
  ),

  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        minHeight: 60,
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
      text1NumberOfLines={props.text1NumberOfLines ?? 3}
      text2NumberOfLines={props.text2NumberOfLines ?? 6}
    />
  ),
};

