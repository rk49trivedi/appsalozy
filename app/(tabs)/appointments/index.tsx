import { AppointmentsIcon, Input, SearchIcon, Text } from '@/components/atoms';
import { ApproveAppointmentModal, DatePicker, StatusUpdateConfirmModal } from '@/components/molecules';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface Appointment {
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
    pivot?: {
      status?: string;
      price?: number;
    };
  }>;
  branch?: {
    id: number;
    name: string;
  };
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
}

interface SeatOption {
  id: number;
  name: string;
}

interface AppointmentsResponse {
  success?: boolean;
  data?: {
    data: Appointment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function AppointmentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  const [filterAnimation] = useState(new Animated.Value(1));

  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Appointment | null>(null);
  const [seatOptions, setSeatOptions] = useState<SeatOption[]>([]);
  const [seatLoading, setSeatLoading] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ appointmentId: number; status: 'completed' | 'cancelled' } | null>(null);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchAppointments = useCallback(async (page = 1, status?: string | null, date?: string) => {
    if (!isAuthenticated) return;

    try {
      setError(null);
      const params = new URLSearchParams();
      if (status && status !== 'all') {
        params.append('status', status);
      } else if (status === 'all') {
        params.append('status', 'all');
      }
      if (date) {
        params.append('date', date);
      }
      params.append('page', page.toString());

      const endpoint = `/appointments${params.toString() ? `?${params.toString()}` : ''}`;
      const response: AppointmentsResponse = await apiClient.get(endpoint);

      if (response.success && response.data) {
        setAppointments(response.data.data || []);
        setCurrentPage(response.data.current_page || 1);
        setLastPage(response.data.last_page || 1);
      } else {
        setError('Failed to load appointments');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await apiClient.logout();
        router.replace('/login');
        return;
      }
      setError(apiError.message || 'Failed to load appointments');
      showToast.error(apiError.message || 'Failed to load appointments', 'Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      fetchAppointments(1, statusFilter, dateFilter);
    }
  }, [isAuthenticated, isChecking, statusFilter, dateFilter, fetchAppointments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments(1, statusFilter, dateFilter);
  }, [fetchAppointments, statusFilter, dateFilter]);

  const loadMore = useCallback(async () => {
    if (currentPage < lastPage && !loading && !refreshing) {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        } else if (statusFilter === 'all') {
          params.append('status', 'all');
        }
        if (dateFilter) {
          params.append('date', dateFilter);
        }
        params.append('page', (currentPage + 1).toString());

        const endpoint = `/appointments${params.toString() ? `?${params.toString()}` : ''}`;
        const response: AppointmentsResponse = await apiClient.get(endpoint);

        if (response.success && response.data && response.data.data) {
          const data = response.data;
          setAppointments(prev => [...prev, ...data.data]);
          setCurrentPage(data.current_page || currentPage + 1);
          setLastPage(data.last_page || lastPage);
        }
      } catch (err: any) {
        const apiError = err as ApiError;
        showToast.error(apiError.message || 'Failed to load more appointments', 'Error');
      } finally {
        setLoading(false);
      }
    }
  }, [currentPage, lastPage, loading, refreshing, statusFilter]);

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
        weekday: 'short',
        month: 'short', 
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

  const filteredAppointments = appointments.filter(apt => {
    if (!searchQuery) return true;
    if (!apt || !apt.user) return false;
    const query = searchQuery.toLowerCase();
    return (
      (apt.ticket_number && String(apt.ticket_number).toLowerCase().includes(query)) ||
      (apt.user?.name && String(apt.user.name).toLowerCase().includes(query)) ||
      (apt.user?.email && String(apt.user.email).toLowerCase().includes(query)) ||
      (apt.user?.phone && String(apt.user.phone).toLowerCase().includes(query))
    );
  });

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

  if (loading && appointments.length === 0) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Loading appointments...</Text>
      </SafeAreaView>
    );
  }

  const openApproveModal = async (appointment: Appointment) => {
    setApproveTarget(appointment);
    setSelectedSeatId(null);
    setApproveModalVisible(true);

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
    setApproveTarget(null);
    setSelectedSeatId(null);
  };

  const handleApprove = async () => {
    if (!approveTarget || !selectedSeatId) {
      showToast.error('Please select a seat to approve', 'Validation Error');
      return;
    }

    try {
      setApproving(true);

      let servicesPayload: Array<{ id: number }> = [];
      if (approveTarget.appointment_services && approveTarget.appointment_services.length > 0) {
        servicesPayload = approveTarget.appointment_services
          .filter((s) => s && s.service_id)
          .map((s) => ({ id: s.service_id }));
      } else if (approveTarget.services && approveTarget.services.length > 0) {
        servicesPayload = approveTarget.services
          .filter((s) => s && s.id)
          .map((s) => ({ id: s.id }));
      }

      if (servicesPayload.length === 0) {
        showToast.error('No services found for this appointment', 'Error');
        setApproving(false);
        return;
      }

      const rawTime = approveTarget.appointment_time || '';
      const timeValue =
        rawTime.length >= 5 ? rawTime.slice(0, 5) : rawTime;

      const payload: any = {
        user_id: approveTarget.user.id,
        appointment_date: approveTarget.appointment_date,
        appointment_time: timeValue,
        services: servicesPayload,
        status: 'pending',
        seat_id: selectedSeatId,
        notes: approveTarget.notes || null,
        staff_id: null,
      };

      const response = await apiClient.put(
        API_ENDPOINTS.APPOINTMENT_UPDATE(approveTarget.id),
        payload,
      );

      if (response.success) {
        showToast.success(
          response.message || 'Appointment approved successfully',
          'Success',
        );
        closeApproveModal();
        fetchAppointments(1, statusFilter, dateFilter);
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

  const handleUpdateStatusClick = (appointmentId: number, status: 'completed' | 'cancelled') => {
    setConfirmAction({ appointmentId, status });
    setConfirmModalVisible(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!confirmAction) return;

    try {
      setUpdatingStatus(confirmAction.appointmentId);
      setConfirmModalVisible(false);
      
      const response = await apiClient.put(
        API_ENDPOINTS.APPOINTMENT_UPDATE_STATUS(confirmAction.appointmentId),
        { status: confirmAction.status },
      );

      if (response.success) {
        showToast.success(
          response.message || `Appointment ${confirmAction.status === 'completed' ? 'completed' : 'cancelled'} successfully`,
          'Success',
        );
        fetchAppointments(1, statusFilter, dateFilter);
      } else {
        showToast.error(
          response.message || `Failed to ${confirmAction.status === 'completed' ? 'complete' : 'cancel'} appointment`,
          'Error',
        );
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || `Failed to ${confirmAction.status === 'completed' ? 'complete' : 'cancel'} appointment`, 'Error');
    } finally {
      setUpdatingStatus(null);
      setConfirmAction(null);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmModalVisible(false);
    setConfirmAction(null);
  };

  const getStaffName = (appointment: Appointment): string | null => {
    // For in_progress appointments, get staff name from services
    if (appointment.status === 'in_progress' && appointment.services && Array.isArray(appointment.services)) {
      // Find first service with staff_name
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
        title="Appointments"
        subtitle={`${appointments.length} appointment${appointments.length !== 1 ? 's' : ''} scheduled`}
        rightAction={
          <View style={tw`flex-row gap-2 flex-shrink-0`}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/appointments/seat-map')}
              style={[
                tw`px-3 py-2 rounded-xl`,
                { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
              ]}
              activeOpacity={0.8}
            >
              <Text
                size="xs"
                weight="semibold"
                style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                numberOfLines={1}
              >
                Map
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/appointments/create')}
              style={[
                tw`px-3 py-2 rounded-xl`,
                { backgroundColor: SalozyColors.primary.DEFAULT },
              ]}
              activeOpacity={0.8}
            >
              <Text
                size="xs"
                weight="bold"
                style={{ color: '#FFFFFF' }}
                numberOfLines={1}
              >
                + New
              </Text>
            </TouchableOpacity>
          </View>
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
        onScrollEndDrag={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } =
            e.nativeEvent;
          const paddingToBottom = 20;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom
          ) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Modern Filter Section */}
        <View style={tw`px-4 mt-3`}>
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <TouchableOpacity
              onPress={() => {
                setShowFilters(!showFilters);
                Animated.timing(filterAnimation, {
                  toValue: showFilters ? 0 : 1,
                  duration: 300,
                  useNativeDriver: false,
                }).start();
              }}
              style={tw`flex-row justify-between items-center`}
              activeOpacity={0.7}
            >
              <View style={tw`flex-row items-center flex-1`}>
                <View style={[
                  tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                  { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' }
                ]}>
                  <SearchIcon size={20} color={SalozyColors.primary.DEFAULT} />
                </View>
                <View style={tw`flex-1`}>
                  <Text size="base" weight="bold" variant="primary">
                    Filters
                  </Text>
                  {(searchQuery || dateFilter || statusFilter !== 'pending') && (
                    <Text size="xs" variant="secondary" style={tw`mt-0.5`}>
                      {[
                        searchQuery ? 1 : 0,
                        dateFilter ? 1 : 0,
                        statusFilter !== 'pending' ? 1 : 0
                      ].reduce((a, b) => a + b, 0)} active
                    </Text>
                  )}
                </View>
                {(searchQuery || dateFilter || statusFilter !== 'pending') && (
                  <View style={[
                    tw`px-2.5 py-1 rounded-full mr-2`,
                    { backgroundColor: SalozyColors.primary.DEFAULT }
                  ]}>
                    <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                      {[
                        searchQuery ? 1 : 0,
                        dateFilter ? 1 : 0,
                        statusFilter !== 'pending' ? 1 : 0
                      ].reduce((a, b) => a + b, 0)}
                    </Text>
                  </View>
                )}
              </View>
              <View style={[
                tw`w-8 h-8 rounded-full items-center justify-center`,
                { backgroundColor: colors.secondaryBg }
              ]}>
                <Text size="base" variant="secondary">
                  {showFilters ? '▼' : '▶'}
                </Text>
              </View>
            </TouchableOpacity>

            {showFilters && (
              <Animated.View
                style={[
                  { opacity: filterAnimation },
                  tw`mt-4 pt-4 border-t`,
                  { borderColor: colors.border }
                ]}
              >
                {/* Search Input */}
                <View style={tw`mb-4`}>
                  <View style={tw`mb-2`}>
                    <Text size="sm" weight="semibold" variant="secondary">
                      Search
                    </Text>
                  </View>
                  <Input
                    placeholder="Search by ticket, name, email, or phone..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    leftIcon={
                      <SearchIcon size={20} color={colors.placeholder} />
                    }
                    containerStyle={tw`mb-0`}
                  />
                </View>

                {/* Date Filter */}
                <View style={tw`mb-4`}>
                  <View style={tw`mb-2`}>
                    <Text size="sm" weight="semibold" variant="secondary">
                      Date
                    </Text>
                  </View>
                  <DatePicker
                    label=""
                    value={dateFilter}
                    onChange={(date) => {
                      setDateFilter(date);
                      if (isAuthenticated && !isChecking) {
                        fetchAppointments(1, statusFilter, date);
                      }
                    }}
                    onClear={() => {
                      setDateFilter('');
                      if (isAuthenticated && !isChecking) {
                        fetchAppointments(1, statusFilter, '');
                      }
                    }}
                    placeholder="Select appointment date"
                  />
                </View>

                {/* Status Filter */}
                <View style={tw`mb-4`}>
                  <View style={tw`mb-3`}>
                    <Text size="sm" weight="semibold" variant="secondary">
                      Status
                    </Text>
                  </View>
                  <View style={tw`flex-row flex-wrap gap-2`}>
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ].map((statusOption) => {
                      const statusConfig = statusOption.value !== 'all' ? getStatusColor(statusOption.value) : null;
                      const isSelected = statusFilter === statusOption.value;
                      return (
                        <TouchableOpacity
                          key={statusOption.value}
                          onPress={() => setStatusFilter(statusOption.value)}
                          style={[
                            tw`px-3 py-2.5 rounded-xl`,
                            {
                              backgroundColor: isSelected 
                                ? (statusOption.value === 'all' ? SalozyColors.primary.DEFAULT : statusConfig?.bg || colors.secondaryBg)
                                : colors.secondaryBg,
                              borderWidth: isSelected ? 0 : 1,
                              borderColor: colors.border,
                            }
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text 
                            size="xs" 
                            weight="semibold"
                            style={{ 
                              color: isSelected 
                                ? (statusOption.value === 'all' ? '#FFFFFF' : statusConfig?.text || colors.textPrimary)
                                : colors.textPrimary 
                            }}
                          >
                            {statusOption.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Clear Filters Button */}
                {(searchQuery || dateFilter || statusFilter !== 'pending') && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setDateFilter('');
                      setStatusFilter('pending');
                      if (isAuthenticated && !isChecking) {
                        fetchAppointments(1, 'pending', '');
                      }
                    }}
                    style={[
                      tw`mt-2 py-3 rounded-xl items-center`,
                      { backgroundColor: colors.secondaryBg }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text size="sm" weight="semibold" style={{ color: SalozyColors.primary.DEFAULT }}>
                      Clear All Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}
          </View>
        </View>

        {error && (
          <View style={tw`px-4 mt-4`}>
            <View style={[
              tw`rounded-2xl p-4 items-center`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <Text style={[tw`text-lg font-bold`, { color: SalozyColors.status.error }]}>Error</Text>
              <Text style={[tw`mt-2 text-center`, { color: textSecondary }]}>{error}</Text>
              <TouchableOpacity 
                onPress={() => fetchAppointments(1, statusFilter)} 
                style={[
                  tw`mt-4 px-4 py-2 rounded-xl`,
                  { backgroundColor: SalozyColors.primary.DEFAULT }
                ]}
              >
                <Text style={tw`text-white font-semibold`}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {filteredAppointments.length > 0 ? (
          <View style={tw`px-4 mt-4 gap-3`}>
            {filteredAppointments
              .filter(appointment => appointment && appointment.id && appointment.user)
              .map((appointment) => {
              const hasSeatOrStaff = appointment.services && 
                Array.isArray(appointment.services) && 
                appointment.services.length > 0 &&
                (appointment.services[0]?.seat_name || appointment.services[0]?.staff_name);
              
              const displayStatus = (appointment.status === 'pending' && hasSeatOrStaff) 
                ? 'approved' 
                : (appointment.status || 'pending');
              
              const statusConfig = getStatusColor(displayStatus);
              return (
                <TouchableOpacity
                  key={appointment.id}
                  onPress={() => router.push(`/(tabs)/appointments/${appointment.id}`)}
                  activeOpacity={0.7}
                  style={tw`mb-3`}
                >
                  <View
                    style={[
                      tw`rounded-2xl p-4`,
                      { backgroundColor: cardBg, borderWidth: 1, borderColor }
                    ]}
                  >
                    {/* Header with Icon and Status */}
                    <View style={tw`flex-row items-center justify-between mb-3`}>
                      <View style={tw`flex-row items-center flex-1`}>
                        <View
                          style={[
                            tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                            { backgroundColor: statusConfig.bg },
                          ]}
                        >
                          <Text
                            size="base"
                            weight="bold"
                            style={{ color: statusConfig.text }}
                          >
                            {String(appointment.user?.name || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={tw`flex-1 min-w-0`}>
                          <Text
                            size="base"
                            weight="bold"
                            variant="primary"
                            numberOfLines={1}
                          >
                            {String(appointment.user?.name || 'Unknown User')}
                          </Text>
                          <View style={tw`flex-row items-center flex-wrap mt-0.5`}>
                            <Text size="xs" variant="secondary" numberOfLines={1}>
                              #{String(appointment.ticket_number || 'N/A')}
                            </Text>
                            {appointment.branch && (
                              <Text
                                size="xs"
                                variant="secondary"
                                style={tw`ml-2`}
                                numberOfLines={1}
                              >
                                • {String(appointment.branch.name || 'N/A')}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <View
                        style={[
                          tw`px-2 py-1 rounded-full ml-2`,
                          { backgroundColor: statusConfig.bg },
                        ]}
                      >
                        <Text size="xs" weight="semibold" style={{ color: statusConfig.text }}>
                          {(() => {
                            if (
                              appointment.status === 'pending' &&
                              hasSeatOrStaff
                            ) {
                              return 'Approved';
                            }
                            return String(appointment.status || '')
                              .replace('_', ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase());
                          })()}
                        </Text>
                      </View>
                    </View>

                    {/* Date and Time Info */}
                    <View
                      style={[
                        tw`flex-row items-center mb-3 p-3 rounded-xl`,
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
                          numberOfLines={1}
                        >
                          {String(
                            formatDate(appointment.appointment_date) ||
                              'N/A',
                          )}
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
                          numberOfLines={1}
                        >
                          {String(
                            formatTime(appointment.appointment_time) ||
                              'N/A',
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* Services List */}
                    {((appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) || 
                      (appointment.appointment_services && Array.isArray(appointment.appointment_services) && appointment.appointment_services.length > 0)) ? (
                      <View style={tw`mb-3`}>
                        <Text size="xs" weight="semibold" variant="secondary" style={tw`mb-2`}>
                          Services ({String((appointment.appointment_services?.length || appointment.services?.length || 0))})
                        </Text>
                        <View style={tw`gap-2`}>
                        {(() => {
                          if (appointment.appointment_services && Array.isArray(appointment.appointment_services) && appointment.appointment_services.length > 0) {
                            const validServices = appointment.appointment_services.filter(aptService => aptService && typeof aptService === 'object');
                            if (validServices.length === 0) return null;
                            
                            return validServices.map((aptService, index) => {
                              const serviceName = aptService.service?.name || `Service ${aptService.service_id || 'N/A'}`;
                              const servicePrice = (aptService.price !== null && aptService.price !== undefined && typeof aptService.price === 'number')
                                ? aptService.price.toFixed(2)
                                : '0.00';
                              
                              return (
                                <View
                                  key={`apt-service-${aptService.id || index}`}
                                  style={[
                                    tw`flex-row justify-between items-center p-2.5 rounded-lg`,
                                    { backgroundColor: colors.secondaryBg }
                                  ]}
                                >
                                  <View style={tw`flex-1 min-w-0`}>
                                    <Text size="xs" weight="semibold" variant="primary" numberOfLines={1}>
                                      {String(serviceName)}
                                    </Text>
                                  </View>
                                  <Text size="sm" weight="bold" variant="primary" style={tw`ml-2`}>
                                    {String(appointment.currency_symbol || '₹')}{String(servicePrice)}
                                  </Text>
                                </View>
                              );
                            });
                          }
                          
                          if (appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) {
                            const validServices = appointment.services.filter(service => service && typeof service === 'object');
                            if (validServices.length === 0) return null;
                            
                            return validServices.map((service, index) => {
                              const serviceName = service.name || 'Unknown Service';
                              const servicePrice = (() => {
                                const price = service.pivot?.price || service.price || 0;
                                return typeof price === 'number' ? price.toFixed(2) : '0.00';
                              })();
                              
                              return (
                                <View
                                  key={`service-${service.id || index}`}
                                  style={[
                                    tw`flex-row justify-between items-center p-2.5 rounded-lg`,
                                    { backgroundColor: colors.secondaryBg }
                                  ]}
                                >
                                  <View style={tw`flex-1 min-w-0`}>
                                    <Text size="xs" weight="semibold" variant="primary" numberOfLines={1}>
                                      {String(serviceName)}
                                    </Text>
                                    {(service.seat_name || service.staff_name) && (
                                      <View style={tw`mt-1 flex-row gap-2 flex-wrap`}>
                                        {service.seat_name && (
                                          <Text size="xs" variant="tertiary" numberOfLines={1}>
                                            Seat: {String(service.seat_name)}
                                          </Text>
                                        )}
                                        {service.staff_name && (
                                          <Text size="xs" variant="tertiary" numberOfLines={1}>
                                            Staff: {String(service.staff_name)}
                                          </Text>
                                        )}
                                      </View>
                                    )}
                                  </View>
                                  <Text size="sm" weight="bold" variant="primary" style={tw`ml-2`}>
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
                  ) : null}

                    {/* Footer with Total and Actions */}
                    <View style={[
                      tw`pt-3 border-t`,
                      { borderColor: colors.border }
                    ]}>
                      {appointment.status === 'in_progress' ? (
                        <View>
                          <View style={tw`mb-3`}>
                            {(() => {
                              const totalPrice = appointment.app_price || appointment.original_total || 0;
                              const couponDiscount = appointment.discount_amount || 0;
                              const finalAmount = appointment.final_total || totalPrice;
                              
                              if (couponDiscount > 0 || (appointment.original_total && appointment.original_total !== finalAmount)) {
                                return (
                                  <View>
                                    <Text size="xs" variant="secondary" style={tw`mb-1`}>Total Amount</Text>
                                    <Text size="sm" variant="primary" style={tw`mb-1`} numberOfLines={1}>
                                      Total: {String(appointment.currency_symbol || '₹')}{String(typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00')}
                                    </Text>
                                    {couponDiscount > 0 && (
                                      <Text size="xs" variant="primary" style={tw`mb-1`} numberOfLines={1}>
                                        Discount: -{String(appointment.currency_symbol || '₹')}{String(typeof couponDiscount === 'number' ? couponDiscount.toFixed(2) : '0.00')}
                                      </Text>
                                    )}
                                    <Text size="lg" weight="bold" style={{ marginTop: 4, color: SalozyColors.status.success }} numberOfLines={1}>
                                      Final: {String(appointment.currency_symbol || '₹')}{String(typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00')}
                                    </Text>
                                  </View>
                                );
                              }
                              
                              return (
                                <View>
                                  <Text size="xs" variant="secondary" style={tw`mb-1`}>Total Amount</Text>
                                  <Text size="lg" weight="bold" style={{ color: SalozyColors.status.success }} numberOfLines={1}>
                                    {String(appointment.currency_symbol || '₹')}{String(typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00')}
                                  </Text>
                                </View>
                              );
                            })()}
                          </View>
                          <View style={tw`flex-row gap-2 flex-wrap`}>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                handleUpdateStatusClick(appointment.id, 'completed');
                              }}
                              disabled={updatingStatus === appointment.id}
                              style={[
                                tw`flex-1 px-3 py-2.5 rounded-xl min-w-[100px]`,
                                { 
                                  backgroundColor: updatingStatus === appointment.id 
                                    ? colors.secondaryBg 
                                    : SalozyColors.status.success,
                                  opacity: updatingStatus === appointment.id ? 0.6 : 1,
                                },
                              ]}
                              activeOpacity={0.8}
                            >
                              {updatingStatus === appointment.id ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text size="xs" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }} numberOfLines={1}>
                                  Complete
                                </Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                handleUpdateStatusClick(appointment.id, 'cancelled');
                              }}
                              disabled={updatingStatus === appointment.id}
                              style={[
                                tw`flex-1 px-3 py-2.5 rounded-xl min-w-[100px]`,
                                { 
                                  backgroundColor: updatingStatus === appointment.id 
                                    ? colors.secondaryBg 
                                    : SalozyColors.status.error,
                                  opacity: updatingStatus === appointment.id ? 0.6 : 1,
                                },
                              ]}
                              activeOpacity={0.8}
                            >
                              {updatingStatus === appointment.id ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text size="xs" weight="bold" style={{ color: '#FFFFFF', textAlign: 'center' }} numberOfLines={1}>
                                  Cancel
                                </Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View style={tw`flex-row justify-between items-end`}>
                          <View style={tw`flex-1 min-w-0`}>
                            {(() => {
                              const totalPrice = appointment.app_price || appointment.original_total || 0;
                              const couponDiscount = appointment.discount_amount || 0;
                              const finalAmount = appointment.final_total || totalPrice;
                              
                              if (couponDiscount > 0 || (appointment.original_total && appointment.original_total !== finalAmount)) {
                                return (
                                  <View>
                                    <Text size="xs" variant="secondary" style={tw`mb-1`}>Total</Text>
                                    <Text size="sm" variant="primary" style={tw`mb-1`} numberOfLines={1}>
                                      {String(appointment.currency_symbol || '₹')}{String(typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00')}
                                    </Text>
                                    {couponDiscount > 0 && (
                                      <Text size="xs" variant="primary" style={tw`mb-1`} numberOfLines={1}>
                                        -{String(appointment.currency_symbol || '₹')}{String(typeof couponDiscount === 'number' ? couponDiscount.toFixed(2) : '0.00')}
                                      </Text>
                                    )}
                                    <Text size="lg" weight="bold" style={{ marginTop: 4, color: SalozyColors.status.success }} numberOfLines={1}>
                                      {String(appointment.currency_symbol || '₹')}{String(typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00')}
                                    </Text>
                                  </View>
                                );
                              }
                              
                              return (
                                <View>
                                  <Text size="xs" variant="secondary" style={tw`mb-1`}>Total</Text>
                                  <Text size="lg" weight="bold" style={{ color: SalozyColors.status.success }} numberOfLines={1}>
                                    {String(appointment.currency_symbol || '₹')}{String(typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00')}
                                  </Text>
                                </View>
                              );
                            })()}
                          </View>
                          <View style={tw`flex-row gap-2 flex-shrink-0 ml-2`}>
                            {displayStatus === 'pending' && !hasSeatOrStaff && (
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  openApproveModal(appointment);
                                }}
                                style={[
                                  tw`px-3 py-2 rounded-xl border`,
                                  { borderColor: SalozyColors.primary.DEFAULT },
                                ]}
                                activeOpacity={0.8}
                              >
                                <Text
                                  size="xs"
                                  weight="semibold"
                                  style={{
                                    color: SalozyColors.primary.DEFAULT,
                                  }}
                                  numberOfLines={1}
                                >
                                  Approve
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      )}
                      {appointment.notes && (
                        <View style={[
                          tw`mt-3 p-2.5 rounded-xl`,
                          { backgroundColor: colors.secondaryBg }
                        ]}>
                          <Text size="xs" variant="secondary" style={tw`mb-1`}>Notes</Text>
                          <Text size="xs" variant="primary" numberOfLines={2}>{appointment.notes}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={tw`px-4 mt-8`}>
            <View style={[
              tw`rounded-2xl p-8 items-center`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <View style={[
                tw`w-16 h-16 rounded-full items-center justify-center mb-4`,
                { backgroundColor: colors.secondaryBg }
              ]}>
                <AppointmentsIcon size={32} color={colors.textSecondary} />
              </View>
              <Text size="lg" weight="bold" variant="primary" style={tw`mb-2`}>
                No Appointments Found
              </Text>
              <Text style={[tw`text-sm text-center`, { color: textSecondary }]}>
                {searchQuery || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'You don\'t have any appointments yet'}
              </Text>
            </View>
          </View>
        )}

        {currentPage < lastPage && (
          <View style={tw`px-4 mt-4 items-center`}>
            <ActivityIndicator size="small" color={SalozyColors.primary.DEFAULT} />
            <Text size="sm" variant="secondary" style={tw`mt-2`}>
              Loading more appointments...
            </Text>
          </View>
        )}
      </ScrollView>

      <ApproveAppointmentModal
        visible={approveModalVisible}
        appointment={approveTarget}
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

      <StatusUpdateConfirmModal
        visible={confirmModalVisible}
        status={confirmAction?.status || 'completed'}
        onConfirm={handleConfirmStatusUpdate}
        onCancel={handleCancelConfirm}
      />
    </SafeAreaView>
  );
}

