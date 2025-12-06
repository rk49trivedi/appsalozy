import { EmailIcon, EyeIcon, EyeOffIcon, PasswordIcon } from '@/components/login-icons';
import { Logo } from '@/components/logo';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

  const gradientColors = isDark 
    ? ['#0F172A', '#1E293B', '#0F172A'] as const
    : ['#F8FAFC', '#FFFFFF', '#FFF7ED'] as const;

  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const inputBg = isDark ? '#374151' : '#F9FAFB';
  const inputBorder = isDark ? '#4B5563' : '#E5E7EB';
  const inputFocusBorder = '#9A3412';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const placeholderColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <SafeAreaView style={tw`flex-1`} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <LinearGradient
          colors={gradientColors}
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
              <View style={[
                tw`rounded-3xl p-6`,
                {
                  backgroundColor: cardBg,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                }
              ]}>
                {/* Email Input - Larger Touch Target */}
                <View style={tw`mb-5`}>
                  <Text style={[
                    tw`text-base font-semibold mb-3`,
                    { color: textPrimary }
                  ]}>
                    Email Address
                  </Text>
                  <View style={tw`relative`}>
                    <View style={tw`absolute left-5 top-0 bottom-0 justify-center z-10`}>
                      <EmailIcon size={20} color={placeholderColor} />
                    </View>
                    <TextInput
                      style={[
                        tw`w-full pl-14 pr-5 py-4 rounded-2xl border text-base`,
                        {
                          backgroundColor: inputBg,
                          borderColor: inputBorder,
                          color: textPrimary,
                          minHeight: 56, // Larger touch target
                        }
                      ]}
                      placeholder="Enter your email"
                      placeholderTextColor={placeholderColor}
                      value={formData.email}
                      onChangeText={(value) => handleChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input - Larger Touch Target */}
                <View style={tw`mb-5`}>
                  <Text style={[
                    tw`text-base font-semibold mb-3`,
                    { color: textPrimary }
                  ]}>
                    Password
                  </Text>
                  <View style={tw`relative`}>
                    <View style={tw`absolute left-5 top-0 bottom-0 justify-center z-10`}>
                      <PasswordIcon size={20} color={placeholderColor} />
                    </View>
                    <TextInput
                      style={[
                        tw`w-full pl-14 pr-14 py-4 rounded-2xl border text-base`,
                        {
                          backgroundColor: inputBg,
                          borderColor: inputBorder,
                          color: textPrimary,
                          minHeight: 56, // Larger touch target
                        }
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor={placeholderColor}
                      value={formData.password}
                      onChangeText={(value) => handleChange('password', value)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={tw`absolute right-5 top-0 bottom-0 justify-center`}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <EyeOffIcon size={20} color={placeholderColor} />
                      ) : (
                        <EyeIcon size={20} color={placeholderColor} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

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
                        backgroundColor: formData.remember ? '#9A3412' : 'transparent',
                        borderColor: formData.remember ? '#9A3412' : (isDark ? '#4B5563' : '#D1D5DB'),
                      }
                    ]}>
                      {formData.remember && (
                        <Text style={tw`text-white text-xs font-bold`}>✓</Text>
                      )}
                    </View>
                    <Text style={[
                      tw`text-base font-medium`,
                      { color: textPrimary }
                    ]}>
                      Remember me
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={tw`text-base font-semibold text-orange-800`}>
                      Forgot?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button - Large Mobile Button - No Shadow */}
                <TouchableOpacity
                  onPress={submitForm}
                  disabled={processing || !formData.email || !formData.password}
                  activeOpacity={0.8}
                  style={[
                    tw`w-full py-4 rounded-2xl items-center justify-center mb-6`,
                    {
                      backgroundColor: '#9A3412',
                      opacity: (processing || !formData.email || !formData.password) ? 0.6 : 1,
                      minHeight: 56, // Large touch target
                    }
                  ]}
                >
                  {processing ? (
                    <View style={tw`flex-row items-center`}>
                      <ActivityIndicator color="#fff" size="small" style={tw`mr-3`} />
                      <Text style={tw`text-white font-bold text-lg`}>
                        Signing in...
                      </Text>
                    </View>
                  ) : (
                    <Text style={tw`text-white font-bold text-lg`}>
                      Sign In
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Sign Up Link - Better Spacing */}
                <View style={[
                  tw`pt-6 border-t items-center`,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' }
                ]}>
                  <Text style={[
                    tw`text-base text-center`,
                    { color: textSecondary }
                  ]}>
                    Don't have an account?{' '}
                    <Text style={tw`font-bold text-orange-800`}>
                      Sign Up
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
