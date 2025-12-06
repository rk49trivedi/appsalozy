import { Button, Card, Input, Text } from '@/components/atoms';
import { EmailIcon, EyeIcon, EyeOffIcon, PasswordIcon } from '@/components/login-icons';
import { Logo } from '@/components/logo';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        showToast.success('Login successful! Redirecting...', 'Welcome');
        
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
      const errorMessage = apiError.message || 'Login failed. Please check your credentials and try again.';
      
      showToast.error(errorMessage, 'Login Failed');
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
              {/* Logo Section - Mobile Optimized */}
              <Logo size={128} style={tw`mb-3`} />

              {/* Form Card - Full Mobile Width - Clean Design */}
              <Card style={tw`w-full`}>
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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text size="base" weight="semibold" variant="primaryBrand">
                      Forgot?
                    </Text>
                  </TouchableOpacity>
                </View>

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
                  <Text size="base" variant="secondary" style={tw`text-center`}>
                    Don't have an account?{' '}
                    <Text weight="bold" variant="primaryBrand">
                      Sign Up
                    </Text>
                  </Text>
                </View>
              </Card>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
