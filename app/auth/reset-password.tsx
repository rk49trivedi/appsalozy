import { Button, Input, Text } from '@/components/atoms';
import { EmailIcon, EyeIcon, EyeOffIcon, PasswordIcon, Logo } from '@/components/atoms';
import { getThemeColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

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
        showToast.error(
          response.message || 'Failed to reset password. Please try again.',
          'Error'
        );
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

      showToast.error(errorMessage, 'Error');
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
              {/* Logo Section */}
              <Logo size={120} style={tw`mb-4 self-center`} />

              {/* Form Content */}
              <View style={tw`w-full`}>
                {/* Header Section */}
                <View style={tw`mb-8`}>
                  <Text size="2xl" weight="bold" style={tw`mb-3 text-center`}>
                    Reset Password
                  </Text>
                  <Text size="base" variant="secondary" style={tw`text-center`}>
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

                {/* Email Display (Read-only) */}
                {formData.email && (
                  <View style={tw`mb-4`}>
                    <Text size="sm" weight="medium" style={tw`mb-2`}>
                      Email Address
                    </Text>
                    <View style={[
                      tw`flex-row items-center px-4 py-3 rounded-xl border`,
                      {
                        backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)',
                        borderColor: colors.inputBorder,
                      }
                    ]}>
                      <EmailIcon size={20} color={colors.placeholder} style={tw`mr-3`} />
                      <Text size="base" variant="secondary" style={tw`flex-1`}>
                        {formData.email}
                      </Text>
                    </View>
                  </View>
                )}

                {/* New Password Input */}
                <Input
                  label="New Password"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChangeText={(value) => handleChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
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
                  editable={!success}
                  containerStyle={tw`mb-4`}
                />

                {/* Confirm Password Input */}
                <Input
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={formData.password_confirmation}
                  onChangeText={(value) => handleChange('password_confirmation', value)}
                  secureTextEntry={!showPasswordConfirmation}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                  leftIcon={<PasswordIcon size={20} color={colors.placeholder} />}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPasswordConfirmation ? (
                        <EyeOffIcon size={20} color={colors.placeholder} />
                      ) : (
                        <EyeIcon size={20} color={colors.placeholder} />
                      )}
                    </TouchableOpacity>
                  }
                  editable={!success}
                  containerStyle={tw`mb-6`}
                />

                {/* Submit Button */}
                <Button
                  onPress={submitForm}
                  disabled={processing || success}
                  loading={processing}
                  fullWidth
                  style={tw`mb-6`}
                >
                  {processing ? 'Resetting Password...' : success ? 'Password Reset' : 'Reset Password'}
                </Button>

                {/* Back to Login Link */}
                <View style={[
                  tw`pt-6 border-t items-center`,
                  { borderColor: colors.border }
                ]}>
                  <TouchableOpacity
                    onPress={() => router.replace('/login')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text size="base" variant="secondary" style={tw`text-center`}>
                      ← Back to Login
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

