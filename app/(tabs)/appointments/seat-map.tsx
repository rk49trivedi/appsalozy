import { Badge, Text } from '@/components/atoms';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    withSequence,
    interpolate,
} from 'react-native-reanimated';
import tw from 'twrnc';
import * as Haptics from 'expo-haptics';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  status?: string;
  seat_id?: number;
  seat_name?: string;
}

interface Appointment {
  id: number;
  ticket_number: string;
  status: string;
  service_name: string;
  service_id: number;
  start_time?: string;
  estimated_end_time?: string;
  user: User;
}

interface UnassignedAppointment {
  id: number;
  ticket_number: string;
  status: string;
  user: User;
  services: Service[];
  appointment_date?: string;
  appointment_time?: string;
  start_time?: string;
  estimated_end_time?: string;
  staff?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  } | null;
}

interface Seat {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  staff: {
    id: number;
    name: string;
  } | null;
  appointments: Appointment[];
}

interface SeatMapResponse {
  success?: boolean;
  data?: {
    seats: Seat[];
    unassignedAppointments: UnassignedAppointment[];
    assignedPendingAppointments: UnassignedAppointment[];
  };
}

export default function SeatMapScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [seats, setSeats] = useState<Seat[]>([]);
  const [assignedPendingAppointments, setAssignedPendingAppointments] = useState<UnassignedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<UnassignedAppointment | null>(null);
  const [selectedSeatAppointment, setSelectedSeatAppointment] = useState<Appointment | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [successSeatId, setSuccessSeatId] = useState<number | null>(null);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchSeatMapData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setRefreshing(true);
      const response: SeatMapResponse = await apiClient.get(API_ENDPOINTS.APPOINTMENT_SEAT_MAP);

      if (response.success && response.data) {
        setSeats(response.data.seats || []);
        setAssignedPendingAppointments(response.data.assignedPendingAppointments || []);
      } else {
        showToast.error(response.message || 'Failed to load seat map data', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      console.error('Seat map error:', apiError);
      if (apiError.status === 401) {
        await apiClient.logout();
        router.replace('/login');
        return;
      }
      showToast.error(apiError.message || 'Failed to load seat map', 'Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      fetchSeatMapData();
    }
  }, [isAuthenticated, isChecking, fetchSeatMapData]);

  const onRefresh = useCallback(() => {
    fetchSeatMapData();
  }, [fetchSeatMapData]);

  const checkSeatAvailability = async (seatId: number): Promise<boolean> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.APPOINTMENT_SEAT_CHECK_AVAILABILITY(seatId));
      return response.data?.available ?? false;
    } catch (error) {
      console.error('Error checking seat availability:', error);
      return false;
    }
  };

  const handleAssignToSeat = async (appointment: UnassignedAppointment, seat: Seat) => {
    if (seat.status !== 'available') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast.error('This seat is not available', 'Error');
      return;
    }

    try {
      const available = await checkSeatAvailability(seat.id);
      if (!available) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast.error('This seat is not available at the moment', 'Error');
        return;
      }

      setUpdating(appointment.id);
      const response = await apiClient.put(
        API_ENDPOINTS.APPOINTMENT_UPDATE_SEAT_STATUS(appointment.id),
        {
          status: 'in_progress',
          seat_id: seat.id,
        }
      );

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessSeatId(seat.id);
        showToast.success('Appointment assigned successfully!', 'Success');
        setTimeout(() => {
          setSuccessSeatId(null);
          setSelectedAppointment(null);
          fetchSeatMapData();
        }, 1500);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast.error(response.message || 'Failed to assign appointment', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast.error(apiError.message || 'Failed to assign appointment', 'Error');
    } finally {
      setUpdating(null);
    }
  };

  const handleMoveToSeat = async (appointment: Appointment, seat: Seat) => {
    if (seat.status !== 'available') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast.error('This seat is not available', 'Error');
      return;
    }

    try {
      const available = await checkSeatAvailability(seat.id);
      if (!available) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast.error('This seat is not available at the moment', 'Error');
        return;
      }

      setUpdating(appointment.id);
      const response = await apiClient.put(
        API_ENDPOINTS.APPOINTMENT_UPDATE_SEAT_STATUS(appointment.id),
        {
          status: 'in_progress',
          seat_id: seat.id,
        }
      );

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessSeatId(seat.id);
        showToast.success('Appointment moved successfully!', 'Success');
        setTimeout(() => {
          setSuccessSeatId(null);
          setSelectedSeatAppointment(null);
          fetchSeatMapData();
        }, 1500);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast.error(response.message || 'Failed to move appointment', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast.error(apiError.message || 'Failed to move appointment', 'Error');
    } finally {
      setUpdating(null);
    }
  };

  const handleMoveToPending = async (appointment: Appointment) => {
    const seat = seats.find(s =>
      s.appointments.some(a => a.id === appointment.id)
    );

    if (!seat) return;

    try {
      setUpdating(appointment.id);
      const response = await apiClient.put(
        API_ENDPOINTS.APPOINTMENT_UPDATE_SEAT_STATUS(appointment.id),
        {
          status: 'pending',
          seat_id: seat.id,
        }
      );

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast.success('Appointment moved to pending successfully', 'Success');
        setSelectedSeatAppointment(null);
        fetchSeatMapData();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast.error(response.message || 'Failed to move appointment', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast.error(apiError.message || 'Failed to move appointment', 'Error');
    } finally {
      setUpdating(null);
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return 'N/A';
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return time;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return { 
          color: SalozyColors.status.success, 
          bg: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
          badge: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
        };
      case 'occupied':
        return { 
          color: SalozyColors.status.warning, 
          bg: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)',
          badge: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)',
        };
      case 'cleaning':
        return { 
          color: SalozyColors.status.info, 
          bg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
          badge: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
        };
      case 'maintenance':
        return { 
          color: SalozyColors.status.error, 
          bg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
          badge: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
        };
      default:
        return { 
          color: '#6B7280', 
          bg: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)',
          badge: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)',
        };
    }
  };

  // Animated Appointment Card Component
  const AppointmentCard = ({ appointment, source }: { appointment: UnassignedAppointment; source: 'pending' }) => {
    const isSelected = selectedAppointment?.id === appointment.id;
    const isUpdating = updating === appointment.id;
    const scale = useSharedValue(1);
    const pulse = useSharedValue(0);

    React.useEffect(() => {
      if (isSelected) {
        scale.value = withSpring(1.02);
        pulse.value = withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0, { duration: 600 })
        );
      } else {
        scale.value = withSpring(1);
        pulse.value = withTiming(0);
      }
    }, [isSelected]);

    const animatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(pulse.value, [0, 1], [1, 0.7]);
      return {
        transform: [{ scale: scale.value }],
        opacity,
      };
    });

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={() => {
            if (isSelected) {
              setSelectedAppointment(null);
              setSelectedSeatAppointment(null);
            } else {
              setSelectedAppointment(appointment);
              setSelectedSeatAppointment(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
          activeOpacity={0.8}
          style={tw`mb-3`}
        >
          <View
            style={[
              tw`rounded-2xl p-4`,
              {
                backgroundColor: cardBg,
                borderWidth: isSelected ? 3 : 1,
                borderColor: isSelected 
                  ? SalozyColors.primary.DEFAULT 
                  : borderColor,
                shadowColor: isSelected ? SalozyColors.primary.DEFAULT : '#000',
                shadowOffset: { width: 0, height: isSelected ? 6 : 2 },
                shadowOpacity: isSelected ? 0.3 : 0.1,
                shadowRadius: isSelected ? 12 : 4,
                elevation: isSelected ? 8 : 2,
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-3`}>
              <View
                style={[
                  tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
                  { 
                    backgroundColor: isSelected
                      ? SalozyColors.primary.DEFAULT + '20'
                      : isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: SalozyColors.primary.DEFAULT,
                  },
                ]}
              >
                <Text
                  size="lg"
                  weight="bold"
                  style={{ color: SalozyColors.primary.DEFAULT }}
                >
                  {appointment.user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={tw`flex-1`}>
                <Text
                  size="base"
                  weight="bold"
                  variant="primary"
                  numberOfLines={1}
                >
                  {appointment.user.name}
                </Text>
                <Text
                  size="xs"
                  variant="secondary"
                >
                  #{appointment.ticket_number}
                </Text>
              </View>
              {isUpdating ? (
                <ActivityIndicator size="small" color={SalozyColors.primary.DEFAULT} />
              ) : isSelected ? (
                <View
                  style={[
                    tw`w-8 h-8 rounded-full items-center justify-center`,
                    { backgroundColor: SalozyColors.primary.DEFAULT },
                  ]}
                >
                  <Text size="sm" style={{ color: '#FFFFFF' }}>✓</Text>
                </View>
              ) : (
                <View
                  style={[
                    tw`w-8 h-8 rounded-full items-center justify-center`,
                    { backgroundColor: colors.secondaryBg },
                  ]}
                >
                  <Text size="xs" variant="secondary">Tap</Text>
                </View>
              )}
            </View>

            <View style={tw`flex-row flex-wrap gap-2`}>
              {appointment.services.map((service) => (
                <View
                  key={service.id}
                  style={[
                    tw`px-3 py-1.5 rounded-lg`,
                    { 
                      backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)',
                      borderWidth: 1,
                      borderColor: SalozyColors.primary.DEFAULT + '30',
                    },
                  ]}
                >
                  <Text size="xs" weight="semibold" style={{ color: SalozyColors.primary.DEFAULT }}>
                    {service.name}
                  </Text>
                  <Text size="xs" variant="tertiary">
                    {formatDuration(service.duration_minutes)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Animated Seat Card Component
  const SeatCard = ({ seat }: { seat: Seat }) => {
    const statusColor = getStatusColor(seat.status);
    const hasAppointment = seat.appointments.length > 0;
    const appointment = hasAppointment ? seat.appointments[0] : null;
    const isSelected = selectedSeatAppointment?.id === appointment?.id;
    const isTarget = selectedAppointment && seat.status === 'available';
    const isSuccess = successSeatId === seat.id;
    const scale = useSharedValue(1);
    const glow = useSharedValue(0);

    React.useEffect(() => {
      if (isTarget || isSuccess) {
        scale.value = withSpring(1.05);
        glow.value = withTiming(1, { duration: 300 });
      } else {
        scale.value = withSpring(1);
        glow.value = withTiming(0, { duration: 200 });
      }
    }, [isTarget, isSuccess]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      shadowOpacity: interpolate(glow.value, [0, 1], [0.1, 0.4]),
    }));

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (selectedAppointment && seat.status === 'available') {
              handleAssignToSeat(selectedAppointment, seat);
            } else if (selectedSeatAppointment && appointment && selectedSeatAppointment.id !== appointment.id && seat.status === 'available') {
              handleMoveToSeat(selectedSeatAppointment, seat);
            } else if (appointment) {
              if (isSelected) {
                setSelectedSeatAppointment(null);
                setSelectedAppointment(null);
              } else {
                setSelectedSeatAppointment(appointment);
                setSelectedAppointment(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            } else if (seat.status === 'available' && selectedAppointment) {
              handleAssignToSeat(selectedAppointment, seat);
            }
          }}
        >
          <View
            style={[
              tw`rounded-2xl p-4 mb-3`,
              {
                backgroundColor: cardBg,
                borderWidth: isTarget ? 3 : isSuccess ? 3 : isSelected ? 2 : 1,
                borderColor: isTarget 
                  ? SalozyColors.primary.DEFAULT 
                  : isSuccess 
                  ? SalozyColors.status.success
                  : isSelected
                  ? SalozyColors.primary.DEFAULT
                  : borderColor,
                borderStyle: isTarget ? 'dashed' : 'solid',
                shadowColor: isTarget || isSuccess ? SalozyColors.primary.DEFAULT : '#000',
                shadowOffset: { width: 0, height: (isTarget || isSuccess) ? 8 : 2 },
                shadowRadius: (isTarget || isSuccess) ? 16 : 4,
              },
            ]}
          >
            {/* Header with Status */}
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View
                  style={[
                    tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
                    { 
                      backgroundColor: isSuccess 
                        ? SalozyColors.status.success + '40'
                        : statusColor.bg,
                      borderWidth: isSuccess ? 2 : 0,
                      borderColor: SalozyColors.status.success,
                    },
                  ]}
                >
                  {isSuccess ? (
                    <Text size="lg" style={{ color: SalozyColors.status.success }}>✓</Text>
                  ) : (
                    <Text
                      size="base"
                      weight="bold"
                      style={{ color: statusColor.color }}
                    >
                      {seat.name.charAt(0)}
                    </Text>
                  )}
                </View>
                <View style={tw`flex-1`}>
                  <Text size="base" weight="bold" variant="primary">
                    {seat.name}
                  </Text>
                  {seat.staff && (
                    <Text size="xs" variant="secondary">
                      {seat.staff.name}
                    </Text>
                  )}
                </View>
              </View>
              <View
                style={[
                  tw`px-2 py-1 rounded-full`,
                  { backgroundColor: statusColor.badge },
                ]}
              >
                <Text size="xs" weight="semibold" style={{ color: statusColor.color }}>
                  {seat.status === 'available' ? 'Available' : 
                   seat.status === 'occupied' ? 'Occupied' :
                   seat.status === 'cleaning' ? 'Cleaning' :
                   seat.status === 'maintenance' ? 'Maintenance' : seat.status}
                </Text>
              </View>
            </View>

            {/* Appointment Content or Drop Zone */}
            {hasAppointment && appointment ? (
              <View
                style={[
                  tw`p-3 rounded-xl`,
                  { 
                    backgroundColor: isSelected 
                      ? SalozyColors.primary.DEFAULT + '10'
                      : colors.secondaryBg,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: SalozyColors.primary.DEFAULT,
                  },
                ]}
              >
                <View style={tw`flex-row items-center mb-2`}>
                  <View
                    style={[
                      tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                      { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' },
                    ]}
                  >
                    <Text
                      size="base"
                      weight="bold"
                      style={{ color: SalozyColors.primary.DEFAULT }}
                    >
                      {appointment.user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text size="sm" weight="semibold" variant="primary" numberOfLines={1}>
                      {appointment.user.name}
                    </Text>
                    <Text size="xs" variant="secondary">
                      #{appointment.ticket_number}
                    </Text>
                  </View>
                  {isSelected && (
                    <View
                      style={[
                        tw`w-6 h-6 rounded-full items-center justify-center`,
                        { backgroundColor: SalozyColors.primary.DEFAULT },
                      ]}
                    >
                      <Text size="xs" style={{ color: '#FFFFFF' }}>✓</Text>
                    </View>
                  )}
                </View>
                <View style={tw`flex-row items-center gap-2 mb-2`}>
                  <Badge variant="info">
                    {appointment.service_name}
                  </Badge>
                  {appointment.start_time && (
                    <Text size="xs" variant="tertiary">
                      {formatTime(appointment.start_time)}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View
                style={[
                  tw`p-6 rounded-xl items-center justify-center`,
                  { 
                    backgroundColor: isTarget 
                      ? SalozyColors.primary.DEFAULT + '10'
                      : colors.secondaryBg,
                    minHeight: 80,
                    borderWidth: isTarget ? 2 : 0,
                    borderColor: SalozyColors.primary.DEFAULT,
                    borderStyle: 'dashed',
                  },
                ]}
              >
                {isTarget ? (
                  <View style={tw`items-center`}>
                    <Text size="base" weight="bold" style={{ color: SalozyColors.primary.DEFAULT, textAlign: 'center' }}>
                      Tap to Assign
                    </Text>
                    <Text size="xs" variant="secondary" style={tw`mt-1 text-center`}>
                      {selectedAppointment?.user.name}
                    </Text>
                  </View>
                ) : seat.status === 'available' ? (
                  <View style={tw`items-center`}>
                    <Text size="sm" variant="secondary" style={tw`text-center`}>
                      {selectedAppointment ? 'Tap to assign selected appointment' : 'Available - Tap to assign'}
                    </Text>
                  </View>
                ) : (
                  <Text size="sm" variant="secondary" style={tw`text-center`}>
                    Not available
                  </Text>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isChecking) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: bgColor }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading && seats.length === 0) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: bgColor }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Loading seat map...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[tw`flex-1`, { backgroundColor: bgColor }]}
      edges={['top']}
    >
      <GlobalHeader
        title="Seat Map"
        subtitle={`${seats.length} seats • ${assignedPendingAppointments.length} to assign`}
        rightAction={
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              tw`px-4 py-2 rounded-xl`,
              { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
            ]}
            activeOpacity={0.8}
          >
            <Text
              size="sm"
              weight="semibold"
              style={{ color: isDark ? '#FFFFFF' : '#111827' }}
            >
              Back
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-4`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={SalozyColors.primary.DEFAULT}
          />
        }
      >
        <View style={tw`px-4`}>
          {/* Instructions Banner */}
          {assignedPendingAppointments.length > 0 && (
            <View
              style={[
                tw`rounded-2xl p-4 mb-6`,
                {
                  backgroundColor: isDark 
                    ? 'rgba(154, 52, 18, 0.2)' 
                    : 'rgba(154, 52, 18, 0.1)',
                  borderWidth: 2,
                  borderColor: SalozyColors.primary.DEFAULT + '40',
                  borderStyle: 'dashed',
                },
              ]}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`flex-1`}>
                  <Text size="base" weight="bold" style={{ color: SalozyColors.primary.DEFAULT }}>
                    Click to Select & Assign
                  </Text>
                  <Text size="xs" variant="secondary" style={tw`mt-1`}>
                    Tap an appointment to select it, then tap a seat to assign. You can also move appointments between seats.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Approved Appointments Section */}
          {assignedPendingAppointments.length > 0 && (
            <View style={tw`mb-6`}>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text size="lg" weight="bold" variant="primary">
                  Approved Appointments
                </Text>
                <View
                  style={[
                    tw`px-3 py-1 rounded-full`,
                    { backgroundColor: SalozyColors.primary.DEFAULT + '20' },
                  ]}
                >
                  <Text size="sm" weight="bold" style={{ color: SalozyColors.primary.DEFAULT }}>
                    {assignedPendingAppointments.length}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  tw`rounded-2xl p-4`,
                  {
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: borderColor,
                  },
                ]}
              >
                {assignedPendingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    source="pending"
                  />
                ))}
              </View>
            </View>
          )}

          {/* Seats Grid */}
          <View style={tw`mb-6`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text size="lg" weight="bold" variant="primary">
                Seats
              </Text>
              <View
                style={[
                  tw`px-3 py-1 rounded-full`,
                  { backgroundColor: colors.secondaryBg },
                ]}
              >
                <Text size="sm" variant="secondary">
                  {seats.length} {seats.length === 1 ? 'seat' : 'seats'}
                </Text>
              </View>
            </View>
            <View style={tw`gap-3`}>
              {seats.map((seat) => (
                <SeatCard key={seat.id} seat={seat} />
              ))}
            </View>
          </View>

          {/* Action Buttons for Selected Seat Appointment */}
          {selectedSeatAppointment && (
            <View
              style={[
                tw`rounded-2xl p-4 mb-6`,
                {
                  backgroundColor: cardBg,
                  borderWidth: 2,
                  borderColor: SalozyColors.primary.DEFAULT,
                },
              ]}
            >
              <View style={tw`flex-row items-center mb-4`}>
                <View
                  style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                    { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' },
                  ]}
                >
                  <Text
                    size="base"
                    weight="bold"
                    style={{ color: SalozyColors.primary.DEFAULT }}
                  >
                    {selectedSeatAppointment.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text size="sm" weight="bold" variant="primary">
                    {selectedSeatAppointment.user.name}
                  </Text>
                  <Text size="xs" variant="secondary">
                    #{selectedSeatAppointment.ticket_number}
                  </Text>
                </View>
              </View>
              <View style={tw`gap-2`}>
                <Text size="xs" variant="secondary" style={tw`mb-2`}>
                  Move this appointment to:
                </Text>
                <TouchableOpacity
                  onPress={() => handleMoveToPending(selectedSeatAppointment)}
                  disabled={updating === selectedSeatAppointment.id}
                  style={[
                    tw`px-4 py-3 rounded-xl`,
                    {
                      backgroundColor: SalozyColors.status.warning,
                      opacity: updating === selectedSeatAppointment.id ? 0.6 : 1,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  {updating === selectedSeatAppointment.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text size="sm" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                      Move to Approved Section
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedSeatAppointment(null);
                    setSelectedAppointment(null);
                  }}
                  style={[
                    tw`px-4 py-3 rounded-xl`,
                    { 
                      backgroundColor: colors.secondaryBg,
                      borderWidth: 1,
                      borderColor: borderColor,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text size="sm" weight="semibold" variant="secondary" style={{ textAlign: 'center' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
