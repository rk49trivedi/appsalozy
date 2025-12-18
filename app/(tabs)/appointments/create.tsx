import { Input, Text } from '@/components/atoms';
import { DatePicker } from '@/components/molecules';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Seat {
  id: number;
  name: string;
}

interface Staff {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface FormData {
  services: Service[];
  customers: Customer[];
  seats: Seat[];
  staff: Staff[];
}

export default function CreateAppointmentScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [user_id, setUserId] = useState<string>('');
  const [appointment_date, setAppointmentDate] = useState<string>('');
  const [appointment_time, setAppointmentTime] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [seat_id, setSeatId] = useState<string>('');
  const [staff_id, setStaffId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchFormData = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await apiClient.get<FormData>(API_ENDPOINTS.APPOINTMENT_FORM_DATA);
      
      if (response.success && response.data) {
        setFormData(response.data);
      } else {
        showToast.error('Failed to load form data', 'Error');
        router.back();
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await apiClient.logout();
        router.replace('/login');
        return;
      }
      showToast.error(apiError.message || 'Failed to load form data', 'Error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      fetchFormData();
    }
  }, [isAuthenticated, isChecking]);

  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setTempTime(selectedDate);
      setAppointmentTime(formatTime(selectedDate));
    }
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async () => {
    if (!user_id) {
      showToast.error('Please select a customer', 'Validation Error');
      return;
    }
    if (!appointment_date) {
      showToast.error('Please select an appointment date', 'Validation Error');
      return;
    }
    if (!appointment_time) {
      showToast.error('Please select an appointment time', 'Validation Error');
      return;
    }
    if (selectedServices.length === 0) {
      showToast.error('Please select at least one service', 'Validation Error');
      return;
    }

    try {
      setSubmitting(true);
      const services = selectedServices.map(id => ({ id }));
      const payload: any = {
        user_id: parseInt(user_id),
        appointment_date,
        appointment_time,
        services,
        notes: notes || null,
      };
      if (seat_id) {
        payload.seat_id = parseInt(seat_id);
      }
      if (staff_id) {
        payload.staff_id = parseInt(staff_id);
      }

      const response = await apiClient.post(API_ENDPOINTS.APPOINTMENT_CREATE, payload);
      
      if (response.success) {
        showToast.success(response.message || 'Appointment created successfully', 'Success');
        router.replace('/(tabs)/appointments');
      } else {
        showToast.error(response.message || 'Failed to create appointment', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to create appointment', 'Error');
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
        <Text style={tw`mt-4`} variant="secondary">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!formData) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center px-4`, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={tw`text-lg font-semibold mb-2`} variant="primary">Failed to load form data</Text>
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
        title="Create Appointment"
        showBackButton={true}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-4`}>
        <View style={tw`px-4 mt-4 gap-3`}>
          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Customer *
            </Text>
            <View style={tw`border rounded-xl overflow-hidden`} style={{ borderColor: colors.border }}>
              <View style={tw`bg-gray-100 px-3 py-2`}>
                <Text size="sm" variant="secondary">Select Customer</Text>
              </View>
              <ScrollView style={tw`max-h-40`}>
                {formData.customers.map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    onPress={() => setUserId(customer.id.toString())}
                    style={[
                      tw`px-4 py-3 border-b`,
                      { 
                        borderColor: colors.border,
                        backgroundColor: user_id === customer.id.toString() ? colors.secondaryBg : 'transparent'
                      }
                    ]}
                  >
                    <Text variant="primary" weight={user_id === customer.id.toString() ? 'bold' : 'normal'}>
                      {customer.name}
                    </Text>
                    <Text size="sm" variant="secondary">{customer.email}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Appointment Date *
            </Text>
            <DatePicker
              value={appointment_date}
              onChange={setAppointmentDate}
              placeholder="Select appointment date"
              label="Date"
            />
          </View>

          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Appointment Time *
            </Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={[
                tw`px-4 py-3 rounded-xl border`,
                { 
                  borderColor: colors.border,
                  backgroundColor: colors.secondaryBg
                }
              ]}
            >
              <Text variant={appointment_time ? 'primary' : 'secondary'}>
                {appointment_time || 'Select time'}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={true}
                onChange={handleTimeChange}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              />
            )}
          </View>

          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Services * (Select at least one)
            </Text>
            <View style={tw`gap-3`}>
              {formData.services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => handleServiceToggle(service.id)}
                  style={[
                    tw`flex-row items-center p-3 rounded-xl border`,
                    { 
                      borderColor: colors.border,
                      backgroundColor: selectedServices.includes(service.id) ? colors.secondaryBg : 'transparent'
                    }
                  ]}
                >
                  <View style={tw`flex-1`}>
                    <Text variant="primary" weight={selectedServices.includes(service.id) ? 'bold' : 'normal'}>
                      {service.name}
                    </Text>
                    <Text size="sm" variant="secondary">
                      ₹{service.price} • {service.duration_minutes} min
                    </Text>
                  </View>
                  <View style={[
                    tw`w-6 h-6 rounded border-2 items-center justify-center`,
                    { 
                      borderColor: selectedServices.includes(service.id) ? SalozyColors.primary.DEFAULT : colors.border,
                      backgroundColor: selectedServices.includes(service.id) ? SalozyColors.primary.DEFAULT : 'transparent'
                    }
                  ]}>
                    {selectedServices.includes(service.id) && (
                      <Text style={{ color: '#FFFFFF' }}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Seat (Optional)
            </Text>
            <View style={tw`border rounded-xl overflow-hidden`} style={{ borderColor: colors.border }}>
              <View style={tw`bg-gray-100 px-3 py-2`}>
                <Text size="sm" variant="secondary">Select Seat</Text>
              </View>
              <ScrollView style={tw`max-h-32`}>
                <TouchableOpacity
                  onPress={() => setSeatId('')}
                  style={[
                    tw`px-4 py-3 border-b`,
                    { 
                      borderColor: colors.border,
                      backgroundColor: !seat_id ? colors.secondaryBg : 'transparent'
                    }
                  ]}
                >
                  <Text variant="primary" weight={!seat_id ? 'bold' : 'normal'}>None</Text>
                </TouchableOpacity>
                {formData.seats.map((seat) => (
                  <TouchableOpacity
                    key={seat.id}
                    onPress={() => setSeatId(seat.id.toString())}
                    style={[
                      tw`px-4 py-3 border-b`,
                      { 
                        borderColor: colors.border,
                        backgroundColor: seat_id === seat.id.toString() ? colors.secondaryBg : 'transparent'
                      }
                    ]}
                  >
                    <Text variant="primary" weight={seat_id === seat.id.toString() ? 'bold' : 'normal'}>
                      {seat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Staff (Optional)
            </Text>
            <View style={tw`border rounded-xl overflow-hidden`} style={{ borderColor: colors.border }}>
              <View style={tw`bg-gray-100 px-3 py-2`}>
                <Text size="sm" variant="secondary">Select Staff</Text>
              </View>
              <ScrollView style={tw`max-h-32`}>
                <TouchableOpacity
                  onPress={() => setStaffId('')}
                  style={[
                    tw`px-4 py-3 border-b`,
                    { 
                      borderColor: colors.border,
                      backgroundColor: !staff_id ? colors.secondaryBg : 'transparent'
                    }
                  ]}
                >
                  <Text variant="primary" weight={!staff_id ? 'bold' : 'normal'}>None</Text>
                </TouchableOpacity>
                {formData.staff.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setStaffId(s.id.toString())}
                    style={[
                      tw`px-4 py-3 border-b`,
                      { 
                        borderColor: colors.border,
                        backgroundColor: staff_id === s.id.toString() ? colors.secondaryBg : 'transparent'
                      }
                    ]}
                  >
                    <Text variant="primary" weight={staff_id === s.id.toString() ? 'bold' : 'normal'}>
                      {s.name}
                    </Text>
                    <Text size="sm" variant="secondary">{s.email}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Notes (Optional)
            </Text>
            <Input
              placeholder="Add any additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              containerStyle={tw`mb-0`}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              tw`px-6 py-4 rounded-xl`,
              { 
                backgroundColor: submitting ? colors.secondaryBg : SalozyColors.primary.DEFAULT
              }
            ]}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text size="lg" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                Create Appointment
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

