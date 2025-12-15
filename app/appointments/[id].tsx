import { AppointmentsIcon, Badge, Card, Text } from '@/components/atoms';
import { useSidebar } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  const { openSidebar } = useSidebar();
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Quick approve state
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [seatOptions, setSeatOptions] = useState<SeatOption[]>([]);
  const [seatLoading, setSeatLoading] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);

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
                router.replace('/appointments');
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

  return (
    <SafeAreaView
      style={[tw`flex-1`, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Modern hero header */}
      <LinearGradient
        colors={['#111827', '#1F2937']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`px-4 pt-5 pb-6 rounded-b-3xl`}
      >
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              tw`w-10 h-10 rounded-full items-center justify-center`,
              { backgroundColor: 'rgba(31,41,55,0.9)' },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[tw`text-xl`, { color: '#F9FAFB' }]}>←</Text>
          </TouchableOpacity>

          <View style={tw`flex-1 ml-4`}>
            <Text
              size="xs"
              variant="secondary"
              style={{ color: '#9CA3AF' }}
            >
              Appointment
            </Text>
            <Text
              size="2xl"
              weight="bold"
              style={{ color: '#F9FAFB', marginTop: 4 }}
            >
              #{appointment.ticket_number}
            </Text>
          </View>
        </View>

        <View style={tw`mt-4 flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <View
              style={[
                tw`w-11 h-11 rounded-full items-center justify-center mr-3`,
                { backgroundColor: statusConfig.bg },
              ]}
            >
              <AppointmentsIcon
                size={24}
                color={statusConfig.text}
              />
            </View>
            <View>
              <Text
                size="lg"
                weight="bold"
                style={{ color: '#F9FAFB' }}
              >
                {appointment.user?.name || 'Unknown User'}
              </Text>
              <Text
                size="xs"
                style={{ color: '#9CA3AF', marginTop: 2 }}
              >
                {appointment.user?.email || 'No email'}
              </Text>
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
      </LinearGradient>

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
        <View style={tw`px-4 mt-4 gap-4`}>
          {/* Customer Information */}
          <Card style={tw`p-5`}>
            <Text size="lg" weight="bold" variant="primary" style={tw`mb-4`}>
              Customer Information
            </Text>
            <View style={tw`gap-3`}>
              <View style={tw`flex-row justify-between`}>
                <Text variant="secondary">Name:</Text>
                <Text variant="primary" weight="semibold">{appointment.user?.name || 'N/A'}</Text>
              </View>
              <View style={tw`flex-row justify-between`}>
                <Text variant="secondary">Email:</Text>
                <Text variant="primary" weight="semibold">{appointment.user?.email || 'N/A'}</Text>
              </View>
              {appointment.user?.phone && (
                <View style={tw`flex-row justify-between`}>
                  <Text variant="secondary">Phone:</Text>
                  <Text variant="primary" weight="semibold">{appointment.user.phone}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Appointment Details */}
          <Card style={tw`p-5`}>
            <Text size="lg" weight="bold" variant="primary" style={tw`mb-4`}>
              Appointment Details
            </Text>
            <View style={tw`gap-3`}>
              <View style={[
                tw`flex-row items-center p-3 rounded-xl`,
                { backgroundColor: colors.secondaryBg }
              ]}>
                <View style={tw`flex-1`}>
                  <Text size="xs" variant="secondary" style={tw`mb-1`}>Date</Text>
                  <Text size="base" weight="bold" variant="primary">
                    {formatDate(appointment.appointment_date)}
                  </Text>
                </View>
                <View style={[tw`w-px h-8`, { backgroundColor: colors.border }]} />
                <View style={tw`flex-1`}>
                  <Text size="xs" variant="secondary" style={tw`mb-1`}>Time</Text>
                  <Text size="base" weight="bold" variant="primary">
                    {formatTime(appointment.appointment_time)}
                  </Text>
                </View>
              </View>
              {appointment.branch && (
                <View style={tw`flex-row justify-between`}>
                  <Text variant="secondary">Branch:</Text>
                  <Text variant="primary" weight="semibold">{appointment.branch.name}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Services */}
          {((appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) || 
            (appointment.appointment_services && Array.isArray(appointment.appointment_services) && appointment.appointment_services.length > 0)) && (
            <Card style={tw`p-5`}>
              <Text size="lg" weight="bold" variant="primary" style={tw`mb-4`}>
                Services ({(appointment.appointment_services?.length || appointment.services?.length || 0)})
              </Text>
              <View style={tw`gap-3`}>
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
                            tw`flex-row justify-between items-center p-3 rounded-xl`,
                            { backgroundColor: colors.secondaryBg }
                          ]}
                        >
                          <View style={tw`flex-1`}>
                            <Text size="sm" weight="semibold" variant="primary">
                              {String(serviceName)}
                            </Text>
                            {aptService.status && (
                              <View style={tw`mt-1`}>
                                <Badge 
                                  variant={getStatusVariant(aptService.status)} 
                                  style={tw`self-start`}
                                >
                                  {String(aptService.status || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                              </View>
                            )}
                          </View>
                          <Text size="base" weight="bold" variant="primary">
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
                            tw`flex-row justify-between items-center p-3 rounded-xl`,
                            { backgroundColor: colors.secondaryBg }
                          ]}
                        >
                          <View style={tw`flex-1`}>
                            <Text size="sm" weight="semibold" variant="primary">
                              {String(service.name)}
                            </Text>
                            {(service.seat_name || service.staff_name) && (
                              <View style={tw`mt-1 flex-row gap-2`}>
                                {service.seat_name && (
                                  <Text size="xs" variant="tertiary">
                                    Seat: {String(service.seat_name)}
                                  </Text>
                                )}
                                {service.staff_name && (
                                  <Text size="xs" variant="tertiary">
                                    Staff: {String(service.staff_name)}
                                  </Text>
                                )}
                              </View>
                            )}
                          </View>
                          <Text size="base" weight="bold" variant="primary">
                            {String(appointment.currency_symbol || '₹')}{String(servicePrice)}
                          </Text>
                        </View>
                      );
                    });
                  }
                  
                  return null;
                })()}
              </View>
            </Card>
          )}

          {/* Pricing */}
          <Card style={tw`p-5`}>
            <Text size="lg" weight="bold" variant="primary" style={tw`mb-4`}>
              Pricing
            </Text>
            <View style={tw`gap-3`}>
              {(() => {
                const totalPrice = appointment.app_price || appointment.original_total || 0;
                const couponDiscount = appointment.discount_amount || 0;
                const finalAmount = appointment.final_total || totalPrice;
                
                if (couponDiscount > 0 || (appointment.original_total && appointment.original_total !== finalAmount)) {
                  return (
                    <View>
                      <View style={tw`flex-row justify-between mb-2`}>
                        <Text variant="secondary">Total:</Text>
                        <Text variant="primary" weight="semibold">
                          {String(appointment.currency_symbol || '₹')}{String(typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00')}
                        </Text>
                      </View>
                      {couponDiscount > 0 && (
                        <View style={tw`flex-row justify-between mb-2`}>
                          <Text variant="secondary">Coupon Discount:</Text>
                          <Text variant="primary" weight="semibold" style={{ color: SalozyColors.status.success }}>
                            -{String(appointment.currency_symbol || '₹')}{String(typeof couponDiscount === 'number' ? couponDiscount.toFixed(2) : '0.00')}
                          </Text>
                        </View>
                      )}
                      <View style={[
                        tw`flex-row justify-between pt-3 border-t`,
                        { borderColor: colors.border }
                      ]}>
                        <Text size="lg" weight="bold" variant="primary">Final Amount:</Text>
                        <Text size="lg" weight="bold" variant="primary" style={{ color: SalozyColors.status.success }}>
                          {String(appointment.currency_symbol || '₹')}{String(typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00')}
                        </Text>
                      </View>
                    </View>
                  );
                }
                
                return (
                  <View style={tw`flex-row justify-between`}>
                    <Text size="lg" weight="bold" variant="primary">Total Amount:</Text>
                    <Text size="lg" weight="bold" variant="primary" style={{ color: SalozyColors.status.success }}>
                      {String(appointment.currency_symbol || '₹')}{String(typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00')}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </Card>

          {/* Notes */}
          {appointment.notes && (
            <Card style={tw`p-5`}>
              <Text size="lg" weight="bold" variant="primary" style={tw`mb-3`}>
                Notes
              </Text>
              <Text variant="primary">{appointment.notes}</Text>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={tw`flex-row gap-3`}>
            {canApproveQuickly && (
              <TouchableOpacity
                onPress={openApproveModal}
                style={[
                  tw`flex-1 px-5 py-3 rounded-xl border`,
                  { borderColor: SalozyColors.primary.DEFAULT },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  size="sm"
                  weight="semibold"
                  style={{ color: SalozyColors.primary.DEFAULT, textAlign: 'center' }}
                >
                  Approve & Select Seat
                </Text>
              </TouchableOpacity>
            )}
            {canEdit && (
              <TouchableOpacity
                onPress={() => router.push(`/appointments/${id}/edit`)}
                style={[
                  tw`flex-1 px-5 py-3 rounded-xl`,
                  { backgroundColor: SalozyColors.primary.DEFAULT }
                ]}
                activeOpacity={0.8}
              >
                <Text size="sm" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting}
                style={[
                  tw`flex-1 px-5 py-3 rounded-xl`,
                  { backgroundColor: deleting ? colors.secondaryBg : SalozyColors.status.error }
                ]}
                activeOpacity={0.8}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text size="sm" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Quick Approve Modal */}
      {canApproveQuickly && (
        <Modal
          visible={approveModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeApproveModal}
        >
          <SafeAreaView style={tw`flex-1 justify-end bg-black/40`} edges={['bottom']}>
            <View
              style={[
                tw`rounded-t-3xl px-5 pt-4 pb-6`,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={tw`items-center mb-3`}>
                <View
                  style={tw`w-10 h-1.5 rounded-full bg-gray-300 mb-3`}
                />
                <Text size="lg" weight="bold" variant="primary">
                  Approve Appointment
                </Text>
                <Text size="sm" variant="secondary" style={tw`mt-1`}>
                  {appointment.user?.name} • #{appointment.ticket_number}
                </Text>
              </View>

              <View
                style={[
                  tw`flex-row items-center mb-4 p-3 rounded-2xl`,
                  { backgroundColor: colors.secondaryBg },
                ]}
              >
                <View style={tw`flex-1`}>
                  <Text
                    size="xs"
                    variant="secondary"
                    style={tw`mb-1`}
                  >
                    Date
                  </Text>
                  <Text
                    size="sm"
                    weight="semibold"
                    variant="primary"
                  >
                    {formatDate(appointment.appointment_date)}
                  </Text>
                </View>
                <View
                  style={[
                    tw`w-px h-8 mx-3`,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View style={tw`flex-1`}>
                  <Text
                    size="xs"
                    variant="secondary"
                    style={tw`mb-1`}
                  >
                    Time
                  </Text>
                  <Text
                    size="sm"
                    weight="semibold"
                    variant="primary"
                  >
                    {formatTime(appointment.appointment_time)}
                  </Text>
                </View>
              </View>

              <Text
                size="sm"
                weight="semibold"
                variant="secondary"
                style={tw`mb-2`}
              >
                Select Seat
              </Text>

              {seatLoading ? (
                <View style={tw`py-4 items-center`}>
                  <ActivityIndicator
                    size="small"
                    color={SalozyColors.primary.DEFAULT}
                  />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`flex-row gap-2 mb-4`}
                >
                  {seatOptions.map((seat) => (
                    <TouchableOpacity
                      key={seat.id}
                      onPress={() => setSelectedSeatId(seat.id)}
                      style={[
                        tw`px-4 py-2 rounded-full border`,
                        {
                          borderColor:
                            selectedSeatId === seat.id
                              ? SalozyColors.primary.DEFAULT
                              : colors.border,
                          backgroundColor:
                            selectedSeatId === seat.id
                              ? SalozyColors.primary.DEFAULT
                              : colors.secondaryBg,
                        },
                      ]}
                    >
                      <Text
                        size="sm"
                        weight="semibold"
                        style={{
                          color:
                            selectedSeatId === seat.id
                              ? '#FFFFFF'
                              : colors.textPrimary,
                        }}
                      >
                        {seat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {seatOptions.length === 0 && !seatLoading && (
                    <View style={tw`py-2`}>
                      <Text size="sm" variant="secondary">
                        No available seats found.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}

              <View style={tw`flex-row gap-3 mt-2`}>
                <TouchableOpacity
                  onPress={closeApproveModal}
                  style={[
                    tw`flex-1 px-4 py-3 rounded-xl border`,
                    { borderColor: colors.border },
                  ]}
                  disabled={approving}
                >
                  <Text
                    size="sm"
                    weight="semibold"
                    variant="secondary"
                    style={{ textAlign: 'center' }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApprove}
                  disabled={approving || !selectedSeatId}
                  style={[
                    tw`flex-1 px-4 py-3 rounded-xl`,
                    {
                      backgroundColor:
                        approving || !selectedSeatId
                          ? colors.secondaryBg
                          : SalozyColors.primary.DEFAULT,
                    },
                  ]}
                >
                  {approving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      size="sm"
                      weight="bold"
                      style={{ color: '#FFFFFF', textAlign: 'center' }}
                    >
                      Approve & Notify
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
