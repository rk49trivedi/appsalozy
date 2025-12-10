import { getThemeColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
                  Create Vendor Account
                </Text>
                <Text
                  style={[
                    tw`mt-2 text-sm text-center`,
                    { color: '#78716C' }
                  ] as any}
                >
                  Start your business journey with our comprehensive salon management platform
                </Text>
              </View>

              {/* Form */}
              <View>
                {/* Name Input */}
                <View style={tw`mb-5`}>
                  <Text style={[tw`text-xs font-semibold mb-1.5 ml-1`, { color: '#78716C' }] as any}>
                    Full Name
                  </Text>
                  <View style={tw`relative`}>
                    <View style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
                      <MaterialIcons name="person" size={18} color="#A8A29E" />
                    </View>
                    <TextInput
                      style={[
                        tw`w-full bg-white border rounded-xl py-3.5 pl-11 pr-4 text-sm`,
                        {
                          borderColor: errors.name ? '#EF4444' : '#E7E5E4',
                          color: '#1C1917',
                          fontSize: 14,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }
                      ]}
                      placeholder="Enter your full name"
                      placeholderTextColor="#A8A29E"
                      value={formData.name}
                      onChangeText={(value) => handleChange('name', value)}
                      autoCapitalize="words"
                      autoComplete="name"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.name && (
                    <Text style={[tw`text-xs mt-1 ml-1`, { color: '#EF4444' }] as any}>
                      {errors.name}
                    </Text>
                  )}
                </View>

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
                          borderColor: errors.email ? '#EF4444' : '#E7E5E4',
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
                  {errors.email && (
                    <Text style={[tw`text-xs mt-1 ml-1`, { color: '#EF4444' }] as any}>
                      {errors.email}
                    </Text>
                  )}
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
                          borderColor: errors.password ? '#EF4444' : '#E7E5E4',
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
                      autoComplete="password-new"
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
                  {errors.password && (
                    <Text style={[tw`text-xs mt-1 ml-1`, { color: '#EF4444' }] as any}>
                      {errors.password}
                    </Text>
                  )}
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
                          borderColor: errors.password_confirmation ? '#EF4444' : '#E7E5E4',
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
                      value={formData.password_confirmation}
                      onChangeText={(value) => handleChange('password_confirmation', value)}
                      secureTextEntry={!showPasswordConfirmation}
                      autoCapitalize="none"
                      autoComplete="password-new"
                      autoCorrect={false}
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
                  {errors.password_confirmation && (
                    <Text style={[tw`text-xs mt-1 ml-1`, { color: '#EF4444' }] as any}>
                      {errors.password_confirmation}
                    </Text>
                  )}
                </View>

                {/* Business Information Section */}
                <View style={[
                  tw`p-4 rounded-2xl mb-5`,
                  { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.1)' : 'rgba(255, 247, 237, 0.8)' }
                ]}>
                  <Text 
                    style={[
                      tw`text-lg font-bold mb-2`,
                      { color: '#0C0A09' }
                    ] as any}
                  >
                    Business Information
                  </Text>
                  <Text 
                    style={[
                      tw`text-sm mb-4`,
                      { color: '#78716C' }
                    ] as any}
                  >
                    Please provide your business details
                  </Text>

                  {/* Company Name Input */}
                  <View style={tw`mb-4`}>
                    <Text style={[tw`text-xs font-semibold mb-1.5 ml-1`, { color: '#78716C' }] as any}>
                      Company Name
                    </Text>
                    <View style={tw`relative`}>
                      <View style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
                        <MaterialIcons name="business" size={18} color="#A8A29E" />
                      </View>
                      <TextInput
                        style={[
                          tw`w-full bg-white border rounded-xl py-3.5 pl-11 pr-4 text-sm`,
                          {
                            borderColor: errors.company_name ? '#EF4444' : '#E7E5E4',
                            color: '#1C1917',
                            fontSize: 14,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                          }
                        ]}
                        placeholder="Enter your company name"
                        placeholderTextColor="#A8A29E"
                        value={formData.company_name}
                        onChangeText={(value) => handleChange('company_name', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                    {errors.company_name && (
                      <Text style={[tw`text-xs mt-1 ml-1`, { color: '#EF4444' }] as any}>
                        {errors.company_name}
                      </Text>
                    )}
                  </View>

                  {/* Company Domain Input */}
                  <View style={tw`mb-2`}>
                    <Text style={[tw`text-xs font-semibold mb-1.5 ml-1`, { color: '#78716C' }] as any}>
                      Company Domain
                    </Text>
                    <View style={tw`relative`}>
                      <View style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
                        <MaterialIcons name="language" size={18} color="#A8A29E" />
                      </View>
                      <TextInput
                        style={[
                          tw`w-full bg-white border rounded-xl py-3.5 pl-11 pr-4 text-sm`,
                          {
                            borderColor: errors.company_domain ? '#EF4444' : '#E7E5E4',
                            color: '#1C1917',
                            fontSize: 14,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                          }
                        ]}
                        placeholder="Enter your domain"
                        placeholderTextColor="#A8A29E"
                        value={formData.company_domain}
                        onChangeText={(value) => handleChange('company_domain', value)}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    {errors.company_domain && (
                      <Text style={[tw`text-xs mt-1 ml-1`, { color: '#EF4444' }] as any}>
                        {errors.company_domain}
                      </Text>
                    )}
                  </View>

                  {/* Domain Preview */}
                  <View style={[
                    tw`p-3 rounded-xl mt-2`,
                    { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 246, 255, 0.8)' }
                  ]}>
                    <Text style={[tw`text-sm font-semibold mb-1`, { color: '#0C0A09' }] as any}>
                      Your subdomain:
                    </Text>
                    <Text
                      style={[
                        tw`text-sm font-mono px-2 py-1 rounded`,
                        {
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)',
                          color: isDark ? '#93C5FD' : '#1E40AF',
                        }
                      ] as any}
                    >
                      {fullDomain}
                    </Text>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={submitForm}
                  disabled={processing}
                  style={[
                    tw`w-full mt-4`,
                    {
                      opacity: processing ? 0.6 : 1,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#9a3412', '#d5821d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={tw`w-full py-4 rounded-2xl items-center justify-center`}
                  >
                    <Text style={[tw`font-bold text-sm`, { color: '#FFFFFF' }] as any}>
                      {processing ? 'Creating Account...' : 'Create Vendor Account'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={tw`py-8 items-center`}>
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-xs text-center`, { color: '#78716C' }] as any}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/login')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[tw`text-xs font-bold`, { color: '#9a3412' }] as any}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
