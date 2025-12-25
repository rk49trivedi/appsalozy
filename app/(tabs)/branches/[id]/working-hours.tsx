import { ClockIcon, Text } from '@/components/atoms';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface WorkingHour {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WorkingHoursScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'open' | 'close' | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchWorkingHours = async () => {
    if (!isAuthenticated || !id) return;

    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: WorkingHour[] }>(
        API_ENDPOINTS.BRANCH_WORKING_HOURS(id)
      );
      
      if (response.success && response.data) {
        setWorkingHours(response.data || []);
      } else {
        // Initialize with default working hours if none exist
        const defaultHours: WorkingHour[] = DAYS.map(day => ({
          day,
          open: '09:00',
          close: '18:00',
          is_closed: day === 'Sunday',
        }));
        setWorkingHours(defaultHours);
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to load working hours', 'Error');
      // Initialize with default working hours on error
      const defaultHours: WorkingHour[] = DAYS.map(day => ({
        day,
        open: '09:00',
        close: '18:00',
        is_closed: day === 'Sunday',
      }));
      setWorkingHours(defaultHours);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isChecking && id) {
      fetchWorkingHours();
    }
  }, [isAuthenticated, isChecking, id]);

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedDate && editingDay && editingType) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      setWorkingHours(prev => prev.map(wh => 
        wh.day === editingDay 
          ? { ...wh, [editingType]: timeString }
          : wh
      ));
    }
    if (Platform.OS === 'ios') {
      setShowTimePicker(false);
    }
    setEditingDay(null);
    setEditingType(null);
  };

  const openTimePicker = (day: string, type: 'open' | 'close') => {
    const currentHour = workingHours.find(wh => wh.day === day);
    if (currentHour) {
      const timeString = type === 'open' ? currentHour.open : currentHour.close;
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      setTempTime(date);
      setEditingDay(day);
      setEditingType(type);
      setShowTimePicker(true);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await apiClient.post(API_ENDPOINTS.BRANCH_SAVE_WORKING_HOURS(id), {
        working_hours: workingHours,
      });

      if (response.success) {
        showToast.success(response.message || 'Working hours saved successfully', 'Success');
        router.back();
      } else {
        showToast.error(response.message || 'Failed to save working hours', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 422) {
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to save working hours', 'Error');
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

  if (loading) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Loading working hours...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
      <GlobalHeader
        title="Working Hours"
        subtitle="Set branch working hours"
        showBackButton={true}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-20`}>
        <View style={tw`px-4 mt-2 gap-3`}>
          {workingHours.map((wh) => (
            <View
              key={wh.day}
              style={[
                tw`rounded-2xl p-4`,
                { backgroundColor: cardBg, borderWidth: 1, borderColor }
              ]}
            >
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                    { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)' }
                  ]}>
                    <ClockIcon size={20} color={SalozyColors.status.warning} />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text size="base" weight="bold" variant="primary">{wh.day}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setWorkingHours(prev => prev.map(h => 
                      h.day === wh.day ? { ...h, is_closed: !h.is_closed } : h
                    ));
                  }}
                  style={[
                    tw`w-12 h-6 rounded-full items-center justify-center`,
                    {
                      backgroundColor: wh.is_closed ? colors.secondaryBg : SalozyColors.status.success,
                      paddingHorizontal: 2,
                    }
                  ]}
                >
                  <View style={[
                    tw`w-5 h-5 rounded-full`,
                    {
                      backgroundColor: '#FFFFFF',
                      transform: [{ translateX: wh.is_closed ? 0 : 20 }],
                    }
                  ]} />
                </TouchableOpacity>
              </View>

              {!wh.is_closed && (
                <View style={tw`flex-row gap-3`}>
                  <TouchableOpacity
                    onPress={() => openTimePicker(wh.day, 'open')}
                    style={[
                      tw`flex-1 px-4 py-3 rounded-xl border items-center`,
                      { borderColor: colors.border, backgroundColor: colors.secondaryBg }
                    ]}
                  >
                    <Text size="xs" variant="secondary" style={tw`mb-1`}>Open</Text>
                    <Text size="sm" weight="bold" variant="primary">{wh.open}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openTimePicker(wh.day, 'close')}
                    style={[
                      tw`flex-1 px-4 py-3 rounded-xl border items-center`,
                      { borderColor: colors.border, backgroundColor: colors.secondaryBg }
                    ]}
                  >
                    <Text size="xs" variant="secondary" style={tw`mb-1`}>Close</Text>
                    <Text size="sm" weight="bold" variant="primary">{wh.close}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

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
                  Saving...
                </Text>
              </View>
            ) : (
              <Text size="base" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                Save Working Hours
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
}
