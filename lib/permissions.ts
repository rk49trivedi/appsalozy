/**
 * Permission utilities for requesting camera permissions
 * Note: Photo library access uses Android photo picker (no permission needed)
 */
import * as ImagePicker from 'expo-image-picker';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

/**
 * Request camera permission for Android
 * Note: iOS permissions are handled automatically by expo-image-picker
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    // iOS permissions are handled by expo-image-picker automatically
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message:
          'Salozy needs access to your camera ' +
          'so you can take photos for profile pictures, logos, and receipts.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    } else {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos. Please enable it in your device settings.'
      );
      return false;
    }
  } catch (err) {
    console.warn('Error requesting camera permission:', err);
    return false;
  }
};

/**
 * Request media library permission (deprecated - uses Android photo picker)
 * This function is kept for backward compatibility but no longer requests permissions
 * Android photo picker doesn't require persistent permissions
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  // Android photo picker doesn't require permissions
  // iOS permissions are handled automatically by expo-image-picker
  return true;
};

/**
 * Request camera permission (for expo-image-picker)
 */
export const requestCameraPermissionAsync = async (): Promise<boolean> => {
  // First request Android native permission if needed
  if (Platform.OS === 'android') {
    const androidGranted = await requestCameraPermission();
    if (!androidGranted) {
      return false;
    }
  }
  
  // Then request expo-image-picker camera permission
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Camera permission is required to take photos. Please enable it in your device settings.'
    );
    return false;
  }
  
  return true;
};

