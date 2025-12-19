import { CustomersIcon, EmailIcon, Input, Text } from '@/components/atoms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddCustomerModal({ visible, onClose, onSuccess }: AddCustomerModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

    try {
      setSubmitting(true);
      const response = await apiClient.post(API_ENDPOINTS.CUSTOMER_CREATE, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gender,
        address: address.trim() || null,
      });

      if (response.success) {
        showToast.success(response.message || 'Customer added successfully', 'Success');
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setGender('');
        setAddress('');
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showToast.error(response.message || 'Failed to add customer', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 422) {
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to add customer', 'Error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setName('');
      setEmail('');
      setPhone('');
      setGender('');
      setAddress('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: cardBg }]} edges={['top', 'bottom']}>
        <View style={tw`flex-1`}>
          {/* Header */}
          <View style={[tw`px-4 py-4 border-b flex-row items-center justify-between`, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <View style={tw`flex-row items-center flex-1`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' }
              ]}>
                <CustomersIcon size={20} color={SalozyColors.primary.DEFAULT} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="lg" weight="bold" variant="primary">Add Customer</Text>
                <Text size="sm" variant="secondary">Create a new customer</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={submitting}
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                { backgroundColor: colors.secondaryBg }
              ]}
            >
              <Text size="xl" variant="secondary">×</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={tw`flex-1`} 
            contentContainerStyle={tw`p-4 gap-4 pb-6`} 
            showsVerticalScrollIndicator={false}
          >
              {/* Name */}
              <View style={[
                tw`rounded-2xl p-4`,
                { backgroundColor: colors.secondaryBg, borderWidth: 1, borderColor: colors.border }
              ]}>
                <View style={tw`flex-row items-center mb-3`}>
                  <View style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                    { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' }
                  ]}>
                    <CustomersIcon size={20} color={SalozyColors.primary.DEFAULT} />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text size="base" weight="bold" variant="primary">Full Name</Text>
                    <Text size="xs" variant="secondary">Required field</Text>
                  </View>
                </View>
                <Input
                  placeholder="Enter customer name"
                  value={name}
                  onChangeText={setName}
                  leftIcon={<CustomersIcon size={20} color={colors.placeholder} />}
                  containerStyle={tw`mb-0`}
                />
              </View>

              {/* Email */}
              <View style={[
                tw`rounded-2xl p-4`,
                { backgroundColor: colors.secondaryBg, borderWidth: 1, borderColor: colors.border }
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
                { backgroundColor: colors.secondaryBg, borderWidth: 1, borderColor: colors.border }
              ]}>
                <View style={tw`flex-row items-center mb-3`}>
                  <View style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                    { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)' }
                  ]}>
                    <CustomersIcon size={20} color={SalozyColors.status.warning} />
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
                  leftIcon={<CustomersIcon size={20} color={colors.placeholder} />}
                  containerStyle={tw`mb-0`}
                />
              </View>

              {/* Gender */}
              <View style={[
                tw`rounded-2xl p-4`,
                { backgroundColor: colors.secondaryBg, borderWidth: 1, borderColor: colors.border }
              ]}>
                <View style={tw`flex-row items-center mb-3`}>
                  <View style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                    { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }
                  ]}>
                    <CustomersIcon size={20} color="#8B5CF6" />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text size="base" weight="bold" variant="primary">Gender</Text>
                    <Text size="xs" variant="secondary">Required field</Text>
                  </View>
                </View>
                <View style={tw`flex-row gap-3`}>
                  {(['male', 'female'] as const).map((g) => (
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
                { backgroundColor: colors.secondaryBg, borderWidth: 1, borderColor: colors.border }
              ]}>
                <View style={tw`flex-row items-center mb-3`}>
                  <View style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                    { backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)' }
                  ]}>
                    <CustomersIcon size={20} color={colors.textSecondary} />
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
                    Add Customer
                  </Text>
                )}
              </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
