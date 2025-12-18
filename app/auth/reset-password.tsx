import { Text } from '@/components/atoms';
import { getThemeColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';
import tw from 'twrnc';

// App Logo Component (SVG version matching login screen)
const AppLogo = ({ width = 64, height = 75, color = '#d5821d' }: { width?: number; height?: number; color?: string }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 235 287"
    preserveAspectRatio="xMidYMid meet"
  >
    <G>
      <Path
        fill={color}
        d="m127.1-0.03l-106.23 106.22c-27 27-26.99 70.77 0 97.76l1.9 1.9c13.08 13.08 34.27 13.08 47.35 0l46.41-46.41-1.9-1.9c-13.07-13.07-34.27-13.07-47.34 0l59.81-59.81c26.99-27 26.99-70.77 0-97.76z"
      />
      <Path
        fill="#9a3412"
        d="m209.82 82.38l-1.9-1.9c-13.07-13.08-34.27-13.08-47.34 0l-47.69 47.68 1.9 1.9c13.08 13.08 34.27 13.08 47.35 0l-58.54 58.54c-27 27-27 70.77 0 97.76l106.22-106.22c27-27 27-70.77 0-97.76z"
      />
    </G>
  </Svg>
);

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ token?: string; email?: string }>();

  const [formData, setFormData] = useState({
    token: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Helper function to determine if message should be shown inline (long) or toast (short)
  const shouldShowInline = (message: string): boolean => {
    return message.length > 100;
  };

  // Populate form from URL params if available
  useEffect(() => {
    if (params.token) {
      setFormData(prev => ({ ...prev, token: String(params.token) }));
    }
    if (params.email) {
      setFormData(prev => ({ ...prev, email: String(params.email) }));
    }
  }, [params.token, params.email]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear inline error when user starts typing
    if (inlineError) {
      setInlineError(null);
    }
  };

  const validateForm = (): boolean => {
    // Token and email should come from URL params, but validate they exist
    if (!formData.token) {
      showToast.error('Reset token is missing. Please use the link from your email.', 'Validation Error');
      return false;
    }

    if (!formData.email) {
      showToast.error('Email address is missing. Please use the link from your email.', 'Validation Error');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast.error('Invalid email address', 'Validation Error');
      return false;
    }

    if (!formData.password) {
      showToast.error('Please enter a new password', 'Validation Error');
      return false;
    }

    if (formData.password.length < 8) {
      showToast.error('Password must be at least 8 characters long', 'Validation Error');
      return false;
    }

    if (formData.password !== formData.password_confirmation) {
      showToast.error('Passwords do not match', 'Validation Error');
      return false;
    }

    return true;
  };

  const submitForm = async () => {
    // Clear any previous inline errors
    setInlineError(null);
    
    if (!validateForm()) {
      return;
    }

    setProcessing(true);

    try {
      const response = await apiClient.resetPassword({
        token: formData.token,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });
      
      if (response.success) {
        setSuccess(true);
        showToast.success(
          response.message || 'Password reset successfully! You can now log in.',
          'Success'
        );

        // Navigate to login after a delay
        setTimeout(() => {
          router.replace({
            pathname: '/login',
            params: {
              message: response.message || 'Password reset successfully! You can now log in.',
              messageType: 'success',
            },
          });
        }, 2000);
      } else {
        const errorMessage = response.message || 'Failed to reset password. Please try again.';
        if (shouldShowInline(errorMessage)) {
          setInlineError(errorMessage);
        } else {
          showToast.error(errorMessage, 'Error');
        }
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      
      // Handle specific error messages
      let errorMessage = apiError.message || 'Failed to reset password. Please try again.';
      
      // Check for validation errors
      if (apiError.errors) {
        const firstError = Object.values(apiError.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0];
        }
      }

      if (shouldShowInline(errorMessage)) {
        setInlineError(errorMessage);
      } else {
      showToast.error(errorMessage, 'Error');
      }
    } finally {
      setProcessing(false);
    }
  };

  const colors = getThemeColors(isDark);

  return (
    <SafeAreaView style={tw`flex-1`} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[tw`flex-1 bg-stone-50`, { backgroundColor: '#FAFAF9' }]}>
          <ScrollView
            contentContainerStyle={tw`flex-grow pb-8`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={tw`flex-1 justify-center px-8 py-12`}>
              {/* Logo & Header */}
              <View style={tw`items-center mb-10`}>
                <AppLogo width={64} height={75} />
                <Text
                  style={[
                    tw`mt-6 text-2xl font-bold text-center`,
                    { color: '#0C0A09' }
                  ] as any}
                >
                    Reset Password
                  </Text>
                <Text
                  style={[
                    tw`mt-2 text-sm text-center`,
                    { color: '#78716C' }
                  ] as any}
                >
                    Create a new password for your account
                  </Text>
                </View>

                {/* Success Message */}
                {success && (
                  <View style={[
                    tw`p-4 rounded-2xl mb-6`,
                    { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : 'rgba(240, 253, 244, 0.95)' }
                  ]}>
                    <Text size="base" weight="semibold" style={tw`mb-1`}>
                      Password Reset Successful!
                    </Text>
                    <Text size="sm" variant="secondary">
                      Your password has been reset successfully. Redirecting to login...
                    </Text>
                  </View>
                )}

              {/* Inline Error Message */}
              {inlineError && (
                <View style={[
                  tw`p-4 rounded-2xl mb-6 border`,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(254, 242, 242, 0.95)',
                    borderColor: '#EF4444',
                    borderWidth: 1,
                  }
                ]}>
                  <View style={tw`flex-row items-start mb-2`}>
                    <MaterialIcons name="error-outline" size={20} color="#DC2626" style={tw`mr-2 mt-0.5`} />
                    <Text size="base" weight="semibold" style={{ color: '#991B1B' }}>
                      Error
                    </Text>
                  </View>
                  <Text size="sm" style={{ color: '#DC2626', lineHeight: 20 }}>
                    {inlineError}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setInlineError(null)}
                    style={tw`mt-2 self-end`}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="close" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Form */}
              <View>
                {/* Email Display (Read-only) */}
                {formData.email && (
                  <View style={tw`mb-5`}>
                    <Text style={[tw`text-xs font-semibold mb-1.5 ml-1`, { color: '#78716C' }] as any}>
                      Email Address
                    </Text>
                    <View style={tw`relative`}>
                      <View style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
                        <MaterialIcons name="mail" size={18} color="#A8A29E" />
                      </View>
                      <TextInput
                        style={[
                          tw`w-full bg-white border rounded-xl py-3.5 pl-11 pr-4 text-sm`,
                          {
                            borderColor: '#E7E5E4',
                            color: '#78716C',
                            fontSize: 14,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                          }
                        ]}
                        value={formData.email}
                        editable={false}
                      />
                    </View>
                  </View>
                )}

                {/* New Password Input */}
                <View style={tw`mb-5`}>
                  <Text style={[tw`text-xs font-semibold mb-1.5 ml-1`, { color: '#78716C' }] as any}>
                    New Password
                  </Text>
                  <View style={tw`relative`}>
                    <View style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
                      <MaterialIcons name="lock" size={18} color="#A8A29E" />
                    </View>
                    <TextInput
                      style={[
                        tw`w-full bg-white border rounded-xl py-3.5 pl-11 pr-11 text-sm`,
                        {
                          borderColor: '#E7E5E4',
                          color: '#1C1917',
                          fontSize: 14,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }
                      ]}
                  placeholder="Enter new password"
                      placeholderTextColor="#A8A29E"
                  value={formData.password}
                  onChangeText={(value) => handleChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                      editable={!success}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={tw`absolute right-4 top-0 bottom-0 justify-center z-10`}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <MaterialIcons name="visibility-off" size={18} color="#A8A29E" />
                      ) : (
                        <MaterialIcons name="visibility" size={18} color="#A8A29E" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={tw`mb-5`}>
                  <Text style={[tw`text-xs font-semibold mb-1.5 ml-1`, { color: '#78716C' }] as any}>
                    Confirm Password
                  </Text>
                  <View style={tw`relative`}>
                    <View style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
                      <MaterialIcons name="lock" size={18} color="#A8A29E" />
                    </View>
                    <TextInput
                      style={[
                        tw`w-full bg-white border rounded-xl py-3.5 pl-11 pr-11 text-sm`,
                        {
                          borderColor: '#E7E5E4',
                          color: '#1C1917',
                          fontSize: 14,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }
                      ]}
                  placeholder="Confirm new password"
                      placeholderTextColor="#A8A29E"
                  value={formData.password_confirmation}
                  onChangeText={(value) => handleChange('password_confirmation', value)}
                  secureTextEntry={!showPasswordConfirmation}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                      editable={!success}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      style={tw`absolute right-4 top-0 bottom-0 justify-center z-10`}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPasswordConfirmation ? (
                        <MaterialIcons name="visibility-off" size={18} color="#A8A29E" />
                      ) : (
                        <MaterialIcons name="visibility" size={18} color="#A8A29E" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={submitForm}
                  disabled={processing || success}
                  style={[
                    tw`w-full mt-4`,
                    {
                      opacity: processing || success ? 0.6 : 1,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#9a3412', '#d5821d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[tw`w-full py-4 rounded-2xl items-center justify-center`]}
                >
                    {processing ? (
                      <Text style={[tw`font-bold text-sm`, { color: '#FFFFFF' }] as any}>
                        Resetting Password...
                      </Text>
                    ) : (
                      <Text style={[tw`font-bold text-sm`, { color: '#FFFFFF' }] as any}>
                        {success ? 'Password Reset' : 'Reset Password'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={tw`py-8 items-center`}>
                  <TouchableOpacity
                    onPress={() => router.replace('/login')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={tw`flex-row items-center`}
                  >
              <MaterialIcons name="arrow-back" size={16} color="#78716C" />
              <Text style={[tw`text-xs ml-1`, { color: '#78716C' }] as any}>
                Back to Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

