import { Button, Card, Text } from '@/components/atoms';
import { Logo } from '@/components/atoms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';
import tw from 'twrnc';

// Success Icon
function CheckCircleIcon({ size = 64, color = '#10B981' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </Svg>
  );
}

// Error Icon
function XCircleIcon({ size = 64, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </Svg>
  );
}

export default function VerifyEmailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const params = useLocalSearchParams<{ token?: string; email?: string }>();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = params.token;
      const email = params.email;

      if (!token || !email) {
        setStatus('error');
        setError('Invalid verification link. Missing token or email.');
        setMessage('Verification Failed');
        return;
      }

      try {
        const response = await apiClient.verifyEmail(token, email);

        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email verified successfully! You can now log in.');
          
          // Show success toast
          showToast.success('Email verified successfully!', 'Success');

          // Navigate to login after a delay with success message from API
          setTimeout(() => {
            router.replace({
              pathname: '/login',
              params: { 
                message: response.message || 'Email verified successfully! You can now log in.',
                messageType: 'success',
              },
            });
          }, 2000);
        } else {
          setStatus('error');
          setError(response.message || 'Verification failed. Please try again.');
          setMessage('Verification Failed');
        }
      } catch (err: any) {
        const apiError = err as ApiError;
        setStatus('error');
        const errorMessage = apiError.message || 'Verification failed. Please try again.';
        setError(errorMessage);
        setMessage('Verification Failed');
        showToast.error(errorMessage, 'Verification Failed');
      }
    };

    verifyEmail();
  }, [params.token, params.email]);

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
              <Logo size={96} style={tw`mb-6`} />

              {/* Status Card */}
              <Card style={tw`w-full`}>
                <View style={tw`items-center`}>
                  {status === 'verifying' && (
                    <>
                      <ActivityIndicator 
                        size="large" 
                        color={SalozyColors.primary.DEFAULT} 
                        style={tw`mb-6`}
                      />
                      <Text size="xl" weight="bold" style={tw`mb-2 text-center`}>
                        Verifying Email
                      </Text>
                      <Text size="base" variant="secondary" style={tw`text-center`}>
                        {message}
                      </Text>
                    </>
                  )}

                  {status === 'success' && (
                    <>
                      <CheckCircleIcon size={64} color="#10B981" style={tw`mb-6`} />
                      <Text size="xl" weight="bold" style={tw`mb-2 text-center`}>
                        Email Verified!
                      </Text>
                      <Text size="base" variant="secondary" style={tw`text-center mb-6`}>
                        {message}
                      </Text>
                      <Text size="sm" variant="secondary" style={tw`text-center`}>
                        Redirecting to login...
                      </Text>
                    </>
                  )}

                  {status === 'error' && (
                    <>
                      <XCircleIcon size={64} color="#EF4444" style={tw`mb-6`} />
                      <Text size="xl" weight="bold" style={tw`mb-2 text-center`}>
                        {message}
                      </Text>
                      <Text size="base" variant="secondary" style={tw`text-center mb-6`}>
                        {error}
                      </Text>
                      <Button
                        onPress={() => router.replace('/login')}
                        fullWidth
                        style={tw`mb-4`}
                      >
                        Go to Login
                      </Button>
                      <Text 
                        size="sm" 
                        variant="secondary" 
                        style={tw`text-center`}
                      >
                        If you didn't receive a verification email, please check your spam folder or contact support.
                      </Text>
                    </>
                  )}
                </View>
              </Card>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

