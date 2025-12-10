import { Button, Input, Text } from '@/components/atoms';
import { EmailIcon, EyeIcon, EyeOffIcon, PasswordIcon } from '@/components/login-icons';
import { Logo } from '@/components/logo';
import { getThemeColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

// Additional icons for registration form
function UserIcon({ size = 20, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </Svg>
  );
}

function BuildingIcon({ size = 20, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </Svg>
  );
}

function GlobeIcon({ size = 20, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </Svg>
  );
}

const CENTRAL_DOMAIN = 'salozy.com';

export default function RegisterVendorScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    company_name: '',
    company_domain: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const handleChange = (field: string, value: string) => {
    let newValue = value;

    // Auto-format company domain
    if (field === 'company_domain') {
      newValue = value
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/[^a-zA-Z0-9-]/g, '') // Remove special characters except dash
        .toLowerCase(); // Convert to lowercase
    }

    setFormData(prev => ({
      ...prev,
      [field]: newValue,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.company_domain.trim()) {
      newErrors.company_domain = 'Company domain is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.company_domain)) {
      newErrors.company_domain = 'Domain can only contain lowercase letters, numbers, and dashes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitForm = async () => {
    if (!validateForm()) {
      showToast.error('Please fix the errors in the form', 'Validation Error');
      return;
    }

    setProcessing(true);

    try {
      const response = await apiClient.registerVendor(formData);

      if (response.success) {
        const successMessage =
          response.message ||
          'Registration successful! Please check your email to verify your account.';

        showToast.success(successMessage, 'Success', { duration: 8000 });

        // Navigate to login screen with contextual message after a short delay
        setTimeout(() => {
          router.replace({
            pathname: '/login',
            params: { 
              message: successMessage,
              messageType: 'success',
              verificationEmail: formData.email,
            },
          });
        }, 1200);
      } else {
        showToast.error(
          response.message || 'Registration failed. Please try again.',
          'Registration Failed'
        );
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      
      // Handle validation errors from API
      if (apiError.errors) {
        const apiErrors: Record<string, string> = {};
        Object.keys(apiError.errors).forEach(key => {
          apiErrors[key] = Array.isArray(apiError.errors![key]) 
            ? apiError.errors![key][0] 
            : apiError.errors![key];
        });
        setErrors(apiErrors);
        showToast.error('Please fix the errors in the form', 'Validation Error');
      } else {
        const errorMessage = apiError.message || 'Registration failed. Please try again.';
        showToast.error(errorMessage, 'Registration Failed');
      }
    } finally {
      setProcessing(false);
    }
  };

  const fullDomain = formData.company_domain 
    ? `${formData.company_domain}.${CENTRAL_DOMAIN}`
    : `yourdomain.${CENTRAL_DOMAIN}`;

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
                <View style={tw`mb-8`}>
                  <Text 
                    size="2xl" 
                    weight="bold" 
                    style={tw`mb-3 text-center`}
                  >
                    Create Vendor Account
                  </Text>
                  <Text 
                    size="base" 
                    variant="secondary" 
                    style={tw`text-center`}
                  >
                    Start your business journey with our comprehensive salon management platform
                  </Text>
                </View>

                {/* Name Input */}
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(value) => handleChange('name', value)}
                  autoCapitalize="words"
                  autoComplete="name"
                  autoCorrect={false}
                  leftIcon={<UserIcon size={20} color={colors.placeholder} />}
                  error={errors.name}
                />

                {/* Email Input */}
                <Input
                  label="Email Address"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  leftIcon={<EmailIcon size={20} color={colors.placeholder} />}
                  error={errors.email}
                />

                {/* Password Input */}
                <Input
                  label="Password"
                  placeholder="Enter your password"
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
                  error={errors.password}
                />

                {/* Confirm Password Input */}
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
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
                  error={errors.password_confirmation}
                />

                {/* Business Information Section */}
                <View style={[
                  tw`p-4 rounded-2xl mb-5`,
                  { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.1)' : 'rgba(255, 247, 237, 0.8)' }
                ]}>
                  <Text 
                    size="lg" 
                    weight="bold" 
                    style={tw`mb-2`}
                  >
                    Business Information
                  </Text>
                  <Text 
                    size="sm" 
                    variant="secondary" 
                    style={tw`mb-4`}
                  >
                    Please provide your business details
                  </Text>

                  {/* Company Name Input */}
                  <Input
                    label="Company Name"
                    placeholder="Enter your company name"
                    value={formData.company_name}
                    onChangeText={(value) => handleChange('company_name', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    leftIcon={<BuildingIcon size={20} color={colors.placeholder} />}
                    error={errors.company_name}
                    containerStyle={tw`mb-4`}
                  />

                  {/* Company Domain Input */}
                  <Input
                    label="Company Domain"
                    placeholder="Enter your domain"
                    value={formData.company_domain}
                    onChangeText={(value) => handleChange('company_domain', value)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    leftIcon={<GlobeIcon size={20} color={colors.placeholder} />}
                    error={errors.company_domain}
                  />

                  {/* Domain Preview */}
                  <View style={[
                    tw`p-3 rounded-xl mt-2`,
                    { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 246, 255, 0.8)' }
                  ]}>
                    <Text size="sm" weight="semibold" style={tw`mb-1`}>
                      Your subdomain:
                    </Text>
                    <Text
                      size="sm"
                      style={tw.style(
                        'font-mono px-2 py-1 rounded',
                        {
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)',
                          color: isDark ? '#93C5FD' : '#1E40AF',
                        },
                      )}
                    >
                      {fullDomain}
                    </Text>
                  </View>
                </View>

                {/* Submit Button */}
                <Button
                  onPress={submitForm}
                  disabled={processing}
                  loading={processing}
                  fullWidth
                  style={tw`mb-6`}
                >
                  {processing ? 'Creating Account...' : 'Create Vendor Account'}
                </Button>

                {/* Login Link */}
                <View style={[
                  tw`pt-6 border-t items-center`,
                  { borderColor: colors.border }
                ]}>
                  <Text size="base" variant="secondary" style={tw`text-center`}>
                    Already have an account?{' '}
                    <Text 
                      weight="bold" 
                      variant="primaryBrand"
                      onPress={() => router.replace('/login')}
                    >
                      Sign In
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

