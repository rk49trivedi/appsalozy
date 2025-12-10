import { Button, Card, Input, Text } from '@/components/atoms';
import { EmailIcon } from '@/components/login-icons';
import { Logo } from '@/components/logo';
import { getThemeColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [formData, setFormData] = useState({
    email: '',
  });

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitForm = async () => {
    if (!formData.email) {
      showToast.error('Please enter your email address', 'Validation Error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast.error('Please enter a valid email address', 'Validation Error');
      return;
    }

    setProcessing(true);

    try {
      const response = await apiClient.forgotPassword(formData.email);
      
      // All messages come from API - no hardcoded messages in mobile app
      if (response.success) {
        setSuccess(true);
        showToast.success(
          response.message || 'Password reset link sent! Please check your email.',
          'Email Sent'
        );
      } else {
        // API returned success: false
        showToast.error(
          response.message || 'Failed to send reset link. Please try again.',
          'Error'
        );
      }
    } catch (err: any) {
      // Handle API errors (404, 500, etc.) - all error messages come from API
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Failed to send reset link. Please try again.';
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`flex-1`}
        >
          <ScrollView
            contentContainerStyle={tw`flex-grow`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={tw`flex-1 justify-center px-5 py-8`}>
              {/* Logo Section */}
              <Logo size={128} style={tw`mb-3`} />

              {/* Form Card */}
              <Card style={tw`w-full`}>
                {/* Header Section */}
                <View style={tw`mb-6`}>
                  <Text size="2xl" weight="bold" style={tw`mb-2`}>
                    Forgot Password?
                  </Text>
                  <Text size="base" variant="secondary">
                    Enter your email address and we'll send you a link to reset your password
                  </Text>
                </View>

                {/* Success Message */}
                {success && (
                  <View style={[
                    tw`p-4 rounded-2xl mb-6`,
                    { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : 'rgba(240, 253, 244, 0.95)' }
                  ]}>
                    <Text size="base" weight="semibold" style={tw`mb-1`}>
                      Check your email
                    </Text>
                    <Text size="sm" variant="secondary">
                      We've sent a password reset link to {formData.email}. Please check your inbox and follow the instructions to reset your password.
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
                  editable={!success}
                />

                {/* Submit Button */}
                <Button
                  onPress={submitForm}
                  disabled={processing || !formData.email || success}
                  loading={processing}
                  fullWidth
                  style={tw`mb-6 mt-6`}
                >
                  {processing ? 'Sending...' : success ? 'Link Sent' : 'Send Reset Link'}
                </Button>

                {/* Back to Login Link */}
                <View style={[
                  tw`pt-6 border-t items-center`,
                  { borderColor: colors.border }
                ]}>
                  <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text size="base" variant="secondary" style={tw`text-center`}>
                      ← Back to Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

