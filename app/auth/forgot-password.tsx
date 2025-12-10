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

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [formData, setFormData] = useState({
    email: '',
  });

  const [processing, setProcessing] = useState(false);

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
      
      if (response.success) {
        showToast.success(
          response.message || 'Password reset link sent! Please check your email.',
          'Email Sent'
        );
        
        // Navigate back to login with success message
        setTimeout(() => {
          router.replace({
            pathname: '/login',
            params: {
              message: response.message || 'Password reset link has been sent to your email address.',
              messageType: 'success',
            },
          });
        }, 1500);
      } else {
        showToast.error(
          response.message || 'Failed to send reset link. Please try again.',
          'Error'
        );
      }
    } catch (err: any) {
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
                  Forgot Password?
                </Text>
                <Text
                  style={[
                    tw`mt-2 text-sm text-center`,
                    { color: '#78716C' }
                  ] as any}
                >
                  Enter your email address and we'll send you a link to reset your password
                </Text>
              </View>

              {/* Form */}
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

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={submitForm}
                  disabled={processing || !formData.email}
                  style={[
                    tw`w-full mt-4`,
                    {
                      opacity: processing || !formData.email ? 0.6 : 1,
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
                    <Text style={[tw`font-bold text-sm`, { color: '#FFFFFF' }] as any}>
                      {processing ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={tw`py-8 items-center`}>
            <TouchableOpacity
              onPress={() => router.back()}
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
