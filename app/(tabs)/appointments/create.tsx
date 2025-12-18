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

interface WorkingHour {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
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
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
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
  const [dayClosed, setDayClosed] = useState(false);
  const [workingHourError, setWorkingHourError] = useState<string>('');
  const [minTime, setMinTime] = useState<string>('00:00');
  const [maxTime, setMaxTime] = useState<string>('23:59');
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Customer selection modal
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showSeatPicker, setShowSeatPicker] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchFormData = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const [formResponse, workingHoursResponse] = await Promise.all([
        apiClient.get<FormData>(API_ENDPOINTS.APPOINTMENT_FORM_DATA),
        apiClient.get<{ workingHours: WorkingHour[] }>(API_ENDPOINTS.WORKING_HOURS),
      ]);
      
      if (formResponse.success && formResponse.data) {
        setFormData(formResponse.data);
      }
      
      if (workingHoursResponse.success && workingHoursResponse.data) {
        setWorkingHours(workingHoursResponse.data.workingHours || []);
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

  // Helper to get day name from date string (YYYY-MM-DD)
  const getDayName = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // When user changes date, update working hour info
  const handleDateChange = (date: string) => {
    setAppointmentDate(date);
    if (date) {
      const dayName = getDayName(date);
      setSelectedDay(dayName);
      const dayWorkingHour = workingHours.find((wh) => wh.day === dayName);
      
      if (dayWorkingHour) {
        if (dayWorkingHour.is_closed) {
          setDayClosed(true);
          setWorkingHourError(`The branch is closed on ${dayName}. You cannot create appointments for this day.`);
          setMinTime('00:00');
          setMaxTime('23:59');
          setAppointmentTime(''); // Clear time if day is closed
        } else {
          setDayClosed(false);
          setWorkingHourError('');
          setMinTime(dayWorkingHour.open);
          setMaxTime(dayWorkingHour.close);
        }
      } else {
        setDayClosed(true);
        setWorkingHourError(`No working hours found for ${dayName}.`);
        setMinTime('00:00');
        setMaxTime('23:59');
        setAppointmentTime(''); // Clear time if no working hours
      }
    }
  };

  // Validate date is today or later
  const validateDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  };

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
      const timeStr = formatTime(selectedDate);
      const [hours, mins] = timeStr.split(':').map(Number);
      const [minHours, minMins] = minTime.split(':').map(Number);
      const [maxHours, maxMins] = maxTime.split(':').map(Number);
      
      const selectedMinutes = hours * 60 + mins;
      const minMinutes = minHours * 60 + minMins;
      const maxMinutes = maxHours * 60 + maxMins;
      
      if (selectedMinutes < minMinutes || selectedMinutes > maxMinutes) {
        showToast.error(`Time must be between ${minTime} and ${maxTime}`, 'Invalid Time');
        return;
      }
      
      setTempTime(selectedDate);
      setAppointmentTime(timeStr);
    }
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getSelectedCustomer = () => {
    return formData?.customers.find(c => c.id.toString() === user_id);
  };

  const getSelectedSeat = () => {
    return formData?.seats.find(s => s.id.toString() === seat_id);
  };

  const getSelectedStaff = () => {
    return formData?.staff.find(s => s.id.toString() === staff_id);
  };

  const calculateTotalPrice = (): number => {
    if (!formData) return 0;
    return selectedServices.reduce((total, serviceId) => {
      const service = formData.services.find(s => s.id === serviceId);
      const price = service?.price ?? 0;
      return total + (typeof price === 'number' ? price : parseFloat(price) || 0);
    }, 0);
  };

  const handleSubmit = async () => {
    // Validation
    if (!user_id) {
      showToast.error('Please select a customer', 'Validation Error');
      return;
    }
    if (!appointment_date) {
      showToast.error('Please select an appointment date', 'Validation Error');
      return;
    }
    if (!validateDate(appointment_date)) {
      showToast.error('Appointment date must be today or later', 'Validation Error');
      return;
    }
    if (dayClosed) {
      showToast.error(workingHourError || 'Branch is closed on selected day', 'Validation Error');
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
      
      // Ensure time is in H:i format
      let formattedTime = appointment_time;
      if (formattedTime && formattedTime.includes(':')) {
        const timeParts = formattedTime.split(':');
        formattedTime = `${timeParts[0]}:${timeParts[1]}`;
      }
      
      // Ensure date is in YYYY-MM-DD format
      let formattedDate = appointment_date;
      if (formattedDate) {
        const dateObj = new Date(formattedDate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      }
      
      const services = selectedServices.map(id => ({ id }));
      const payload: any = {
        user_id: parseInt(user_id),
        appointment_date: formattedDate,
        appointment_time: formattedTime,
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
      if (apiError.status === 422) {
        // Validation errors from server
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to create appointment', 'Error');
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

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-6`} showsVerticalScrollIndicator={false}>
        <View style={tw`px-4 mt-4 gap-4`}>
          {/* Customer Selection */}
          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Customer <Text style={{ color: SalozyColors.status.error }}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCustomerPicker(true)}
              style={[
                tw`px-4 py-4 rounded-xl border flex-row items-center justify-between`,
                { 
                  borderColor: user_id ? SalozyColors.primary.DEFAULT : colors.border,
                  backgroundColor: colors.secondaryBg
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={tw`flex-1`}>
                {user_id ? (
                  <>
                    <Text variant="primary" weight="semibold">
                      {getSelectedCustomer()?.name}
                    </Text>
                    <Text size="sm" variant="secondary" style={tw`mt-1`}>
                      {getSelectedCustomer()?.email}
                    </Text>
                  </>
                ) : (
                  <Text variant="secondary">Select Customer</Text>
                )}
              </View>
              <Text size="lg" variant="secondary">▼</Text>
            </TouchableOpacity>
          </View>

          {/* Appointment Date */}
          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Appointment Date <Text style={{ color: SalozyColors.status.error }}>*</Text>
            </Text>
            <DatePicker
              value={appointment_date}
              onChange={handleDateChange}
              placeholder="Select appointment date"
              label=""
              minimumDate={new Date()}
            />
            {appointment_date && !validateDate(appointment_date) && (
              <Text size="sm" style={[tw`mt-2`, { color: SalozyColors.status.error }]}>
                Date must be today or later
              </Text>
            )}
          </View>

          {/* Appointment Time */}
          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Appointment Time <Text style={{ color: SalozyColors.status.error }}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (dayClosed) {
                  showToast.error(workingHourError || 'Branch is closed on selected day', 'Cannot Select Time');
                  return;
                }
                setShowTimePicker(true);
              }}
              disabled={dayClosed || !appointment_date}
              style={[
                tw`px-4 py-4 rounded-xl border flex-row items-center justify-between`,
                { 
                  borderColor: appointment_time ? SalozyColors.primary.DEFAULT : colors.border,
                  backgroundColor: colors.secondaryBg,
                  opacity: (dayClosed || !appointment_date) ? 0.5 : 1
                }
              ]}
              activeOpacity={0.7}
            >
              <Text variant={appointment_time ? 'primary' : 'secondary'} weight={appointment_time ? 'semibold' : 'normal'}>
                {appointment_time || 'Select time'}
              </Text>
              <Text size="lg" variant="secondary">🕐</Text>
            </TouchableOpacity>
            {workingHourError && (
              <Text size="sm" style={[tw`mt-2`, { color: SalozyColors.status.error }]}>
                {workingHourError}
              </Text>
            )}
            {appointment_date && !dayClosed && (
              <Text size="xs" style={[tw`mt-2`, { color: textSecondary }]}>
                Available time: {minTime} - {maxTime}
              </Text>
            )}
            {showTimePicker && (
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={true}
                onChange={handleTimeChange}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Services Selection */}
          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                Services <Text style={{ color: SalozyColors.status.error }}>*</Text>
              </Text>
              {selectedServices.length > 0 && (
                <View style={[
                  tw`px-3 py-1 rounded-full`,
                  { backgroundColor: SalozyColors.primary.DEFAULT + '20' }
                ]}>
                  <Text size="sm" weight="semibold" style={{ color: SalozyColors.primary.DEFAULT }}>
                    {selectedServices.length} selected
                  </Text>
                </View>
              )}
            </View>
            <View style={tw`gap-3`}>
              {formData.services.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => handleServiceToggle(service.id)}
                    style={[
                      tw`flex-row items-center p-4 rounded-xl border`,
                      { 
                        borderColor: isSelected ? SalozyColors.primary.DEFAULT : colors.border,
                        backgroundColor: isSelected ? SalozyColors.primary.DEFAULT + '10' : 'transparent'
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={tw`flex-1`}>
                      <Text variant="primary" weight={isSelected ? 'bold' : 'semibold'}>
                        {service.name}
                      </Text>
                      <View style={tw`flex-row items-center gap-3 mt-1`}>
                        <Text size="sm" variant="secondary">
                          ₹{(service.price || 0).toFixed(2)}
                        </Text>
                        <Text size="sm" variant="secondary">•</Text>
                        <Text size="sm" variant="secondary">
                          {service.duration_minutes || 0} min
                        </Text>
                      </View>
                    </View>
                    <View style={[
                      tw`w-7 h-7 rounded-full border-2 items-center justify-center`,
                      { 
                        borderColor: isSelected ? SalozyColors.primary.DEFAULT : colors.border,
                        backgroundColor: isSelected ? SalozyColors.primary.DEFAULT : 'transparent'
                      }
                    ]}>
                      {isSelected && (
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedServices.length > 0 && (
              <View style={[
                tw`mt-4 p-3 rounded-xl`,
                { backgroundColor: SalozyColors.status.success + '10' }
              ]}>
                <Text size="sm" weight="semibold" style={{ color: SalozyColors.status.success }}>
                  Total: ₹{calculateTotalPrice().toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Seat Selection */}
          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Seat <Text style={{ color: textSecondary }}>(Optional)</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowSeatPicker(true)}
              style={[
                tw`px-4 py-4 rounded-xl border flex-row items-center justify-between`,
                { 
                  borderColor: seat_id ? SalozyColors.primary.DEFAULT : colors.border,
                  backgroundColor: colors.secondaryBg
                }
              ]}
              activeOpacity={0.7}
            >
              <Text variant={seat_id ? 'primary' : 'secondary'} weight={seat_id ? 'semibold' : 'normal'}>
                {seat_id ? getSelectedSeat()?.name : 'Select Seat (Optional)'}
              </Text>
              <Text size="lg" variant="secondary">▼</Text>
            </TouchableOpacity>
          </View>

          {/* Staff Selection */}
          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Staff <Text style={{ color: textSecondary }}>(Optional)</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowStaffPicker(true)}
              style={[
                tw`px-4 py-4 rounded-xl border flex-row items-center justify-between`,
                { 
                  borderColor: staff_id ? SalozyColors.primary.DEFAULT : colors.border,
                  backgroundColor: colors.secondaryBg
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={tw`flex-1`}>
                {staff_id ? (
                  <>
                    <Text variant="primary" weight="semibold">
                      {getSelectedStaff()?.name}
                    </Text>
                    <Text size="sm" variant="secondary" style={tw`mt-1`}>
                      {getSelectedStaff()?.email}
                    </Text>
                  </>
                ) : (
                  <Text variant="secondary">Select Staff (Optional)</Text>
                )}
              </View>
              <Text size="lg" variant="secondary">▼</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={[
            tw`rounded-2xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Notes <Text style={{ color: textSecondary }}>(Optional)</Text>
            </Text>
            <Input
              placeholder="Add any additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              containerStyle={tw`mb-0`}
              maxLength={500}
            />
            <Text size="xs" variant="secondary" style={tw`mt-1`}>
              {notes.length}/500 characters
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || dayClosed}
            style={[
              tw`px-6 py-4 rounded-xl mt-2`,
              { 
                backgroundColor: submitting ? SalozyColors.primary.DEFAULT : (dayClosed ? colors.secondaryBg : SalozyColors.primary.DEFAULT),
                opacity: (submitting || dayClosed) ? 0.6 : 1
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
                Create Appointment
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Customer Picker Modal */}
      {showCustomerPicker && (
        <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[
            tw`absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 max-h-[70%]`,
            { backgroundColor: cardBg }
          ]}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-xl font-bold`, { color: textPrimary }]}>Select Customer</Text>
              <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
                <Text size="lg" variant="primary" weight="bold">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={tw`max-h-96`}>
              {formData.customers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  onPress={() => {
                    setUserId(customer.id.toString());
                    setShowCustomerPicker(false);
                  }}
                  style={[
                    tw`px-4 py-4 border-b rounded-lg mb-2`,
                    { 
                      borderColor: colors.border,
                      backgroundColor: user_id === customer.id.toString() ? SalozyColors.primary.DEFAULT + '10' : 'transparent'
                    }
                  ]}
                >
                  <Text variant="primary" weight={user_id === customer.id.toString() ? 'bold' : 'semibold'}>
                    {customer.name}
                  </Text>
                  <Text size="sm" variant="secondary" style={tw`mt-1`}>
                    {customer.email}
                  </Text>
                  {customer.phone && (
                    <Text size="sm" variant="secondary">{customer.phone}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Seat Picker Modal */}
      {showSeatPicker && (
        <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[
            tw`absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 max-h-[50%]`,
            { backgroundColor: cardBg }
          ]}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-xl font-bold`, { color: textPrimary }]}>Select Seat</Text>
              <TouchableOpacity onPress={() => setShowSeatPicker(false)}>
                <Text size="lg" variant="primary" weight="bold">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={tw`max-h-64`}>
              <TouchableOpacity
                onPress={() => {
                  setSeatId('');
                  setShowSeatPicker(false);
                }}
                style={[
                  tw`px-4 py-4 border-b rounded-lg mb-2`,
                  { 
                    borderColor: colors.border,
                    backgroundColor: !seat_id ? SalozyColors.primary.DEFAULT + '10' : 'transparent'
                  }
                ]}
              >
                <Text variant="primary" weight={!seat_id ? 'bold' : 'semibold'}>None</Text>
              </TouchableOpacity>
              {formData.seats.map((seat) => (
                <TouchableOpacity
                  key={seat.id}
                  onPress={() => {
                    setSeatId(seat.id.toString());
                    setShowSeatPicker(false);
                  }}
                  style={[
                    tw`px-4 py-4 border-b rounded-lg mb-2`,
                    { 
                      borderColor: colors.border,
                      backgroundColor: seat_id === seat.id.toString() ? SalozyColors.primary.DEFAULT + '10' : 'transparent'
                    }
                  ]}
                >
                  <Text variant="primary" weight={seat_id === seat.id.toString() ? 'bold' : 'semibold'}>
                    {seat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Staff Picker Modal */}
      {showStaffPicker && (
        <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[
            tw`absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 max-h-[50%]`,
            { backgroundColor: cardBg }
          ]}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-xl font-bold`, { color: textPrimary }]}>Select Staff</Text>
              <TouchableOpacity onPress={() => setShowStaffPicker(false)}>
                <Text size="lg" variant="primary" weight="bold">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={tw`max-h-64`}>
              <TouchableOpacity
                onPress={() => {
                  setStaffId('');
                  setShowStaffPicker(false);
                }}
                style={[
                  tw`px-4 py-4 border-b rounded-lg mb-2`,
                  { 
                    borderColor: colors.border,
                    backgroundColor: !staff_id ? SalozyColors.primary.DEFAULT + '10' : 'transparent'
                  }
                ]}
              >
                <Text variant="primary" weight={!staff_id ? 'bold' : 'semibold'}>None</Text>
              </TouchableOpacity>
              {formData.staff.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    setStaffId(s.id.toString());
                    setShowStaffPicker(false);
                  }}
                  style={[
                    tw`px-4 py-4 border-b rounded-lg mb-2`,
                    { 
                      borderColor: colors.border,
                      backgroundColor: staff_id === s.id.toString() ? SalozyColors.primary.DEFAULT + '10' : 'transparent'
                    }
                  ]}
                >
                  <Text variant="primary" weight={staff_id === s.id.toString() ? 'bold' : 'semibold'}>
                    {s.name}
                  </Text>
                  <Text size="sm" variant="secondary" style={tw`mt-1`}>{s.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
