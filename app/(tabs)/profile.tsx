import { Input, Text } from '@/components/atoms';
import { DatePicker } from '@/components/molecules';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  logo: string | null;
  profile: string | null;
  anniversary?: string | null;
  date_of_birth?: string | null;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const { isAuthenticated, isChecking, user: authUser, refreshUser } = useAuth(true);
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<string>('');
  const [address, setAddress] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [logoImageUri, setLogoImageUri] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<any>(null);
  const [logoImageFile, setLogoImageFile] = useState<any>(null);

  const [tabs, setTabs] = useState<'profile' | 'password'>('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      fetchProfile();
    }
  }, [isAuthenticated, isChecking]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ user: UserProfile; userRoles: string[] }>(API_ENDPOINTS.PROFILE);
      
      if (response.success && response.data) {
        const profileData = response.data.user;
        const roles = response.data.userRoles || [];
        
        setUser(profileData);
        setUserRoles(roles);
        setName(profileData.name || '');
        setEmail(profileData.email || '');
        setPhone(profileData.phone || '');
        setGender(profileData.gender || '');
        setAddress(profileData.address || '');
        setAnniversary(profileData.anniversary || '');
        setDateOfBirth(profileData.date_of_birth || '');
        setProfileImage(profileData.profile);
        setLogoImage(profileData.logo);
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await apiClient.logout();
        router.replace('/login');
        return;
      }
      showToast.error(apiError.message || 'Failed to load profile', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const isVendor = userRoles.some(role => role.toLowerCase().includes('vendor'));
  const isCustomer = userRoles.some(role => role.toLowerCase().includes('customer'));

  const pickImage = async (type: 'profile' | 'logo') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (type === 'profile') {
        setProfileImageUri(asset.uri);
        setProfileImageFile({
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });
      } else {
        setLogoImageUri(asset.uri);
        setLogoImageFile({
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'logo.jpg',
        });
      }
    }
  };

  const deleteImage = async (type: 'profile' | 'logo') => {
    Alert.alert(
      'Delete Image',
      `Are you sure you want to delete your ${type} image?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.delete(API_ENDPOINTS.PROFILE_DELETE_IMAGE, { type });
              
              if (response.success) {
                showToast.success(response.message || `${type} deleted successfully`, 'Success');
                if (type === 'profile') {
                  setProfileImage(null);
                  setProfileImageUri(null);
                  setProfileImageFile(null);
                } else {
                  setLogoImage(null);
                  setLogoImageUri(null);
                  setLogoImageFile(null);
                }
                await fetchProfile();
                if (refreshUser) {
                  await refreshUser();
                }
              } else {
                showToast.error(response.message || `Failed to delete ${type}`, 'Error');
              }
            } catch (err: any) {
              const apiError = err as ApiError;
              showToast.error(apiError.message || `Failed to delete ${type}`, 'Error');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      showToast.error('Name is required', 'Validation Error');
      return;
    }
    if (!email.trim()) {
      showToast.error('Email is required', 'Validation Error');
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      if (phone.trim()) {
        formData.append('phone', phone.trim());
      }
      if (gender) {
        formData.append('gender', gender);
      }
      if (address.trim()) {
        formData.append('address', address.trim());
      }
      
      if (isCustomer) {
        if (anniversary) {
          formData.append('anniversary', anniversary);
        }
        if (dateOfBirth) {
          formData.append('date_of_birth', dateOfBirth);
        }
      }
      
      if (profileImageFile) {
        // React Native FormData requires specific format
        formData.append('profile', {
          uri: profileImageFile.uri,
          type: profileImageFile.type || 'image/jpeg',
          name: profileImageFile.name || 'profile.jpg',
        } as any);
      }
      
      if (logoImageFile && isVendor) {
        // React Native FormData requires specific format
        formData.append('logo', {
          uri: logoImageFile.uri,
          type: logoImageFile.type || 'image/jpeg',
          name: logoImageFile.name || 'logo.jpg',
        } as any);
      }

      const response = await apiClient.putFormData(API_ENDPOINTS.PROFILE_UPDATE, formData);
      
      if (response.success) {
        showToast.success(response.message || 'Profile updated successfully', 'Success');
        setProfileImageFile(null);
        setLogoImageFile(null);
        await fetchProfile();
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        showToast.error(response.message || 'Failed to update profile', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 422) {
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to update profile', 'Error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword) {
      showToast.error('Current password is required', 'Validation Error');
      return;
    }
    if (!newPassword) {
      showToast.error('New password is required', 'Validation Error');
      return;
    }
    if (newPassword.length < 8) {
      showToast.error('Password must be at least 8 characters', 'Validation Error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.error('Password confirmation does not match', 'Validation Error');
      return;
    }

    try {
      setUpdatingPassword(true);
      const response = await apiClient.put(API_ENDPOINTS.PROFILE_PASSWORD, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      
      if (response.success) {
        showToast.success(response.message || 'Password updated successfully', 'Success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast.error(response.message || 'Failed to update password', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 422) {
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to update password', 'Error');
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (isChecking || loading) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const displayProfileImage = profileImageUri || profileImage;
  const displayLogoImage = logoImageUri || logoImage;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
      <GlobalHeader
        title="Profile"
        subtitle="Update your account details"
        showBackButton={true}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-6`} showsVerticalScrollIndicator={false}>
        <View style={tw`px-4 mt-4 gap-4`}>
          {/* Tabs */}
          <View style={[
            tw`rounded-2xl p-1`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row`}>
              <TouchableOpacity
                onPress={() => setTabs('profile')}
                style={[
                  tw`flex-1 py-3 rounded-xl items-center`,
                  tabs === 'profile' && { backgroundColor: SalozyColors.primary.DEFAULT }
                ]}
              >
                <Text
                  weight={tabs === 'profile' ? 'bold' : 'semibold'}
                  style={{ color: tabs === 'profile' ? '#FFFFFF' : textPrimary }}
                >
                  Profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTabs('password')}
                style={[
                  tw`flex-1 py-3 rounded-xl items-center`,
                  tabs === 'password' && { backgroundColor: SalozyColors.primary.DEFAULT }
                ]}
              >
                <Text
                  weight={tabs === 'password' ? 'bold' : 'semibold'}
                  style={{ color: tabs === 'password' ? '#FFFFFF' : textPrimary }}
                >
                  Password
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {tabs === 'profile' ? (
            <>
              {/* Logo Upload (Vendor Only) */}
              {isVendor && (
                <View style={[
                  tw`rounded-2xl p-5`,
                  { backgroundColor: cardBg, borderWidth: 1, borderColor }
                ]}>
                  <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
                    Logo
                  </Text>
                  <View style={tw`items-center`}>
                    <View style={tw`relative`}>
                      {displayLogoImage ? (
                        <Image
                          source={{ uri: displayLogoImage }}
                          style={tw`w-28 h-28 rounded-full border-2`}
                        />
                      ) : (
                        <View style={[
                          tw`w-28 h-28 rounded-full border-2 items-center justify-center`,
                          { backgroundColor: colors.secondaryBg, borderColor: borderColor }
                        ]}>
                          <Text style={[tw`text-4xl font-bold`, { color: textSecondary }]}>
                            {name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => pickImage('logo')}
                        style={[
                          tw`absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center`,
                          { backgroundColor: SalozyColors.primary.DEFAULT }
                        ]}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 18 }}>+</Text>
                      </TouchableOpacity>
                      {displayLogoImage && (
                        <TouchableOpacity
                          onPress={() => deleteImage('logo')}
                          style={[
                            tw`absolute top-0 right-0 w-10 h-10 rounded-full items-center justify-center`,
                            { backgroundColor: SalozyColors.status.error }
                          ]}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text size="xs" variant="secondary" style={tw`mt-2 text-center`}>
                      Upload 250 x 250 pixels Square logo
                    </Text>
                  </View>
                </View>
              )}

              {/* Profile Image */}
              <View style={[
                tw`rounded-2xl p-5`,
                { backgroundColor: cardBg, borderWidth: 1, borderColor }
              ]}>
                <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
                  Profile Image
                </Text>
                <View style={tw`items-center`}>
                  <View style={tw`relative`}>
                    {displayProfileImage ? (
                      <Image
                        source={{ uri: displayProfileImage }}
                        style={tw`w-28 h-28 rounded-full border-2`}
                      />
                    ) : (
                      <View style={[
                        tw`w-28 h-28 rounded-full border-2 items-center justify-center`,
                        { backgroundColor: colors.secondaryBg, borderColor: borderColor }
                      ]}>
                        <Text style={[tw`text-4xl font-bold`, { color: textSecondary }]}>
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => pickImage('profile')}
                      style={[
                        tw`absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center`,
                        { backgroundColor: SalozyColors.primary.DEFAULT }
                      ]}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 18 }}>+</Text>
                    </TouchableOpacity>
                    {displayProfileImage && (
                      <TouchableOpacity
                        onPress={() => deleteImage('profile')}
                        style={[
                          tw`absolute top-0 right-0 w-10 h-10 rounded-full items-center justify-center`,
                          { backgroundColor: SalozyColors.status.error }
                        ]}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 16 }}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Personal Information */}
              <View style={[
                tw`rounded-2xl p-5`,
                { backgroundColor: cardBg, borderWidth: 1, borderColor }
              ]}>
                <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
                  General Information
                </Text>
                <View style={tw`gap-4`}>
                  <Input
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    required
                  />
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    required
                  />
                  <Input
                    label="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                  <View>
                    <Text style={[tw`mb-2`, { color: textPrimary }]}>Gender</Text>
                    <View style={tw`flex-row gap-3`}>
                      {['male', 'female', 'other'].map((g) => (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setGender(g)}
                          style={[
                            tw`flex-1 px-4 py-3 rounded-xl border items-center`,
                            {
                              borderColor: gender === g ? SalozyColors.primary.DEFAULT : borderColor,
                              backgroundColor: gender === g ? SalozyColors.primary.DEFAULT + '20' : 'transparent'
                            }
                          ]}
                        >
                          <Text
                            weight={gender === g ? 'bold' : 'semibold'}
                            style={{ color: gender === g ? SalozyColors.primary.DEFAULT : textPrimary }}
                          >
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <Input
                    label="Address"
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your address"
                    multiline
                    numberOfLines={3}
                  />
                  
                  {/* Customer-specific fields */}
                  {isCustomer && (
                    <>
                      <DatePicker
                        label="Anniversary"
                        value={anniversary}
                        onChange={setAnniversary}
                        placeholder="Select anniversary date"
                      />
                      <DatePicker
                        label="Date of Birth"
                        value={dateOfBirth}
                        onChange={setDateOfBirth}
                        placeholder="Select date of birth"
                        maximumDate={new Date()}
                      />
                    </>
                  )}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                style={[
                  tw`px-6 py-4 rounded-xl mt-2`,
                  {
                    backgroundColor: submitting ? SalozyColors.primary.DEFAULT : SalozyColors.primary.DEFAULT,
                    opacity: submitting ? 0.6 : 1
                  }
                ]}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <View style={tw`flex-row items-center justify-center`}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={tw`mr-2`} />
                    <Text size="lg" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                      Processing...
                    </Text>
                  </View>
                ) : (
                  <Text size="lg" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* Password Change Section */
            <View style={[
              tw`rounded-2xl p-5`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
                Change Password
              </Text>
              <View style={tw`gap-4`}>
                <View>
                  <Input
                    label="Current Password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    secureTextEntry={!showCurrentPassword}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                        <Text>{showCurrentPassword ? '👁️' : '👁️‍🗨️'}</Text>
                      </TouchableOpacity>
                    }
                  />
                </View>
                <View>
                  <Input
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showNewPassword}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                        <Text>{showNewPassword ? '👁️' : '👁️‍🗨️'}</Text>
                      </TouchableOpacity>
                    }
                  />
                </View>
                <View>
                  <Input
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Text>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                      </TouchableOpacity>
                    }
                  />
                </View>
                <TouchableOpacity
                  onPress={handlePasswordUpdate}
                  disabled={updatingPassword}
                  style={[
                    tw`px-6 py-4 rounded-xl mt-2`,
                    {
                      backgroundColor: updatingPassword ? SalozyColors.primary.DEFAULT : SalozyColors.primary.DEFAULT,
                      opacity: updatingPassword ? 0.6 : 1
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  {updatingPassword ? (
                    <View style={tw`flex-row items-center justify-center`}>
                      <ActivityIndicator size="small" color="#FFFFFF" style={tw`mr-2`} />
                      <Text size="lg" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                        Processing...
                      </Text>
                    </View>
                  ) : (
                    <Text size="lg" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                      Update Password
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
