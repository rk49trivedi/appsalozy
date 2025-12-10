import { Button, Input, Text } from '@/components/atoms';
import { EmailIcon, EyeIcon, EyeOffIcon, PasswordIcon } from '@/components/login-icons';
import { Logo } from '@/components/logo';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const params = useLocalSearchParams<{ message?: string; messageType?: string; verificationEmail?: string }>();
  // Check if user is already logged in when this screen is focused
  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        try {
          const token = await apiClient.getStoredToken();
          if (token) {
            // User has token, verify it's valid
            try {
              await apiClient.getProfile();
              // Token is valid, redirect to dashboard
              router.replace('/(tabs)');
            } catch {
              // Token invalid, clear it (already cleared on logout)
              // Stay on login page
            }
          }
          // No token or invalid token - stay on login page
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
        // Login successful - show success message and navigate
        const successMessage = response.message || 'Login successful! Redirecting...';
        showToast.success(successMessage, 'Welcome');
        
        // Small delay to show success message before navigation
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
      
      // Check if email verification is required
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
        // Don't show toast here, the resend form will be visible
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
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`flex-1`}
        >
          <ScrollView
            contentContainerStyle={tw`flex-grow pb-8`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={tw`flex-1 justify-center px-6 py-12`}>
              {/* Logo Section - Mobile Optimized */}
              <Logo size={120} style={tw`mb-4 self-center`} />

              {/* Form Content */}
              <View style={tw`w-full`}>
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

                {/* Email Input */}
                <Input
                  label="Email Address"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  leftIcon={<EmailIcon size={20} color={colors.placeholder} />}
                />

                {/* Password Input */}
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={(value) => handleChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                  leftIcon={<PasswordIcon size={20} color={colors.placeholder} />}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <EyeOffIcon size={20} color={colors.placeholder} />
                      ) : (
                        <EyeIcon size={20} color={colors.placeholder} />
                      )}
                    </TouchableOpacity>
                  }
                />

                {/* Remember Me & Forgot Password - Better Spacing */}
                <View style={tw`flex-row justify-between items-center mb-6`}>
                  <TouchableOpacity
                    onPress={() => handleChange('remember', !formData.remember)}
                    style={tw`flex-row items-center`}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={[
                      tw`w-5 h-5 border-2 rounded items-center justify-center mr-3`,
                      {
                        backgroundColor: formData.remember ? SalozyColors.primary.DEFAULT : 'transparent',
                        borderColor: formData.remember ? SalozyColors.primary.DEFAULT : colors.inputBorder,
                      }
                    ]}>
                      {formData.remember && (
                        <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>✓</Text>
                      )}
                    </View>
                    <Text size="base" weight="medium">
                      Remember me
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/forgot-password')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text size="base" weight="semibold" variant="primaryBrand">
                      Forgot?
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

                {/* Sign In Button */}
                <Button
                  onPress={submitForm}
                  disabled={processing || !formData.email || !formData.password}
                  loading={processing}
                  fullWidth
                  style={tw`mb-6`}
                >
                  {processing ? 'Signing in...' : 'Sign In'}
                </Button>

                {/* Sign Up Link */}
                <View style={[
                  tw`pt-6 border-t items-center`,
                  { borderColor: colors.border }
                ]}>
                  <TouchableOpacity
                    onPress={() => router.push('/register-vendor')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text size="base" variant="secondary" style={tw`text-center`}>
                      Don't have an account?{' '}
                      <Text weight="bold" variant="primaryBrand">
                        Register as Vendor
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
