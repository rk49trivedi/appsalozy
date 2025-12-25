import { EmailIcon, Input, PasswordIcon, StaffIcon, Text } from '@/components/atoms';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

export default function CreateStaffScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast.error('Name is required', 'Validation Error');
      return;
    }
    if (!email.trim()) {
      showToast.error('Email is required', 'Validation Error');
      return;
    }
    if (!phone.trim()) {
      showToast.error('Phone is required', 'Validation Error');
      return;
    }
    if (!gender) {
      showToast.error('Gender is required', 'Validation Error');
      return;
    }
    if (!password || password.length < 8) {
      showToast.error('Password must be at least 8 characters', 'Validation Error');
      return;
    }
    if (password !== passwordConfirmation) {
      showToast.error('Password confirmation does not match', 'Validation Error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post(API_ENDPOINTS.STAFF_CREATE, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gender,
        address: address.trim() || null,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (response.success) {
        showToast.success(response.message || 'Staff created successfully', 'Success');
        router.back();
      } else {
        showToast.error(response.message || 'Failed to create staff', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 422) {
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to create staff', 'Error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Checking authentication...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
      <GlobalHeader
        title="Create Staff"
        subtitle="Add a new staff member"
        showBackButton={true}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-20`}>
        <View style={tw`px-4 mt-2 gap-4`}>
          {/* Name */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' }
              ]}>
                <StaffIcon size={20} color={SalozyColors.primary.DEFAULT} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Full Name</Text>
                <Text size="xs" variant="secondary">Required field</Text>
              </View>
            </View>
            <Input
              placeholder="Enter staff name"
              value={name}
              onChangeText={setName}
              containerStyle={tw`mb-0`}
            />
          </View>

          {/* Email */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
              ]}>
                <EmailIcon size={20} color={SalozyColors.status.info} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Email</Text>
                <Text size="xs" variant="secondary">Required field</Text>
              </View>
            </View>
            <Input
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<EmailIcon size={20} color={colors.placeholder} />}
              containerStyle={tw`mb-0`}
            />
          </View>

          {/* Phone */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)' }
              ]}>
                <StaffIcon size={20} color={SalozyColors.status.warning} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Phone</Text>
                <Text size="xs" variant="secondary">Required field</Text>
              </View>
            </View>
            <Input
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              containerStyle={tw`mb-0`}
            />
          </View>

          {/* Gender */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }
              ]}>
                <StaffIcon size={20} color="#8B5CF6" />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Gender</Text>
                <Text size="xs" variant="secondary">Required field</Text>
              </View>
            </View>
            <View style={tw`flex-row gap-3`}>
              {(['male', 'female', 'other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  style={[
                    tw`flex-1 px-4 py-3 rounded-xl border items-center`,
                    {
                      borderColor: gender === g ? SalozyColors.primary.DEFAULT : colors.border,
                      backgroundColor: gender === g 
                        ? (isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)')
                        : 'transparent'
                    }
                  ]}
                >
                  <Text
                    weight={gender === g ? 'bold' : 'semibold'}
                    style={{ color: gender === g ? SalozyColors.primary.DEFAULT : colors.textPrimary }}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)' }
              ]}>
                <StaffIcon size={20} color={colors.textSecondary} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Address</Text>
                <Text size="xs" variant="secondary">Optional</Text>
              </View>
            </View>
            <Input
              placeholder="Enter address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              containerStyle={tw`mb-0`}
            />
          </View>

          {/* Password */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }
              ]}>
                <PasswordIcon size={20} color="#8B5CF6" />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Password</Text>
                <Text size="xs" variant="secondary">Required field (min 8 characters)</Text>
              </View>
            </View>
            <View style={tw`gap-3`}>
              <Input
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<PasswordIcon size={20} color={colors.placeholder} />}
                containerStyle={tw`mb-0`}
              />
              <Input
                placeholder="Confirm password"
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                secureTextEntry
                leftIcon={<PasswordIcon size={20} color={colors.placeholder} />}
                containerStyle={tw`mb-0`}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              tw`px-6 py-4 rounded-2xl mt-2`,
              {
                backgroundColor: SalozyColors.primary.DEFAULT,
                opacity: submitting ? 0.7 : 1
              }
            ]}
            activeOpacity={0.8}
          >
            {submitting ? (
              <View style={tw`flex-row items-center justify-center`}>
                <ActivityIndicator size="small" color="#FFFFFF" style={tw`mr-2`} />
                <Text size="base" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text size="base" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                Create Staff
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
