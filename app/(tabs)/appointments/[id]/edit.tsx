import { AppointmentsIcon, ClockIcon, CustomersIcon, Input, NotesIcon, SeatsIcon, ServicesIcon, StaffIcon, Text } from '@/components/atoms';
import { DatePicker } from '@/components/molecules';
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

interface AppointmentDetail {
  id: number;
  user_id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  services: Array<{
    id: number;
    name: string;
    price: number;
    seat_id?: number;
  }>;
  staff_id?: number;
  currency_symbol?: string;
}

export default function EditAppointmentScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [formData, setFormData] = useState<FormData | null>(null);
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [user_id, setUserId] = useState<string>('');
  const [appointment_date, setAppointmentDate] = useState<string>('');
  const [appointment_time, setAppointmentTime] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [seat_id, setSeatId] = useState<string>('');
  const [staff_id, setStaffId] = useState<string>('');
  const [status, setStatus] = useState<string>('pending');
  const [notes, setNotes] = useState<string>('');

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const [dayClosed, setDayClosed] = useState(false);
  const [workingHourError, setWorkingHourError] = useState<string>('');
  const [minTime, setMinTime] = useState<string>('00:00');
  const [maxTime, setMaxTime] = useState<string>('23:59');
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Selection modals
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showSeatPicker, setShowSeatPicker] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchData = async () => {
    if (!isAuthenticated || !id) return;

    try {
      setLoading(true);
      const [formResponse, appointmentResponse, workingHoursResponse] = await Promise.all([
        apiClient.get<FormData>(API_ENDPOINTS.APPOINTMENT_FORM_DATA),
        apiClient.get<AppointmentDetail>(API_ENDPOINTS.APPOINTMENT_BY_ID(id)),
        apiClient.get<{ workingHours: WorkingHour[] }>(API_ENDPOINTS.WORKING_HOURS),
      ]);
      
      if (formResponse.success && formResponse.data) {
        setFormData(formResponse.data);
      }
      
      if (appointmentResponse.success && appointmentResponse.data) {
        const apt = appointmentResponse.data as any;
        setAppointment(apt);
        
        // Fix customer selection - API returns user object, not user_id
        setUserId(apt.user?.id?.toString() || apt.user_id?.toString() || '');
        
        // Set appointment date (already in YYYY-MM-DD format from API)
        setAppointmentDate(apt.appointment_date || '');
        
        // Fix time format - API returns H:i:s, but we need H:i for submission
        let timeStr = apt.appointment_time || '';
        if (timeStr && timeStr.includes(':')) {
          const timeParts = timeStr.split(':');
          timeStr = `${timeParts[0]}:${timeParts[1]}`; // Extract H:i from H:i:s
        }
        setAppointmentTime(timeStr);
        
        setStatus(apt.status || 'pending');
        setNotes(apt.notes || '');
        setSelectedServices(apt.services?.map((s: any) => s.id) || []);
        
        // Get seat_id from first service that has a seat_id
        const seatIdFromService = apt.services?.find((s: any) => s.seat_id)?.seat_id;
        setSeatId(seatIdFromService?.toString() || '');
        
        // Try to get staff_id from appointment_services or staff_json
        let staffIdValue = '';
        if (apt.staff_id) {
          staffIdValue = apt.staff_id.toString();
        } else if (apt.staff_json) {
          try {
            const staffJson = typeof apt.staff_json === 'string' ? JSON.parse(apt.staff_json) : apt.staff_json;
            staffIdValue = staffJson?.id?.toString() || '';
          } catch (e) {
            // Ignore parse error
          }
        }
        setStaffId(staffIdValue);
        
        // Set temp time for time picker
        if (timeStr) {
          const [hours, minutes] = timeStr.split(':');
          const timeDate = new Date();
          timeDate.setHours(parseInt(hours || '0'), parseInt(minutes || '0'));
          setTempTime(timeDate);
        }
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
      showToast.error(apiError.message || 'Failed to load data', 'Error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isChecking && id) {
      fetchData();
    }
  }, [isAuthenticated, isChecking, id]);

  // Update working hours when date changes
  useEffect(() => {
    if (appointment_date && workingHours.length > 0) {
      const dayName = getDayName(appointment_date);
      setSelectedDay(dayName);
      const dayWorkingHour = workingHours.find((wh) => wh.day === dayName);
      
      if (dayWorkingHour) {
        if (dayWorkingHour.is_closed) {
          setDayClosed(true);
          setWorkingHourError(`The branch is closed on ${dayName}.`);
          setMinTime('00:00');
          setMaxTime('23:59');
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
      }
    }
  }, [appointment_date, workingHours]);

  // Helper to get day name from date string (YYYY-MM-DD)
  const getDayName = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
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
    if (!formData || !appointment) return 0;
    return selectedServices.reduce((total, serviceId) => {
      const service = formData.services.find(s => s.id === serviceId);
      // Use locked-in price from appointment if available, otherwise use current service price
      const appointmentService = appointment.services.find(s => s.id === serviceId);
      const price = appointmentService?.price ?? service?.price ?? 0;
      // Ensure price is a number
      const numericPrice = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
      return total + numericPrice;
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
    if (status !== 'pending' && !seat_id) {
      showToast.error('Please select a seat when status is not pending', 'Validation Error');
      return;
    }

    try {
      setSubmitting(true);
      
      // Ensure time is in H:i format (not H:i:s)
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
        status,
        notes: notes || null,
      };
      if (seat_id) {
        payload.seat_id = parseInt(seat_id);
      }
      if (staff_id) {
        payload.staff_id = parseInt(staff_id);
      }

      const response = await apiClient.put(API_ENDPOINTS.APPOINTMENT_UPDATE(id!), payload);
      
      if (response.success) {
        showToast.success(response.message || 'Appointment updated successfully', 'Success');
        router.replace(`/(tabs)/appointments/${id}`);
      } else {
        showToast.error(response.message || 'Failed to update appointment', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 422) {
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to update appointment', 'Error');
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

  if (!formData || !appointment) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center px-4`, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={tw`text-lg font-semibold mb-2`} variant="primary">Failed to load data</Text>
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

  const canEdit = !['completed', 'cancelled', 'in_progress'].includes(appointment.status);
  if (!canEdit) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center px-4`, { backgroundColor: colors.background }]} edges={['top']}>
        <GlobalHeader title="Edit Appointment" showBackButton={true} />
        <View style={tw`flex-1 items-center justify-center px-4`}>
          <Text style={tw`text-lg font-semibold mb-2`} variant="primary">Cannot Edit</Text>
          <Text style={tw`text-center mb-4`} variant="secondary">
            This appointment cannot be edited as its status is {appointment.status.replace('_', ' ')}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              tw`px-6 py-3 rounded-xl mt-4`,
              { backgroundColor: SalozyColors.primary.DEFAULT }
            ]}
          >
            <Text style={tw`text-white font-semibold`}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPastDate = appointment_date && new Date(appointment_date) < new Date(new Date().toDateString());

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
      <GlobalHeader
        title="Edit Appointment"
        showBackButton={true}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-6`} showsVerticalScrollIndicator={false}>
        <View style={tw`px-4 mt-4 gap-3`}>
          {/* Customer Selection */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' }
              ]}>
                <CustomersIcon size={20} color={SalozyColors.primary.DEFAULT} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">
                  Customer
                </Text>
                <Text size="xs" variant="secondary">
                  Required field
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowCustomerPicker(true)}
              style={[
                tw`px-4 py-3.5 rounded-xl border flex-row items-center justify-between`,
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
                    <Text size="sm" variant="primary" weight="semibold">
                      {getSelectedCustomer()?.name}
                    </Text>
                    <Text size="xs" variant="secondary" style={tw`mt-0.5`}>
                      {getSelectedCustomer()?.email}
                    </Text>
                  </>
                ) : (
                  <Text size="sm" variant="secondary">Select Customer</Text>
                )}
              </View>
              <Text size="base" variant="secondary">▼</Text>
            </TouchableOpacity>
          </View>

          {/* Appointment Date */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View style={[
                  tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                  { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
                ]}>
                  <AppointmentsIcon size={20} color={SalozyColors.status.info} />
                </View>
                <View style={tw`flex-1`}>
                  <Text size="base" weight="bold" variant="primary">
                    Appointment Date
                  </Text>
                  <Text size="xs" variant="secondary">
                    Required field
                  </Text>
                </View>
              </View>
              {isPastDate && (
                <View style={[tw`px-2.5 py-1 rounded-full`, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}>
                  <Text size="xs" weight="semibold" style={{ color: SalozyColors.status.error }}>
                    Past
                  </Text>
                </View>
              )}
            </View>
            <DatePicker
              value={appointment_date}
              onChange={(date) => {
                setAppointmentDate(date);
                if (date) {
                  const dayName = getDayName(date);
                  setSelectedDay(dayName);
                  const dayWorkingHour = workingHours.find((wh) => wh.day === dayName);
                  
                  if (dayWorkingHour) {
                    if (dayWorkingHour.is_closed) {
                      setDayClosed(true);
                      setWorkingHourError(`The branch is closed on ${dayName}.`);
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
              }}
              placeholder="Select appointment date"
              label=""
              minimumDate={new Date()}
            />
            {appointment_date && !validateDate(appointment_date) && (
              <Text size="xs" style={[tw`mt-2`, { color: SalozyColors.status.error }]}>
                Date must be today or later
              </Text>
            )}
          </View>

          {/* Appointment Time */}
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
                <Text size="base" weight="bold" variant="primary">
                  Appointment Time
                </Text>
                <Text size="xs" variant="secondary">
                  Required field
                </Text>
              </View>
            </View>
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
                tw`px-4 py-3.5 rounded-xl border flex-row items-center justify-between`,
                { 
                  borderColor: appointment_time ? SalozyColors.primary.DEFAULT : colors.border,
                  backgroundColor: colors.secondaryBg,
                  opacity: (dayClosed || !appointment_date) ? 0.5 : 1
                }
              ]}
              activeOpacity={0.7}
            >
              <Text size="sm" variant={appointment_time ? 'primary' : 'secondary'} weight={appointment_time ? 'semibold' : 'normal'}>
                {appointment_time || 'Select time'}
              </Text>
              <ClockIcon size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {workingHourError && (
              <Text size="xs" style={[tw`mt-2`, { color: SalozyColors.status.error }]}>
                {workingHourError}
              </Text>
            )}
            {appointment_date && !dayClosed && (
              <Text size="xs" variant="tertiary" style={tw`mt-2`}>
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
              />
            )}
          </View>

          {/* Status Selection */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }
              ]}>
                <AppointmentsIcon size={20} color="#8B5CF6" />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">
                  Status
                </Text>
                <Text size="xs" variant="secondary">
                  Required field
                </Text>
              </View>
            </View>
            {appointment.status === 'in_progress' ? (
              <View style={[
                tw`p-3 rounded-xl`,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
              ]}>
                <Text size="xs" weight="semibold" style={{ color: SalozyColors.status.info }}>
                  This appointment service is currently in progress and cannot be changed.
                </Text>
              </View>
            ) : (
              <View style={tw`flex-row gap-2 flex-wrap`}>
                {['pending', 'completed', 'cancelled'].map((s) => {
                  const isSelected = status === s;
                  const statusColors = {
                    pending: SalozyColors.status.warning,
                    completed: SalozyColors.status.success,
                    cancelled: SalozyColors.status.error,
                  };
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setStatus(s)}
                      style={[
                        tw`px-3 py-2.5 rounded-xl border flex-1 min-w-[100px] items-center`,
                        { 
                          borderColor: isSelected ? statusColors[s as keyof typeof statusColors] : colors.border,
                          backgroundColor: isSelected 
                            ? (isDark ? `${statusColors[s as keyof typeof statusColors]}33` : `${statusColors[s as keyof typeof statusColors]}1A`)
                            : colors.secondaryBg
                        }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text 
                        size="xs"
                        weight={isSelected ? 'bold' : 'semibold'}
                        style={{ 
                          color: isSelected ? statusColors[s as keyof typeof statusColors] : colors.textPrimary
                        }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Services Selection */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View style={[
                  tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                  { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }
                ]}>
                  <ServicesIcon size={20} color={SalozyColors.status.success} />
                </View>
                <View style={tw`flex-1`}>
                  <Text size="base" weight="bold" variant="primary">
                    Services
                  </Text>
                  <Text size="xs" variant="secondary">
                    Required field
                  </Text>
                </View>
              </View>
              {selectedServices.length > 0 && (
                <View style={[
                  tw`px-2.5 py-1 rounded-full`,
                  { backgroundColor: SalozyColors.primary.DEFAULT }
                ]}>
                  <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                    {selectedServices.length}
                  </Text>
                </View>
              )}
            </View>
            <View style={tw`gap-2`}>
              {formData.services.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                // Use locked-in price from appointment if available
                const appointmentService = appointment.services.find(s => s.id === service.id);
                const displayPrice = (appointmentService?.price ?? service.price ?? 0);
                const displayName = appointmentService?.name || service.name || 'Unknown Service';
                
                return (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => handleServiceToggle(service.id)}
                    style={[
                      tw`flex-row items-center p-3 rounded-xl border`,
                      { 
                        borderColor: isSelected ? SalozyColors.primary.DEFAULT : colors.border,
                        backgroundColor: isSelected 
                          ? (isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)')
                          : colors.secondaryBg
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={tw`flex-1`}>
                      <Text size="sm" variant="primary" weight={isSelected ? 'bold' : 'semibold'}>
                        {displayName}
                      </Text>
                      <View style={tw`flex-row items-center gap-2 mt-1`}>
                        <Text size="xs" variant="secondary">
                          {appointment.currency_symbol || '₹'}{((displayPrice ?? 0) || 0).toFixed(2)}
                        </Text>
                        <Text size="xs" variant="tertiary">•</Text>
                        <Text size="xs" variant="secondary">
                          {service.duration_minutes || 0} min
                        </Text>
                      </View>
                    </View>
                    <View style={[
                      tw`w-6 h-6 rounded-full border-2 items-center justify-center`,
                      { 
                        borderColor: isSelected ? SalozyColors.primary.DEFAULT : colors.border,
                        backgroundColor: isSelected ? SalozyColors.primary.DEFAULT : 'transparent'
                      }
                    ]}>
                      {isSelected && (
                        <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedServices.length > 0 && (
              <View style={[
                tw`mt-3 p-3 rounded-xl`,
                { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }
              ]}>
                <Text size="sm" weight="bold" style={{ color: SalozyColors.status.success }}>
                  Total: {appointment.currency_symbol || '₹'}{calculateTotalPrice().toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Seat Selection */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)' }
              ]}>
                <SeatsIcon size={20} color={SalozyColors.status.warning} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">
                  Seat
                </Text>
                <Text size="xs" variant="secondary">
                  {status !== 'pending' ? 'Required field' : 'Optional'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowSeatPicker(true)}
              style={[
                tw`px-4 py-3.5 rounded-xl border flex-row items-center justify-between`,
                { 
                  borderColor: seat_id ? SalozyColors.primary.DEFAULT : colors.border,
                  backgroundColor: colors.secondaryBg
                }
              ]}
              activeOpacity={0.7}
            >
              <Text size="sm" variant={seat_id ? 'primary' : 'secondary'} weight={seat_id ? 'semibold' : 'normal'}>
                {seat_id ? getSelectedSeat()?.name : status === 'pending' ? 'Select Seat (Optional)' : 'Select Seat'}
              </Text>
              <Text size="base" variant="secondary">▼</Text>
            </TouchableOpacity>
            {status !== 'pending' && !seat_id && (
              <Text size="xs" style={[tw`mt-2`, { color: SalozyColors.status.error }]}>
                Seat is required when status is not pending
              </Text>
            )}
          </View>

          {/* Staff Selection */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
              ]}>
                <StaffIcon size={20} color={SalozyColors.status.info} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">
                  Staff
                </Text>
                <Text size="xs" variant="secondary">
                  Optional
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowStaffPicker(true)}
              style={[
                tw`px-4 py-3.5 rounded-xl border flex-row items-center justify-between`,
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
                    <Text size="sm" variant="primary" weight="semibold">
                      {getSelectedStaff()?.name}
                    </Text>
                    <Text size="xs" variant="secondary" style={tw`mt-0.5`}>
                      {getSelectedStaff()?.email}
                    </Text>
                  </>
                ) : (
                  <Text size="sm" variant="secondary">Select Staff (Optional)</Text>
                )}
              </View>
              <Text size="base" variant="secondary">▼</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)' }
              ]}>
                <NotesIcon size={20} color={colors.textSecondary} />
              </View>
              <View style={tw`flex-1`}>
                <Text size="base" weight="bold" variant="primary">
                  Notes
                </Text>
                <Text size="xs" variant="secondary">
                  Optional
                </Text>
              </View>
            </View>
            <Input
              placeholder="Add any additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              leftIcon={<NotesIcon size={20} color={colors.placeholder} />}
              containerStyle={tw`mb-0`}
              maxLength={500}
            />
            <Text size="xs" variant="tertiary" style={tw`mt-1`}>
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
                backgroundColor: dayClosed ? colors.secondaryBg : SalozyColors.primary.DEFAULT,
                opacity: (submitting || dayClosed) ? 0.7 : 1
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
              <Text size="base" weight="bold" style={{ color: dayClosed ? textSecondary : '#FFFFFF', textAlign: 'center' }}>
                Update Appointment
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
              <Text size="lg" weight="bold" variant="primary">Select Customer</Text>
              <TouchableOpacity 
                onPress={() => setShowCustomerPicker(false)}
                style={[
                  tw`w-8 h-8 rounded-full items-center justify-center`,
                  { backgroundColor: colors.secondaryBg }
                ]}
              >
                <Text size="base" variant="secondary" weight="bold">✕</Text>
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
                    tw`px-4 py-3 rounded-xl mb-2`,
                    { 
                      backgroundColor: user_id === customer.id.toString() 
                        ? (isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)')
                        : colors.secondaryBg,
                      borderWidth: 1,
                      borderColor: user_id === customer.id.toString() ? SalozyColors.primary.DEFAULT : colors.border
                    }
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={tw`flex-row items-center`}>
                    <View style={[
                      tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                      { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' }
                    ]}>
                      <Text size="base" weight="bold" style={{ color: SalozyColors.primary.DEFAULT }}>
                        {customer.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={tw`flex-1`}>
                      <Text size="sm" variant="primary" weight={user_id === customer.id.toString() ? 'bold' : 'semibold'}>
                        {customer.name}
                      </Text>
                      <Text size="xs" variant="secondary" style={tw`mt-0.5`}>
                        {customer.email}
                      </Text>
                      {customer.phone && (
                        <Text size="xs" variant="tertiary" style={tw`mt-0.5`}>{customer.phone}</Text>
                      )}
                    </View>
                  </View>
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
              <Text size="lg" weight="bold" variant="primary">Select Seat</Text>
              <TouchableOpacity 
                onPress={() => setShowSeatPicker(false)}
                style={[
                  tw`w-8 h-8 rounded-full items-center justify-center`,
                  { backgroundColor: colors.secondaryBg }
                ]}
              >
                <Text size="base" variant="secondary" weight="bold">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={tw`max-h-64`}>
              {status === 'pending' && (
                <TouchableOpacity
                  onPress={() => {
                    setSeatId('');
                    setShowSeatPicker(false);
                  }}
                  style={[
                    tw`px-4 py-3 rounded-xl mb-2`,
                    { 
                      backgroundColor: !seat_id 
                        ? (isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)')
                        : colors.secondaryBg,
                      borderWidth: 1,
                      borderColor: !seat_id ? SalozyColors.primary.DEFAULT : colors.border
                    }
                  ]}
                  activeOpacity={0.7}
                >
                  <Text size="sm" variant="primary" weight={!seat_id ? 'bold' : 'semibold'}>None</Text>
                </TouchableOpacity>
              )}
              {formData.seats.map((seat) => (
                <TouchableOpacity
                  key={seat.id}
                  onPress={() => {
                    setSeatId(seat.id.toString());
                    setShowSeatPicker(false);
                  }}
                  style={[
                    tw`px-4 py-3 rounded-xl mb-2`,
                    { 
                      backgroundColor: seat_id === seat.id.toString() 
                        ? (isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)')
                        : colors.secondaryBg,
                      borderWidth: 1,
                      borderColor: seat_id === seat.id.toString() ? SalozyColors.primary.DEFAULT : colors.border
                    }
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={tw`flex-row items-center`}>
                    <View style={[
                      tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
                      { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)' }
                    ]}>
                      <SeatsIcon size={16} color={SalozyColors.status.warning} />
                    </View>
                    <Text size="sm" variant="primary" weight={seat_id === seat.id.toString() ? 'bold' : 'semibold'}>
                      {seat.name}
                    </Text>
                  </View>
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
              <Text size="lg" weight="bold" variant="primary">Select Staff</Text>
              <TouchableOpacity 
                onPress={() => setShowStaffPicker(false)}
                style={[
                  tw`w-8 h-8 rounded-full items-center justify-center`,
                  { backgroundColor: colors.secondaryBg }
                ]}
              >
                <Text size="base" variant="secondary" weight="bold">✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={tw`max-h-64`}>
              <TouchableOpacity
                onPress={() => {
                  setStaffId('');
                  setShowStaffPicker(false);
                }}
                style={[
                  tw`px-4 py-3 rounded-xl mb-2`,
                  { 
                    backgroundColor: !staff_id 
                      ? (isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)')
                      : colors.secondaryBg,
                    borderWidth: 1,
                    borderColor: !staff_id ? SalozyColors.primary.DEFAULT : colors.border
                  }
                ]}
                activeOpacity={0.7}
              >
                <Text size="sm" variant="primary" weight={!staff_id ? 'bold' : 'semibold'}>None</Text>
              </TouchableOpacity>
              {formData.staff.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    setStaffId(s.id.toString());
                    setShowStaffPicker(false);
                  }}
                  style={[
                    tw`px-4 py-3 rounded-xl mb-2`,
                    { 
                      backgroundColor: staff_id === s.id.toString() 
                        ? (isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)')
                        : colors.secondaryBg,
                      borderWidth: 1,
                      borderColor: staff_id === s.id.toString() ? SalozyColors.primary.DEFAULT : colors.border
                    }
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={tw`flex-row items-center`}>
                    <View style={[
                      tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
                      { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
                    ]}>
                      <StaffIcon size={16} color={SalozyColors.status.info} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text size="sm" variant="primary" weight={staff_id === s.id.toString() ? 'bold' : 'semibold'}>
                        {s.name}
                      </Text>
                      <Text size="xs" variant="secondary" style={tw`mt-0.5`}>{s.email}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
