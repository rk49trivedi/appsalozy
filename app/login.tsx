import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
    setProcessing(true);
    // TODO: Implement actual login logic
    setTimeout(() => {
      setProcessing(false);
      // Navigate to tabs after successful login
      router.replace('/(tabs)');
    }, 1500);
  };

  const gradientColors = isDark 
    ? ['#111827', '#1F2937', '#111827'] 
    : ['#F9FAFB', '#FFFFFF', '#FEF3E2'];

  const cardBg = isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const cardBorder = isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)';
  const inputBg = isDark ? '#374151' : '#F9FAFB';
  const inputBorder = isDark ? '#4B5563' : '#E5E7EB';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const placeholderColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1`}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`flex-1`}
      >
        <ScrollView
          contentContainerStyle={tw`flex-grow justify-center px-6 py-10`}
          keyboardShouldPersistTaps="handled"
        >
          <View style={tw`w-full max-w-md self-center`}>
            {/* Main Card */}
            <View style={[
              tw`rounded-3xl p-8`,
              {
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor: cardBorder,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 10,
              }
            ]}>
              
              {/* Header Section */}
              <View style={tw`items-center mb-8`}>
                <View style={tw`mb-6`}>
                  <View style={tw`relative`}>
                    <View style={[
                      tw`absolute inset-0 rounded-2xl`,
                      { backgroundColor: 'rgba(154, 52, 18, 0.1)' }
                    ]} />
                    <View style={[
                      tw`w-20 h-20 bg-orange-800 rounded-2xl items-center justify-center`,
                      { backgroundColor: '#9A3412' }
                    ]}>
                      <Text style={tw`text-white text-2xl font-bold`}>S</Text>
                    </View>
                  </View>
                </View>

                <Text style={[
                  tw`text-3xl font-black mb-2 text-center`,
                  { color: textPrimary }
                ]}>
                  Welcome Back
                </Text>
                <Text style={[
                  tw`font-medium text-center`,
                  { color: textSecondary }
                ]}>
                  Sign in to your account to continue
                </Text>
              </View>

              {/* Form */}
              <View style={tw`gap-6`}>
                {/* Email Input */}
                <View style={tw`gap-2`}>
                  <Text style={[
                    tw`text-sm font-semibold`,
                    { color: textSecondary }
                  ]}>
                    Email Address
                  </Text>
                  <View style={tw`relative`}>
                    <View style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
                      <Text style={tw`text-lg`}>✉</Text>
                    </View>
                    <TextInput
                      style={[
                        tw`w-full pl-12 pr-4 py-3 rounded-2xl border`,
                        {
                          backgroundColor: inputBg,
                          borderColor: inputBorder,
                          color: textPrimary,
                        }
                      ]}
                      placeholder="Enter your email address"
                      placeholderTextColor={placeholderColor}
                      value={formData.email}
                      onChangeText={(value) => handleChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={tw`gap-2`}>
                  <Text style={[
                    tw`text-sm font-semibold`,
                    { color: textSecondary }
                  ]}>
                    Password
                  </Text>
                  <View style={tw`relative`}>
                    <View style={tw`absolute left-4 top-0 bottom-0 justify-center z-10`}>
                      <Text style={tw`text-lg`}>🔒</Text>
                    </View>
                    <TextInput
                      style={[
                        tw`w-full pl-12 pr-12 py-3 rounded-2xl border`,
                        {
                          backgroundColor: inputBg,
                          borderColor: inputBorder,
                          color: textPrimary,
                        }
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor={placeholderColor}
                      value={formData.password}
                      onChangeText={(value) => handleChange('password', value)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={tw`absolute right-4 top-0 bottom-0 justify-center`}
                    >
                      <Text style={tw`text-lg`}>
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={tw`flex-row justify-between items-center`}>
                  <TouchableOpacity
                    onPress={() => handleChange('remember', !formData.remember)}
                    style={tw`flex-row items-center`}
                  >
                    <View style={[
                      tw`w-4 h-4 border-2 rounded mr-3 items-center justify-center`,
                      {
                        backgroundColor: formData.remember ? '#9A3412' : 'transparent',
                        borderColor: formData.remember ? '#9A3412' : (isDark ? '#4B5563' : '#D1D5DB'),
                      }
                    ]}>
                      {formData.remember && (
                        <Text style={tw`text-white text-xs`}>✓</Text>
                      )}
                    </View>
                    <Text style={[
                      tw`text-sm font-medium`,
                      { color: textSecondary }
                    ]}>
                      Remember me
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={tw`text-sm font-semibold text-orange-800`}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  onPress={submitForm}
                  disabled={processing}
                  style={[
                    tw`w-full mt-8 px-6 py-3 rounded-2xl items-center justify-center`,
                    {
                      backgroundColor: '#9A3412',
                      opacity: processing ? 0.5 : 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5,
                    }
                  ]}
                >
                  {processing ? (
                    <View style={tw`flex-row items-center`}>
                      <ActivityIndicator color="#fff" size="small" style={tw`mr-3`} />
                      <Text style={tw`text-white font-bold text-base`}>
                        Signing in...
                      </Text>
                    </View>
                  ) : (
                    <View style={tw`flex-row items-center`}>
                      <Text style={tw`text-white font-bold text-base mr-2`}>→</Text>
                      <Text style={tw`text-white font-bold text-base`}>
                        Sign In
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View style={[
                tw`mt-8 pt-6 border-t`,
                { borderColor: isDark ? '#374151' : '#E5E7EB' }
              ]}>
                <Text style={[
                  tw`font-medium text-center`,
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
  );
}

