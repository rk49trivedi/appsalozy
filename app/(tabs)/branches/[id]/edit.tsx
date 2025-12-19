import { EmailIcon, Input, Text } from '@/components/atoms';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  allow_staff?: boolean;
  currency_symbol?: string;
  currency_text?: string;
  branch_user?: {
    name: string;
    email: string;
  };
}

export default function EditBranchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [currencyText, setCurrencyText] = useState('INR');
  const [isActive, setIsActive] = useState(true);
  const [allowStaff, setAllowStaff] = useState(false);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchBranch = async () => {
    if (!isAuthenticated || !id) return;

    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: { branch: Branch } }>(
        API_ENDPOINTS.BRANCH_BY_ID(id)
      );
      
      if (response.success && response.data) {
        const data = response.data.branch;
        setBranch(data);
        setName(data.name);
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setCurrencySymbol(data.currency_symbol || '₹');
        setCurrencyText(data.currency_text || 'INR');
        setIsActive(data.is_active);
        setAllowStaff(data.allow_staff || false);
      } else {
        showToast.error('Failed to load branch', 'Error');
        router.back();
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await apiClient.logout();
        router.replace('/login');
        return;
      }
      showToast.error(apiError.message || 'Failed to load branch', 'Error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isChecking && id) {
      fetchBranch();
    }
  }, [isAuthenticated, isChecking, id]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast.error('Branch name is required', 'Validation Error');
      return;
    }
    if (!address.trim()) {
      showToast.error('Address is required', 'Validation Error');
      return;
    }
    if (!phone.trim()) {
      showToast.error('Phone is required', 'Validation Error');
      return;
    }
    if (!email.trim()) {
      showToast.error('Email is required', 'Validation Error');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      showToast.error('Password must be at least 6 characters', 'Validation Error');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        currency_symbol: currencySymbol,
        currency_text: currencyText,
        is_active: isActive,
        allow_staff: allowStaff,
      };
      
      if (newPassword) {
        payload.new_password = newPassword;
      }

      const response = await apiClient.put(API_ENDPOINTS.BRANCH_UPDATE(id), payload);

      if (response.success) {
        showToast.success(response.message || 'Branch updated successfully', 'Success');
        router.back();
      } else {
        showToast.error(response.message || 'Failed to update branch', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 422) {
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to update branch', 'Error');
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

  if (loading && !branch) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Loading branch...</Text>
      </SafeAreaView>
    );
  }

  if (!branch) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center px-4`, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={tw`text-lg font-semibold mb-2`} variant="primary">Branch not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            tw`px-6 py-3 rounded-xl mt-4`,
            { backgroundColor: SalozyColors.primary.DEFAULT }
          ]}
        >
          <Text style={tw`text-white font-semibold`}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
      <GlobalHeader
        title="Edit Branch"
        subtitle={branch.name}
        showBackButton={true}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-20`}>
        <View style={tw`px-4 mt-2 gap-4`}>
          {/* Branch Name */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' }
              ]}>
                <Text size="base" weight="bold" style={{ color: SalozyColors.primary.DEFAULT }}>🏢</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Branch Name</Text>
                <Text size="xs" variant="secondary">Required field</Text>
              </View>
            </View>
            <Input
              placeholder="Enter branch name"
              value={name}
              onChangeText={setName}
              containerStyle={tw`mb-0`}
            />
          </View>

          {/* Address */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
              ]}>
                <Text size="base" weight="bold" style={{ color: SalozyColors.status.info }}>📍</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Address</Text>
                <Text size="xs" variant="secondary">Required field</Text>
              </View>
            </View>
            <Input
              placeholder="Enter branch address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
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
                <Text size="base" weight="bold" style={{ color: SalozyColors.status.warning }}>📞</Text>
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

          {/* New Password (Optional) */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }
              ]}>
                <Text size="base" weight="bold" style={{ color: '#8B5CF6' }}>🔒</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">New Password</Text>
                <Text size="xs" variant="secondary">Optional (leave blank to keep current)</Text>
              </View>
            </View>
            <Input
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              containerStyle={tw`mb-0`}
            />
          </View>

          {/* Currency */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }
              ]}>
                <Text size="base" weight="bold" style={{ color: SalozyColors.status.success }}>₹</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Currency</Text>
                <Text size="xs" variant="secondary">Required field</Text>
              </View>
            </View>
            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1`}>
                <Input
                  label="Symbol"
                  placeholder="₹"
                  value={currencySymbol}
                  onChangeText={setCurrencySymbol}
                  containerStyle={tw`mb-0`}
                />
              </View>
              <View style={tw`flex-1`}>
                <Input
                  label="Text"
                  placeholder="INR"
                  value={currencyText}
                  onChangeText={setCurrencyText}
                  containerStyle={tw`mb-0`}
                />
              </View>
            </View>
          </View>

          {/* Status */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }
              ]}>
                <Text size="base" weight="bold" style={{ color: SalozyColors.status.success }}>✓</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Status</Text>
                <Text size="xs" variant="secondary">Branch availability</Text>
              </View>
            </View>
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                onPress={() => setIsActive(true)}
                style={[
                  tw`flex-1 px-4 py-3 rounded-xl border items-center`,
                  {
                    borderColor: isActive ? SalozyColors.status.success : colors.border,
                    backgroundColor: isActive 
                      ? (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)')
                      : 'transparent'
                  }
                ]}
              >
                <Text
                  weight={isActive ? 'bold' : 'semibold'}
                  style={{ color: isActive ? SalozyColors.status.success : colors.textPrimary }}
                >
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsActive(false)}
                style={[
                  tw`flex-1 px-4 py-3 rounded-xl border items-center`,
                  {
                    borderColor: !isActive ? colors.textSecondary : colors.border,
                    backgroundColor: !isActive 
                      ? colors.secondaryBg
                      : 'transparent'
                  }
                ]}
              >
                <Text
                  weight={!isActive ? 'bold' : 'semibold'}
                  style={{ color: !isActive ? colors.textSecondary : colors.textPrimary }}
                >
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Allow Staff */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View style={[
                  tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                  { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
                ]}>
                  <Text size="base" weight="bold" style={{ color: SalozyColors.status.info }}>👥</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text size="base" weight="bold" variant="primary">Allow Staff</Text>
                  <Text size="xs" variant="secondary">Enable staff management for this branch</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setAllowStaff(!allowStaff)}
                style={[
                  tw`w-12 h-6 rounded-full items-center justify-center`,
                  {
                    backgroundColor: allowStaff ? SalozyColors.status.success : colors.secondaryBg,
                    paddingHorizontal: 2,
                  }
                ]}
              >
                <View style={[
                  tw`w-5 h-5 rounded-full`,
                  {
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: allowStaff ? 20 : 0 }],
                  }
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              tw`px-6 py-4 rounded-2xl mt-2`,
              {
                backgroundColor: submitting ? colors.secondaryBg : SalozyColors.primary.DEFAULT,
                opacity: submitting ? 0.6 : 1
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
                Update Branch
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
