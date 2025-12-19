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
import tw from 'twrnc';

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
      showToast.error('This seat is not available', 'Error');
      return;
    }

    try {
      const available = await checkSeatAvailability(seat.id);
      if (!available) {
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
        showToast.success('Appointment assigned to seat successfully', 'Success');
        fetchSeatMapData();
      } else {
        showToast.error(response.message || 'Failed to assign appointment', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to assign appointment', 'Error');
    } finally {
      setUpdating(null);
      setSelectedAppointment(null);
    }
  };

  const handleMoveToSeat = async (appointment: Appointment, seat: Seat) => {
    if (seat.status !== 'available') {
      showToast.error('This seat is not available', 'Error');
      return;
    }

    try {
      const available = await checkSeatAvailability(seat.id);
      if (!available) {
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
        showToast.success('Appointment moved to new seat successfully', 'Success');
        fetchSeatMapData();
      } else {
        showToast.error(response.message || 'Failed to move appointment', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to move appointment', 'Error');
    } finally {
      setUpdating(null);
      setSelectedSeatAppointment(null);
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
        showToast.success('Appointment moved to pending successfully', 'Success');
        fetchSeatMapData();
      } else {
        showToast.error(response.message || 'Failed to move appointment', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to move appointment', 'Error');
    } finally {
      setUpdating(null);
      setSelectedSeatAppointment(null);
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

  // Clean Seat Card Component (Dashboard Style)
  const SeatCard = ({ seat, onPress }: { seat: Seat; onPress: () => void }) => {
    const statusColor = getStatusColor(seat.status);
    const hasAppointment = seat.appointments.length > 0;
    const appointment = hasAppointment ? seat.appointments[0] : null;
    const isDropTarget = selectedAppointment && seat.status === 'available';

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={tw`mb-3`}
      >
        <View
          style={[
            tw`rounded-2xl p-4`,
            {
              backgroundColor: cardBg,
              borderWidth: isDropTarget ? 2 : 1,
              borderColor: isDropTarget ? SalozyColors.primary.DEFAULT : borderColor,
              borderStyle: isDropTarget ? 'dashed' : 'solid',
            },
          ]}
        >
          {/* Header with Status */}
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center flex-1`}>
              <View
                style={[
                  tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                  { backgroundColor: statusColor.bg },
                ]}
              >
                <Text
                  size="base"
                  weight="bold"
                  style={{ color: statusColor.color }}
                >
                  {seat.name.charAt(0)}
                </Text>
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

          {/* Appointment Content */}
          {hasAppointment && appointment ? (
            <View
              style={[
                tw`p-3 rounded-xl`,
                { backgroundColor: colors.secondaryBg },
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
                tw`p-4 rounded-xl items-center justify-center`,
                { 
                  backgroundColor: colors.secondaryBg,
                  minHeight: 60,
                },
              ]}
            >
              <Text size="sm" variant="secondary" style={tw`text-center`}>
                {seat.status === 'available' ? 'Drag appointment here' : 'Not available'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Appointment Card Component (Dashboard Style)
  const AppointmentCard = ({ appointment }: { appointment: UnassignedAppointment }) => {
    const isSelected = selectedAppointment?.id === appointment.id;
    const isUpdating = updating === appointment.id;

    return (
      <TouchableOpacity
        onPress={() => {
          if (isSelected) {
            setSelectedAppointment(null);
          } else {
            setSelectedAppointment(appointment);
            setSelectedSeatAppointment(null);
          }
        }}
        activeOpacity={0.7}
        style={tw`mb-3`}
      >
        <View
          style={[
            tw`rounded-2xl p-4`,
            {
              backgroundColor: cardBg,
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? SalozyColors.primary.DEFAULT : borderColor,
            },
          ]}
        >
          <View style={tw`flex-row items-center mb-3`}>
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
              <Text
                size="sm"
                weight="semibold"
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
                  tw`w-6 h-6 rounded-full items-center justify-center`,
                  { backgroundColor: SalozyColors.primary.DEFAULT },
                ]}
              >
                <Text size="xs" style={{ color: '#FFFFFF' }}>✓</Text>
              </View>
            ) : null}
          </View>

          <View style={tw`flex-row flex-wrap gap-2`}>
            {appointment.services.map((service) => (
              <View
                key={service.id}
                style={[
                  tw`px-3 py-1.5 rounded-lg`,
                  { backgroundColor: colors.secondaryBg },
                ]}
              >
                <Text size="xs" weight="semibold" variant="primary">
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
        subtitle={`${seats.length} seats • ${assignedPendingAppointments.length} approved`}
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
          {/* Approved Appointments Section */}
          {assignedPendingAppointments.length > 0 && (
            <View style={tw`mb-6`}>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text size="lg" weight="bold" variant="primary">
                  Approved Appointments
                </Text>
                <Text size="sm" variant="secondary">
                  {assignedPendingAppointments.length} {assignedPendingAppointments.length === 1 ? 'appointment' : 'appointments'}
                </Text>
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
              <Text size="sm" variant="secondary">
                {seats.length} {seats.length === 1 ? 'seat' : 'seats'}
              </Text>
            </View>
            <View style={tw`gap-3`}>
              {seats.map((seat) => {
                const hasAppointment = seat.appointments.length > 0;
                const appointment = hasAppointment ? seat.appointments[0] : null;

                return (
                  <SeatCard
                    key={seat.id}
                    seat={seat}
                    onPress={() => {
                      if (selectedAppointment) {
                        handleAssignToSeat(selectedAppointment, seat);
                      } else if (selectedSeatAppointment && selectedSeatAppointment.id !== appointment?.id) {
                        handleMoveToSeat(selectedSeatAppointment, seat);
                      } else if (appointment) {
                        setSelectedSeatAppointment(appointment);
                      } else if (seat.status === 'available' && selectedAppointment) {
                        handleAssignToSeat(selectedAppointment, seat);
                      }
                    }}
                  />
                );
              })}
            </View>
          </View>

          {/* Action Buttons for Selected Seat Appointment */}
          {selectedSeatAppointment && (
            <View
              style={[
                tw`rounded-2xl p-4 mb-6`,
                {
                  backgroundColor: cardBg,
                  borderWidth: 1,
                  borderColor: borderColor,
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
              <View style={tw`flex-row gap-2`}>
                <TouchableOpacity
                  onPress={() => handleMoveToPending(selectedSeatAppointment)}
                  disabled={updating === selectedSeatAppointment.id}
                  style={[
                    tw`flex-1 px-4 py-3 rounded-xl`,
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
                      Move to Pending
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
