import { ClockIcon, Input, ServicesIcon, Text } from '@/components/atoms';
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

interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  gender: 'male' | 'female';
  is_active: boolean;
  reminder_after_service?: number;
  total_repeat_service?: number;
}

export default function EditServiceScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [reminderAfterService, setReminderAfterService] = useState('0');
  const [totalRepeatService, setTotalRepeatService] = useState('0');

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchService = async () => {
    if (!isAuthenticated || !id) return;

    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: Service }>(
        API_ENDPOINTS.SERVICE_BY_ID(id)
      );
      
      if (response.success && response.data) {
        const data = response.data;
        setService(data);
        setName(data.name);
        setDescription(data.description || '');
        setPrice(data.price.toString());
        setDurationMinutes(data.duration_minutes.toString());
        setGender(data.gender);
        setIsActive(data.is_active);
        setReminderAfterService((data.reminder_after_service || 0).toString());
        setTotalRepeatService((data.total_repeat_service || 0).toString());
      } else {
        showToast.error('Failed to load service', 'Error');
        router.back();
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await apiClient.logout();
        router.replace('/login');
        return;
      }
      showToast.error(apiError.message || 'Failed to load service', 'Error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isChecking && id) {
      fetchService();
    }
  }, [isAuthenticated, isChecking, id]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast.error('Service name is required', 'Validation Error');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      showToast.error('Price must be greater than 0', 'Validation Error');
      return;
    }
    if (!durationMinutes || parseInt(durationMinutes) < 5 || parseInt(durationMinutes) > 480) {
      showToast.error('Duration must be between 5 and 480 minutes', 'Validation Error');
      return;
    }
    if (!gender) {
      showToast.error('Gender is required', 'Validation Error');
      return;
    }
    if (parseInt(reminderAfterService) > 0 && (!totalRepeatService || parseInt(totalRepeatService) < 1)) {
      showToast.error('Total repeat service is required when reminder is set', 'Validation Error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.put(API_ENDPOINTS.SERVICE_UPDATE(id), {
        name: name.trim(),
        description: description.trim() || '',
        price: parseFloat(price),
        duration_minutes: parseInt(durationMinutes),
        gender,
        is_active: isActive,
        reminder_after_service: parseInt(reminderAfterService),
        total_repeat_service: parseInt(reminderAfterService) > 0 ? parseInt(totalRepeatService) : 0,
      });

      if (response.success) {
        showToast.success(response.message || 'Service updated successfully', 'Success');
        router.back();
      } else {
        showToast.error(response.message || 'Failed to update service', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 422) {
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to update service', 'Error');
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

  if (loading && !service) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Loading service...</Text>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center px-4`, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={tw`text-lg font-semibold mb-2`} variant="primary">Service not found</Text>
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
        title="Edit Service"
        subtitle={service.name}
        showBackButton={true}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-20`}>
        <View style={tw`px-4 mt-2 gap-4`}>
          {/* Service Name */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }
              ]}>
                <ServicesIcon size={20} color={SalozyColors.status.success} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Service Name</Text>
                <Text size="xs" variant="secondary">Required field</Text>
              </View>
            </View>
            <Input
              placeholder="Enter service name"
              value={name}
              onChangeText={setName}
              containerStyle={tw`mb-0`}
            />
          </View>

          {/* Description */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)' }
              ]}>
                <Text size="base" weight="bold" variant="secondary">📝</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Description</Text>
                <Text size="xs" variant="secondary">Optional</Text>
              </View>
            </View>
            <Input
              placeholder="Enter service description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              containerStyle={tw`mb-0`}
            />
          </View>

          {/* Price */}
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
                <Text size="base" weight="bold" variant="primary">Price</Text>
                <Text size="xs" variant="secondary">Required field</Text>
              </View>
            </View>
            <Input
              placeholder="Enter price"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              containerStyle={tw`mb-0`}
            />
          </View>

          {/* Duration */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)' }
              ]}>
                <ClockIcon size={20} color={SalozyColors.status.warning} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Duration (Minutes)</Text>
                <Text size="xs" variant="secondary">Required field (5-480 minutes)</Text>
              </View>
            </View>
            <Input
              placeholder="Enter duration in minutes"
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
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
                <Text size="base" weight="bold" style={{ color: '#8B5CF6' }}>👤</Text>
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

          {/* Reminder Settings */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
              ]}>
                <ClockIcon size={20} color={SalozyColors.status.info} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">Reminder Settings</Text>
                <Text size="xs" variant="secondary">Optional</Text>
              </View>
            </View>
            <View style={tw`gap-3`}>
              <Input
                label="Reminder After Service (Days)"
                placeholder="Enter days (0 to disable)"
                value={reminderAfterService}
                onChangeText={setReminderAfterService}
                keyboardType="number-pad"
                containerStyle={tw`mb-0`}
              />
              {parseInt(reminderAfterService) > 0 && (
                <Input
                  label="Total Repeat Service"
                  placeholder="Enter number of repeats"
                  value={totalRepeatService}
                  onChangeText={setTotalRepeatService}
                  keyboardType="number-pad"
                  containerStyle={tw`mb-0`}
                />
              )}
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
                <Text size="xs" variant="secondary">Service availability</Text>
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
                Update Service
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
