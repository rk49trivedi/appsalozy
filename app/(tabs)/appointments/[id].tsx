import { AppointmentsIcon, Badge, Text } from '@/components/atoms';
import { ApproveAppointmentModal, StatusUpdateConfirmModal } from '@/components/molecules';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface AppointmentDetail {
  id: number;
  ticket_number: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  final_total?: number;
  original_total?: number;
  discount_amount?: number;
  currency_symbol?: string;
  currency_text?: string;
  notes?: string;
  app_price?: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  services?: Array<{
    id: number;
    name: string;
    price?: number;
    seat_name?: string;
    staff_name?: string;
    duration_minutes?: number;
  }>;
  appointment_services?: Array<{
    id: number;
    service_id: number;
    price: number;
    status: string;
    seat_id?: number | null;
    service?: {
      id: number;
      name: string;
    };
  }>;
  branch?: {
    id: number;
    name: string;
  };
}

interface SeatOption {
  id: number;
  name: string;
}

export default function AppointmentDetailScreen() {
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
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [seatOptions, setSeatOptions] = useState<SeatOption[]>([]);
  const [seatLoading, setSeatLoading] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'completed' | 'cancelled' | null>(null);
  const [showBottomButtons, setShowBottomButtons] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const bottomButtonOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchAppointment = async () => {
    if (!isAuthenticated || !id) return;

    try {
      setLoading(true);
      const response = await apiClient.get<AppointmentDetail>(API_ENDPOINTS.APPOINTMENT_BY_ID(id));
      
      if (response.success && response.data) {
        setAppointment(response.data);
      } else {
        showToast.error('Failed to load appointment details', 'Error');
        router.back();
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await apiClient.logout();
        router.replace('/login');
        return;
      }
      showToast.error(apiError.message || 'Failed to load appointment details', 'Error');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isChecking && id) {
      fetchAppointment();
    }
  }, [isAuthenticated, isChecking, id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointment();
  };

  const handleDelete = () => {
    if (!appointment) return;

    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete this appointment for ${appointment.user?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const response = await apiClient.delete(API_ENDPOINTS.APPOINTMENT_BY_ID(id!));
              
              if (response.success) {
                showToast.success(response.message || 'Appointment deleted successfully', 'Success');
                router.replace('/(tabs)/appointments');
              } else {
                showToast.error(response.message || 'Failed to delete appointment', 'Error');
              }
            } catch (err: any) {
              const apiError = err as ApiError;
              showToast.error(apiError.message || 'Failed to delete appointment', 'Error');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusVariant = (status: string): 'success' | 'error' | 'warning' | 'info' | 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'approved' => {
    const normalizedStatus = status?.toLowerCase() || '';
    switch (normalizedStatus) {
      case 'pending':
        return 'pending';
      case 'approved':
        return 'approved';
      case 'in_progress':
      case 'inprogress':
        return 'inProgress';
      case 'completed':
        return 'completed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      default:
        return 'info';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          bg: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)', 
          text: SalozyColors.status.warning 
        };
      case 'approved':
        return { 
          bg: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)', 
          text: SalozyColors.status.success 
        };
      case 'in_progress':
        return { 
          bg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', 
          text: SalozyColors.status.info 
        };
      case 'completed':
        return { 
          bg: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)', 
          text: SalozyColors.status.success 
        };
      case 'cancelled':
        return { 
          bg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', 
          text: SalozyColors.status.error 
        };
      default:
        return { 
          bg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', 
          text: SalozyColors.status.info 
        };
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return String(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return String(dateString || 'N/A');
    }
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    try {
      const timeStr = String(timeString);
      if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        if (isNaN(hour)) return timeStr;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      }
      return timeStr;
    } catch {
      return String(timeString || 'N/A');
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

  if (loading && !appointment) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Loading appointment...</Text>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center px-4`, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={tw`text-lg font-semibold mb-2`} variant="primary">Appointment not found</Text>
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

  const hasSeatOrStaff = appointment.services && 
    Array.isArray(appointment.services) && 
    appointment.services.length > 0 &&
    (appointment.services[0]?.seat_name || appointment.services[0]?.staff_name);
  
  const displayStatus = (appointment.status === 'pending' && hasSeatOrStaff) 
    ? 'approved' 
    : (appointment.status || 'pending');
  
  const statusConfig = getStatusColor(displayStatus);
  const canEdit = !['completed', 'cancelled', 'in_progress'].includes(appointment.status);
  const canDelete = ['pending', 'cancelled'].includes(appointment.status);
  const canApproveQuickly = displayStatus === 'pending' && !hasSeatOrStaff;
  const canUpdateStatus = appointment.status === 'in_progress';

  const openApproveModal = async () => {
    setApproveModalVisible(true);
    setSelectedSeatId(null);

    if (seatOptions.length === 0) {
      try {
        setSeatLoading(true);
        const response = await apiClient.get<any>(API_ENDPOINTS.APPOINTMENT_FORM_DATA);
        if (response.success && response.data?.seats) {
          setSeatOptions(response.data.seats);
        }
      } catch (err: any) {
        const apiError = err as ApiError;
        showToast.error(apiError.message || 'Failed to load seats', 'Error');
      } finally {
        setSeatLoading(false);
      }
    }
  };

  const closeApproveModal = () => {
    setApproveModalVisible(false);
    setSelectedSeatId(null);
  };

  const handleApprove = async () => {
    if (!appointment || !selectedSeatId) {
      showToast.error('Please select a seat to approve', 'Validation Error');
      return;
    }

    try {
      setApproving(true);

      let servicesPayload: Array<{ id: number }> = [];
      if (appointment.appointment_services && appointment.appointment_services.length > 0) {
        servicesPayload = appointment.appointment_services
          .filter((s) => s && s.service_id)
          .map((s) => ({ id: s.service_id }));
      } else if (appointment.services && appointment.services.length > 0) {
        servicesPayload = appointment.services
          .filter((s) => s && s.id)
          .map((s) => ({ id: s.id }));
      }

      if (servicesPayload.length === 0) {
        showToast.error('No services found for this appointment', 'Error');
        setApproving(false);
        return;
      }

      const rawTime = appointment.appointment_time || '';
      const timeValue =
        rawTime.length >= 5 ? rawTime.slice(0, 5) : rawTime;

      const payload: any = {
        user_id: appointment.user.id,
        appointment_date: appointment.appointment_date,
        appointment_time: timeValue,
        services: servicesPayload,
        status: 'pending',
        seat_id: selectedSeatId,
        notes: appointment.notes || null,
        staff_id: null,
      };

      const response = await apiClient.put(
        API_ENDPOINTS.APPOINTMENT_UPDATE(appointment.id),
        payload,
      );

      if (response.success) {
        showToast.success(
          response.message || 'Appointment approved successfully',
          'Success',
        );
        closeApproveModal();
        fetchAppointment();
      } else {
        showToast.error(
          response.message || 'Failed to approve appointment',
          'Error',
        );
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to approve appointment', 'Error');
    } finally {
      setApproving(false);
    }
  };

  const handleUpdateStatusClick = (status: 'completed' | 'cancelled') => {
    setConfirmAction(status);
    setConfirmModalVisible(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!appointment || !confirmAction) return;

    try {
      setUpdatingStatus(true);
      setConfirmModalVisible(false);
      
      const response = await apiClient.put(
        API_ENDPOINTS.APPOINTMENT_UPDATE_STATUS(appointment.id),
        { status: confirmAction },
      );

      if (response.success) {
        showToast.success(
          response.message || `Appointment ${confirmAction === 'completed' ? 'completed' : 'cancelled'} successfully`,
          'Success',
        );
        fetchAppointment();
      } else {
        showToast.error(
          response.message || `Failed to ${confirmAction === 'completed' ? 'complete' : 'cancel'} appointment`,
          'Error',
        );
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || `Failed to ${confirmAction === 'completed' ? 'complete' : 'cancel'} appointment`, 'Error');
    } finally {
      setUpdatingStatus(false);
      setConfirmAction(null);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmModalVisible(false);
    setConfirmAction(null);
  };

  const getStaffName = (): string | null => {
    if (appointment?.status === 'in_progress' && appointment.services && Array.isArray(appointment.services)) {
      const serviceWithStaff = appointment.services.find(service => service.staff_name);
      if (serviceWithStaff?.staff_name) {
        return String(serviceWithStaff.staff_name);
      }
    }
    return null;
  };

  return (
    <SafeAreaView
      style={[tw`flex-1`, { backgroundColor: bgColor }]}
      edges={['top']}
    >
      <GlobalHeader
        title={`#${appointment.ticket_number}`}
        subtitle={appointment.user?.name || 'Unknown User'}
        showBackButton={true}
        rightAction={
          canDelete ? (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleting}
              style={[
                tw`px-4 py-2 rounded-xl`,
                { 
                  backgroundColor: deleting ? colors.secondaryBg : SalozyColors.status.error,
                  opacity: deleting ? 0.6 : 1,
                }
              ]}
              activeOpacity={0.8}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text size="sm" weight="bold" style={{ color: '#FFFFFF' }}>
                  Delete
                </Text>
              )}
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-20`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={SalozyColors.primary.DEFAULT}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            listener: (event: any) => {
              const offsetY = event.nativeEvent.contentOffset.y;
              const scrollingDown = offsetY > 50;
              
              if (scrollingDown && showBottomButtons) {
                setShowBottomButtons(false);
                Animated.timing(bottomButtonOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
              } else if (!scrollingDown && !showBottomButtons) {
                setShowBottomButtons(true);
                Animated.timing(bottomButtonOpacity, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
              }
            },
            useNativeDriver: false,
          }
        )}
        scrollEventThrottle={16}
      >
        <View style={tw`px-4 mt-2 gap-4`}>
          {/* Header Card with Customer Info */}
          <View style={[
            tw`rounded-3xl p-5`,
            { 
              backgroundColor: cardBg, 
              borderWidth: 1, 
              borderColor,
              shadowColor: isDark ? '#000000' : '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }
          ]}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View
                  style={[
                    tw`w-16 h-16 rounded-full items-center justify-center mr-4`,
                    { backgroundColor: statusConfig.bg },
                  ]}
                >
                  <AppointmentsIcon
                    size={28}
                    color={statusConfig.text}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-xl font-bold mb-1`, { color: textPrimary }]}>
                    {appointment.user?.name || 'Unknown User'}
                  </Text>
                  <Text style={[tw`text-sm`, { color: textSecondary }]}>
                    {appointment.user?.email || 'No email'}
                  </Text>
                  {appointment.user?.phone && (
                    <Text style={[tw`text-sm mt-1`, { color: textSecondary }]}>
                      {appointment.user.phone}
                    </Text>
                  )}
                  {appointment.status === 'in_progress' && getStaffName() && (
                    <View style={[tw`mt-2 px-3 py-1.5 rounded-lg self-start`, { backgroundColor: colors.secondaryBg }]}>
                      <Text size="sm" weight="semibold" style={{ color: SalozyColors.status.info }}>
                        👤 Staff: {getStaffName()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Badge variant={getStatusVariant(displayStatus)}>
                {displayStatus === 'pending' && hasSeatOrStaff
                  ? 'Approved'
                  : String(displayStatus || '')
                      .replace('_', ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            </View>
            
            {/* Ticket Number */}
            <View style={[
              tw`flex-row items-center justify-between pt-4 border-t`,
              { borderColor: colors.border }
            ]}>
              <Text style={[tw`text-sm font-semibold`, { color: textSecondary }]}>
                Ticket Number
              </Text>
              <Text style={[tw`text-base font-bold`, { color: SalozyColors.primary.DEFAULT }]}>
                #{appointment.ticket_number}
              </Text>
            </View>
          </View>

          {/* Appointment Details Card */}
          <View style={[
            tw`rounded-3xl p-5`,
            { 
              backgroundColor: cardBg, 
              borderWidth: 1, 
              borderColor,
              shadowColor: isDark ? '#000000' : '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Appointment Details
            </Text>
            <View style={tw`gap-4`}>
              <View style={[
                tw`flex-row items-center p-4 rounded-2xl`,
                { backgroundColor: colors.secondaryBg }
              ]}>
                <View style={tw`flex-1`}>
                  <Text size="xs" variant="secondary" style={tw`mb-2`}>Date</Text>
                  <Text size="lg" weight="bold" variant="primary">
                    {formatDate(appointment.appointment_date)}
                  </Text>
                </View>
                <View style={[tw`w-px h-12 mx-4`, { backgroundColor: colors.border }]} />
                <View style={tw`flex-1`}>
                  <Text size="xs" variant="secondary" style={tw`mb-2`}>Time</Text>
                  <Text size="lg" weight="bold" variant="primary">
                    {formatTime(appointment.appointment_time)}
                  </Text>
                </View>
              </View>
              {appointment.branch && (
                <View style={[
                  tw`p-4 rounded-2xl`,
                  { backgroundColor: colors.secondaryBg }
                ]}>
                  <Text size="xs" variant="secondary" style={tw`mb-2`}>Branch</Text>
                  <Text size="base" weight="semibold" variant="primary">{appointment.branch.name}</Text>
                </View>
              )}
            </View>
          </View>

          {((appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) || 
            (appointment.appointment_services && Array.isArray(appointment.appointment_services) && appointment.appointment_services.length > 0)) && (
            <View style={[
              tw`rounded-3xl p-5`,
              { 
                backgroundColor: cardBg, 
                borderWidth: 1, 
                borderColor,
                shadowColor: isDark ? '#000000' : '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }
            ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Services ({(appointment.appointment_services?.length || appointment.services?.length || 0)})
            </Text>
              <View style={tw`gap-2`}>
                {(() => {
                  if (appointment.appointment_services && Array.isArray(appointment.appointment_services) && appointment.appointment_services.length > 0) {
                    return appointment.appointment_services.map((aptService, index) => {
                      const serviceName = aptService.service?.name || `Service ${aptService.service_id || 'N/A'}`;
                      const servicePrice = (aptService.price !== null && aptService.price !== undefined && typeof aptService.price === 'number')
                        ? aptService.price.toFixed(2)
                        : '0.00';
                      
                      return (
                        <View 
                          key={`apt-service-${aptService.id || index}`} 
                          style={[
                            tw`flex-row justify-between items-center p-4 rounded-2xl mb-2`,
                            { backgroundColor: colors.secondaryBg }
                          ]}
                        >
                          <View style={tw`flex-1 mr-3`}>
                            <Text size="base" weight="semibold" variant="primary">
                              {String(serviceName)}
                            </Text>
                          </View>
                          <Text size="lg" weight="bold" variant="primary">
                            {String(appointment.currency_symbol || '₹')}{String(servicePrice)}
                          </Text>
                        </View>
                      );
                    });
                  }
                  
                  if (appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) {
                    return appointment.services.map((service, index) => {
                      const servicePrice = typeof service.price === 'number' ? service.price.toFixed(2) : '0.00';
                      
                      return (
                        <View 
                          key={`service-${service.id || index}`} 
                          style={[
                            tw`flex-row justify-between items-center p-4 rounded-2xl mb-2`,
                            { backgroundColor: colors.secondaryBg }
                          ]}
                        >
                          <View style={tw`flex-1 mr-3`}>
                            <Text size="base" weight="semibold" variant="primary" style={tw`mb-1`}>
                              {String(service.name)}
                            </Text>
                            {(service.seat_name || service.staff_name) && (
                              <View style={tw`mt-2 flex-row gap-3 flex-wrap`}>
                                {service.seat_name && (
                                  <View style={[tw`px-2 py-1 rounded-lg`, { backgroundColor: cardBg }]}>
                                    <Text size="xs" variant="secondary" weight="medium">
                                      🪑 Seat: {String(service.seat_name)}
                                    </Text>
                                  </View>
                                )}
                                {service.staff_name && (
                                  <View style={[tw`px-2 py-1 rounded-lg`, { backgroundColor: cardBg }]}>
                                    <Text size="xs" variant="secondary" weight="medium">
                                      👤 Staff: {String(service.staff_name)}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                          <Text size="lg" weight="bold" variant="primary">
                            {String(appointment.currency_symbol || '₹')}{String(servicePrice)}
                          </Text>
                        </View>
                      );
                    });
                  }
                  
                  return null;
                })()}
              </View>
            </View>
          )}

          <View style={[
            tw`rounded-3xl p-5`,
            { 
              backgroundColor: cardBg, 
              borderWidth: 1, 
              borderColor,
              shadowColor: isDark ? '#000000' : '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Pricing Summary
            </Text>
            <View style={tw`gap-4`}>
              {(() => {
                const totalPrice = appointment.app_price || appointment.original_total || 0;
                const couponDiscount = appointment.discount_amount || 0;
                const finalAmount = appointment.final_total || totalPrice;
                
                if (couponDiscount > 0 || (appointment.original_total && appointment.original_total !== finalAmount)) {
                  return (
                    <View>
                      <View style={[
                        tw`flex-row justify-between items-center p-4 rounded-2xl mb-3`,
                        { backgroundColor: colors.secondaryBg }
                      ]}>
                        <Text style={[tw`text-base`, { color: textSecondary }]}>Subtotal:</Text>
                        <Text style={[tw`text-base font-semibold`, { color: textPrimary }]}>
                          {String(appointment.currency_symbol || '₹')}{String(typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00')}
                        </Text>
                      </View>
                      {couponDiscount > 0 && (
                        <View style={[
                          tw`flex-row justify-between items-center p-4 rounded-2xl mb-3`,
                          { backgroundColor: colors.secondaryBg }
                        ]}>
                          <Text style={[tw`text-base`, { color: textSecondary }]}>Coupon Discount:</Text>
                          <Text style={[tw`text-base font-semibold`, { color: SalozyColors.status.success }]}>
                            -{String(appointment.currency_symbol || '₹')}{String(typeof couponDiscount === 'number' ? couponDiscount.toFixed(2) : '0.00')}
                          </Text>
                        </View>
                      )}
                      <View style={[
                        tw`flex-row justify-between items-center p-5 rounded-2xl`,
                        { 
                          backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                          borderWidth: 2,
                          borderColor: SalozyColors.status.success,
                        }
                      ]}>
                        <Text style={[tw`text-xl font-bold`, { color: textPrimary }]}>Final Amount:</Text>
                        <Text style={[tw`text-2xl font-bold`, { color: SalozyColors.status.success }]}>
                          {String(appointment.currency_symbol || '₹')}{String(typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00')}
                        </Text>
                      </View>
                    </View>
                  );
                }
                
                return (
                  <View style={[
                    tw`flex-row justify-between items-center p-5 rounded-2xl`,
                    { 
                      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                      borderWidth: 2,
                      borderColor: SalozyColors.status.success,
                    }
                  ]}>
                    <Text style={[tw`text-xl font-bold`, { color: textPrimary }]}>Total Amount:</Text>
                    <Text style={[tw`text-2xl font-bold`, { color: SalozyColors.status.success }]}>
                      {String(appointment.currency_symbol || '₹')}{String(typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00')}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>

          {appointment.notes && (
            <View style={[
              tw`rounded-3xl p-5`,
              { 
                backgroundColor: cardBg, 
                borderWidth: 1, 
                borderColor,
                shadowColor: isDark ? '#000000' : '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }
            ]}>
              <Text style={[tw`text-lg font-bold mb-3`, { color: textPrimary }]}>
                Notes
              </Text>
              <Text style={[tw`text-base leading-6`, { color: textPrimary }]}>{appointment.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Buttons */}
      {(canApproveQuickly || canEdit || canUpdateStatus) && (
        <Animated.View
          style={[
            tw`absolute bottom-0 left-0 right-0`,
            { 
              backgroundColor: cardBg,
              borderTopWidth: 1,
              borderTopColor: borderColor,
              shadowColor: isDark ? '#000000' : '#000000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
              opacity: bottomButtonOpacity,
              transform: [
                {
                  translateY: bottomButtonOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            }
          ]}
        >
          <SafeAreaView edges={['left', 'right']} style={tw`px-4 py-2`}>
            <View style={tw`flex-row items-center gap-2`}>
              {canApproveQuickly && (
                <TouchableOpacity
                  onPress={openApproveModal}
                  style={[
                    tw`flex-1 px-5 py-3 rounded-2xl border-2`,
                    { borderColor: SalozyColors.primary.DEFAULT },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    size="base"
                    weight="semibold"
                    style={{ color: SalozyColors.primary.DEFAULT, textAlign: 'center' }}
                  >
                    Approve 
                  </Text>
                </TouchableOpacity>
              )}
              {canUpdateStatus && (
                <>
                  <TouchableOpacity
                    onPress={() => handleUpdateStatusClick('completed')}
                    disabled={updatingStatus}
                    style={[
                      tw`flex-1 px-4 py-3 rounded-2xl`,
                      { 
                        backgroundColor: updatingStatus 
                          ? colors.secondaryBg 
                          : SalozyColors.status.success,
                        opacity: updatingStatus ? 0.6 : 1,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    {updatingStatus ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text size="base" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                        Mark Complete
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleUpdateStatusClick('cancelled')}
                    disabled={updatingStatus}
                    style={[
                      tw`flex-1 px-4 py-3 rounded-2xl`,
                      { 
                        backgroundColor: updatingStatus 
                          ? colors.secondaryBg 
                          : SalozyColors.status.error,
                        opacity: updatingStatus ? 0.6 : 1,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    {updatingStatus ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text size="base" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                        Mark Cancelled
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
              {canEdit && (
                <TouchableOpacity
                  onPress={() => router.push(`/(tabs)/appointments/${id}/edit`)}
                  style={[
                    tw`flex-1 px-5 py-3 rounded-2xl`,
                    { backgroundColor: SalozyColors.primary.DEFAULT }
                  ]}
                  activeOpacity={0.8}
                >
                  <Text size="base" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                    Edit
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {canApproveQuickly && (
        <ApproveAppointmentModal
          visible={approveModalVisible}
          appointment={appointment}
          seatOptions={seatOptions}
          selectedSeatId={selectedSeatId}
          loading={seatLoading}
          approving={approving}
          onSelectSeat={setSelectedSeatId}
          onConfirm={handleApprove}
          onCancel={closeApproveModal}
          formatDate={formatDate}
          formatTime={formatTime}
        />
      )}

      <StatusUpdateConfirmModal
        visible={confirmModalVisible}
        status={confirmAction || 'completed'}
        onConfirm={handleConfirmStatusUpdate}
        onCancel={handleCancelConfirm}
      />
    </SafeAreaView>
  );
}

