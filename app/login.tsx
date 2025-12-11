import { Button, Input, Text } from '@/components/atoms';
import { EmailIcon } from '@/components/atoms';
import { getThemeColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';
import tw from 'twrnc';

// App Logo Component (SVG version matching ui.tsx)
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

export default function LoginScreen() {
  const params = useLocalSearchParams<{ message?: string; messageType?: string; verificationEmail?: string }>();
  
  // Check if user is already logged in when this screen is focused
  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        try {
          const token = await apiClient.getStoredToken();
          if (token) {
            try {
              await apiClient.getProfile();
              router.replace('/(tabs)');
            } catch {
              // Token invalid, stay on login page
            }
          }
        } catch (error) {
          // On error, stay on login page
        }
      };
      checkAuth();
    }, [])
  );

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    if (params.message) {
      const type = params.messageType === 'success' ? 'success' : 'info';
      const emailFromParams = params.verificationEmail ? String(params.verificationEmail) : '';
      if (emailFromParams) {
        setVerificationEmail(emailFromParams);
      }
      setBanner({ message: String(params.message), type });

      const timeoutId = setTimeout(() => setBanner(null), 9000);
      return () => clearTimeout(timeoutId);
    }
  }, [params.message, params.messageType, params.verificationEmail]);

  const submitForm = async () => {
    if (!formData.email || !formData.password) {
      showToast.error('Please enter both email and password', 'Validation Error');
      return;
    }

    setProcessing(true);

    try {
      const response = await apiClient.login(formData.email, formData.password);
      
      if (response.access_token) {
        const successMessage = response.message || 'Login successful! Redirecting...';
        showToast.success(successMessage, 'Welcome');
        
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
      } else {
        showToast.error(
          response.message || 'Login failed. Please try again.',
          'Login Failed'
        );
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      
      if (apiError.status === 403 && (apiError as any).email_verification_required) {
        const emailToUse = (apiError as any).email || formData.email;
        setVerificationEmail(emailToUse);
        setShowResendForm(true);
        setBanner({
          message:
            apiError.message ||
            'Please verify your email before signing in. Tap below to resend the verification link.',
          type: 'info',
        });
      } else {
        const errorMessage = apiError.message || 'Login failed. Please check your credentials and try again.';
        showToast.error(errorMessage, 'Login Failed');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleResendVerification = async () => {
    const emailToResend = verificationEmail || formData.email;
    
    if (!emailToResend) {
      showToast.error('Please enter your email address', 'Validation Error');
      return;
    }

    setResendingEmail(true);

    try {
      const response = await apiClient.resendVerificationEmail(emailToResend);
      
      if (response.success) {
        showToast.success(
          response.message || 'Verification email sent! Please check your inbox.',
          'Email Sent'
        );
        setShowResendForm(false);
      } else {
        showToast.error(
          response.message || 'Failed to send verification email. Please try again.',
          'Error'
        );
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Failed to send verification email. Please try again.';
      showToast.error(errorMessage, 'Error');
    } finally {
      setResendingEmail(false);
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
                  Welcome Back
                </Text>
                <Text
                  style={[
                    tw`mt-2 text-sm text-center`,
                    { color: '#78716C' }
                  ] as any}
                >
                  Please sign in to your account
                </Text>
              </View>

              {/* Contextual banner from prior flows */}
              {banner && (
                <View style={[
                  tw`p-4 rounded-2xl mb-4`,
                  banner.type === 'success'
                    ? { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : 'rgba(240, 253, 244, 0.95)' }
                    : { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : 'rgba(239, 246, 255, 0.95)' },
                ]}>
                  <Text size="base" weight="semibold" style={tw`mb-1`}>
                    {banner.type === 'success' ? 'Almost there — verify your email' : 'Verification required'}
                  </Text>
                  <Text size="sm" variant="secondary">
                    {banner.message}
                  </Text>
                </View>
              )}

              {/* Login Form */}
              <View>
                {/* Email Input */}
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
                          color: '#1C1917',
                          fontSize: 14,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }
                      ]}
                      placeholder="hello@salozy.com"
                      placeholderTextColor="#A8A29E"
                      value={formData.email}
                      onChangeText={(value) => handleChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={tw`mb-5`}>
                  <Text style={[tw`text-xs font-semibold mb-1.5 ml-1`, { color: '#78716C' }] as any}>
                    Password
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
                      placeholder="••••••••"
                      placeholderTextColor="#A8A29E"
                      value={formData.password}
                      onChangeText={(value) => handleChange('password', value)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                      autoCorrect={false}
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

                {/* Remember Me & Forgot Password */}
                <View style={tw`flex-row justify-between items-center pt-1`}>
                  <TouchableOpacity
                    onPress={() => handleChange('remember', !formData.remember)}
                    style={tw`flex-row items-center`}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={[
                      tw`w-4 h-4 border rounded items-center justify-center mr-2`,
                      {
                        backgroundColor: formData.remember ? '#d5821d' : 'transparent',
                        borderColor: formData.remember ? '#d5821d' : '#D6D3D1',
                      }
                    ]}>
                      {formData.remember && (
                        <MaterialIcons name="check" size={10} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={[tw`text-xs font-medium`, { color: '#78716C' }] as any}>
                      Remember me
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/forgot-password')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[tw`text-xs font-semibold`, { color: '#9a3412' }] as any}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Email Verification Resend Form */}
                {showResendForm && (
                  <View style={[
                    tw`p-4 rounded-2xl mb-6`,
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 242, 242, 0.8)' }
                  ]}>
                    <Text size="base" weight="semibold" style={tw`mb-2`}>
                      Email Verification Required
                    </Text>
                    <Text size="sm" variant="secondary" style={tw`mb-4`}>
                      We've sent a verification link to your email. If you didn't receive it, enter your email address below and click the button to resend.
                    </Text>
                    <Input
                      label="Email Address"
                      placeholder="Enter your email"
                      value={verificationEmail || formData.email}
                      onChangeText={(value) => setVerificationEmail(value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      leftIcon={<EmailIcon size={20} color={colors.placeholder} />}
                      containerStyle={tw`mb-4`}
                    />
                    <Button
                      onPress={handleResendVerification}
                      disabled={resendingEmail || !verificationEmail}
                      loading={resendingEmail}
                      fullWidth
                      style={tw`mb-2`}
                    >
                      {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                    <TouchableOpacity
                      onPress={() => {
                        setShowResendForm(false);
                        setVerificationEmail('');
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text size="sm" variant="secondary" style={tw`text-center`}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={submitForm}
                  disabled={processing || !formData.email || !formData.password}
                  style={[
                    tw`w-full mt-4`,
                    {
                      opacity: processing || !formData.email || !formData.password ? 0.6 : 1,
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
                        Signing in...
                      </Text>
                    ) : (
                      <Text style={[tw`font-bold text-sm`, { color: '#FFFFFF' }] as any}>
                        LOGIN
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={tw`py-8 items-center`}>
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-xs text-center`, { color: '#78716C' }] as any}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/register-vendor')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[tw`text-xs font-bold`, { color: '#9a3412' }] as any}>
                  Register as Vendor
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
