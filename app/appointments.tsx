import { AppointmentsIcon, Badge, Card, Input, Text } from '@/components/atoms';
import { DatePicker } from '@/components/molecules';
import { useSidebar } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { showToast } from '@/lib/toast';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
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
  app_price?: number; // Total price before discounts
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
    seat_id?: number | null; // Add seat_id to determine approved status
    service?: {
      id: number;
      name: string;
    };
  }>;
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
  const { openSidebar } = useSidebar();
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending'); // Default to 'pending'
  const [dateFilter, setDateFilter] = useState<string>(''); // Date filter
  const [showFilters, setShowFilters] = useState(true); // Collapsible filters
  const [filterAnimation] = useState(new Animated.Value(1)); // Animation for filter section

  // Redirect to login if not authenticated
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
      // Only append status if it's not 'all' - API will return all appointments if status is 'all' or not provided
      if (status && status !== 'all') {
        params.append('status', status);
      } else if (status === 'all') {
        // Explicitly pass 'all' to API to return all appointments
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
        // Only append status if it's not 'all' - API will return all appointments if status is 'all' or not provided
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        } else if (statusFilter === 'all') {
          // Explicitly pass 'all' to API to return all appointments
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

  // Map status strings to valid Badge variants
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

  // Filter appointments client-side for search (API handles status and date)
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

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Checking authentication...</Text>
      </SafeAreaView>
    );
  }

  // Don't render if not authenticated
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

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={tw`px-4 pt-4 pb-2 flex-row justify-between items-center`}>
        <TouchableOpacity
          onPress={openSidebar}
          style={[
            tw`p-2 rounded-xl`,
            { backgroundColor: colors.secondaryBg }
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={tw`text-2xl`}>☰</Text>
        </TouchableOpacity>
        <View style={tw`flex-1 ml-4`}>
          <Text size="2xl" weight="bold" variant="primary">
            All Appointments
          </Text>
          <Text size="sm" style={tw`mt-1`} variant="secondary">
            {appointments.length.toString()} appointment{appointments.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/appointments/create')}
          style={[
            tw`px-4 py-2 rounded-xl`,
            { backgroundColor: SalozyColors.primary.DEFAULT }
          ]}
          activeOpacity={0.8}
        >
          <Text size="sm" weight="bold" style={{ color: '#FFFFFF' }}>
            + Create
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-4`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SalozyColors.primary.DEFAULT} />}
        onScrollEndDrag={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Search and Filter Section */}
        <View style={tw`px-4 mt-4`}>
          <Card style={tw`p-4`}>
            {/* Filter Header - Collapsible */}
            <TouchableOpacity
              onPress={() => {
                setShowFilters(!showFilters);
                Animated.timing(filterAnimation, {
                  toValue: showFilters ? 0 : 1,
                  duration: 300,
                  useNativeDriver: false,
                }).start();
              }}
              style={tw`flex-row justify-between items-center mb-3`}
              activeOpacity={0.7}
            >
              <View style={tw`flex-row items-center gap-2`}>
                <Text size="lg" weight="bold" variant="primary">
                  Filters
                </Text>
                {(searchQuery || dateFilter || statusFilter !== 'pending') && (
                  <View style={[
                    tw`px-2 py-1 rounded-full`,
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
              <Text size="lg" variant="secondary">
                {showFilters ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showFilters && (
              <Animated.View
                style={{
                  opacity: filterAnimation,
                }}
              >
                {/* Search Input */}
                <View style={tw`mb-4`}>
                  <Input
                    placeholder="Search by ticket, name, email, or phone..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    leftIcon={
                      <Text size="base" variant="secondary">🔍</Text>
                    }
                    containerStyle={tw`mb-0`}
                  />
                </View>

                {/* Date Filter with Date Picker */}
                <View style={tw`mb-4`}>
                  <DatePicker
                    label="Filter by Date"
                    value={dateFilter}
                    onChange={(date) => {
                      setDateFilter(date);
                      if (isAuthenticated && !isChecking) {
                        fetchAppointments(1, statusFilter, date);
                      }
                    }}
                    onClear={() => {
                      if (isAuthenticated && !isChecking) {
                        fetchAppointments(1, statusFilter, '');
                      }
                    }}
                    placeholder="Select appointment date"
                  />
                </View>

                {/* Status Filter Buttons */}
                <View>
                  <Text size="sm" weight="semibold" variant="secondary" style={tw`mb-3`}>
                    Status
                  </Text>
                  <View style={tw`flex-row flex-wrap gap-2`}>
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'pending', label: 'Approval Pending' },
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
                            tw`px-4 py-2.5 rounded-full`,
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
                            size="sm" 
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

                {/* Clear All Filters Button */}
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
                    style={tw`mt-4 pt-3 border-t`}
                  >
                    <Text size="sm" variant="primaryBrand" weight="semibold" style={tw`text-center`}>
                      Clear All Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}
          </Card>
        </View>

        {/* Appointments List */}
        {error && (
          <View style={tw`px-4 mt-4`}>
            <Card style={tw`p-4 items-center`}>
              <Text variant="primary" size="lg" weight="bold" style={{ color: SalozyColors.status.error }}>Error</Text>
              <Text style={tw`mt-2 text-center`} variant="secondary">{error}</Text>
              <TouchableOpacity onPress={() => fetchAppointments(1, statusFilter)} style={tw`mt-4`}>
                <Text variant="primaryBrand" weight="semibold">Tap to retry</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {filteredAppointments.length > 0 ? (
          <View style={tw`px-4 mt-4 gap-4`}>
            {filteredAppointments
              .filter(appointment => appointment && appointment.id && appointment.user)
              .map((appointment) => {
              // Match web app logic: if status is 'pending' but has seat_name or staff_name, treat as 'approved'
              const hasSeatOrStaff = appointment.services && 
                Array.isArray(appointment.services) && 
                appointment.services.length > 0 &&
                (appointment.services[0]?.seat_name || appointment.services[0]?.staff_name);
              
              const displayStatus = (appointment.status === 'pending' && hasSeatOrStaff) 
                ? 'approved' 
                : (appointment.status || 'pending');
              
              const statusConfig = getStatusColor(displayStatus);
              return (
                <Card key={appointment.id} style={tw`p-5 overflow-hidden`}>
                  {/* Status Indicator Bar */}
                  <View style={[
                    tw`absolute top-0 left-0 right-0 h-1`,
                    { backgroundColor: statusConfig.text }
                  ]} />

                  {/* Header Row */}
                  <View style={tw`flex-row justify-between items-start mb-4`}>
                    <View style={tw`flex-1`}>
                      <View style={tw`flex-row items-center mb-2`}>
                        <View style={[
                          tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
                          { backgroundColor: statusConfig.bg }
                        ]}>
                          <AppointmentsIcon size={24} color={statusConfig.text} />
                        </View>
                        <View style={tw`flex-1`}>
                          <Text size="lg" weight="bold" variant="primary" style={tw`mb-1`}>
                            {String(appointment.user?.name || 'Unknown User')}
                          </Text>
                          {appointment.user?.email && (
                            <Text size="xs" variant="tertiary" style={tw`mb-1`}>
                              {String(appointment.user.email)}
                            </Text>
                          )}
                          {appointment.user?.phone && (
                            <Text size="xs" variant="tertiary" style={tw`mb-1`}>
                              {String(appointment.user.phone)}
                            </Text>
                          )}
                          <View style={tw`flex-row items-center gap-2 mt-1`}>
                            <Text size="xs" variant="tertiary">
                              #{String(appointment.ticket_number || 'N/A')}
                            </Text>
                            {appointment.branch && (
                              <>
                                <Text size="xs" variant="tertiary">•</Text>
                                <Text size="xs" variant="tertiary">{String(appointment.branch.name || 'N/A')}</Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                    <Badge variant={getStatusVariant(displayStatus)}>
                      {(() => {
                        // Match web app: if pending with seat/staff, show "Approved", otherwise format status
                        if (appointment.status === 'pending' && hasSeatOrStaff) {
                          return 'Approved';
                        }
                        return String(appointment.status || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                      })()}
                    </Badge>
                  </View>

                  {/* Date and Time - Enhanced Design */}
                  <View style={[
                    tw`flex-row items-center mb-4 p-3 rounded-xl`,
                    { backgroundColor: colors.secondaryBg }
                  ]}>
                    <View style={tw`flex-1 items-center`}>
                      <Text size="xs" variant="secondary" style={tw`mb-1`}>Date</Text>
                      <Text size="base" weight="bold" variant="primary">
                        {String(formatDate(appointment.appointment_date) || 'N/A')}
                      </Text>
                    </View>
                    <View style={[tw`w-px h-8`, { backgroundColor: colors.border }]} />
                    <View style={tw`flex-1 items-center`}>
                      <Text size="xs" variant="secondary" style={tw`mb-1`}>Time</Text>
                      <Text size="base" weight="bold" variant="primary">
                        {String(formatTime(appointment.appointment_time) || 'N/A')}
                      </Text>
                    </View>
                  </View>

                  {/* Services - Enhanced Design */}
                  {((appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) || 
                    (appointment.appointment_services && Array.isArray(appointment.appointment_services) && appointment.appointment_services.length > 0)) ? (
                    <View style={tw`mb-4`}>
                      <Text size="sm" weight="semibold" variant="secondary" style={tw`mb-3`}>
                        Services ({String((appointment.appointment_services?.length || appointment.services?.length || 0))})
                      </Text>
                      <View style={tw`gap-2`}>
                        {(() => {
                          // Handle appointment_services first
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
                                    tw`flex-row justify-between items-center p-3 rounded-xl`,
                                    { backgroundColor: colors.secondaryBg }
                                  ]}
                                >
                                  <View style={tw`flex-1`}>
                                    <Text size="sm" weight="semibold" variant="primary">
                                      {String(serviceName)}
                                    </Text>
                                    {aptService.status ? (
                                      <View style={tw`mt-1`}>
                                        <Badge 
                                          variant={getStatusVariant(aptService.status)} 
                                          style={tw`self-start`}
                                        >
                                          {String(aptService.status || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </Badge>
                                      </View>
                                    ) : null}
                                  </View>
                                  <Text size="base" weight="bold" variant="primary">
                                    {String(appointment.currency_symbol || '₹')}{String(servicePrice)}
                                  </Text>
                                </View>
                              );
                            });
                          }
                          
                          // Handle services fallback
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
                                    tw`flex-row justify-between items-center p-3 rounded-xl`,
                                    { backgroundColor: colors.secondaryBg }
                                  ]}
                                >
                                  <View style={tw`flex-1`}>
                                    <Text size="sm" weight="semibold" variant="primary">
                                      {String(serviceName)}
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
                    </View>
                  ) : null}

                  {/* Footer - Enhanced Design */}
                  <View style={[
                    tw`pt-4 border-t`,
                    { borderColor: colors.border }
                  ]}>
                    <View style={tw`flex-row justify-between items-end mb-3`}>
                      <View style={tw`flex-1`}>
                        {(() => {
                          // Match web app: show breakdown if there are discounts
                          const totalPrice = appointment.app_price || appointment.original_total || 0;
                          const couponDiscount = appointment.discount_amount || 0;
                          const finalAmount = appointment.final_total || totalPrice;
                          
                          if (couponDiscount > 0 || (appointment.original_total && appointment.original_total !== finalAmount)) {
                            return (
                              <View>
                                <Text size="xs" variant="secondary" style={tw`mb-1`}>Total Amount</Text>
                                <Text size="sm" variant="primary" style={tw`mb-1`}>
                                  Total: {String(appointment.currency_symbol || '₹')}{String(typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00')}
                                </Text>
                                {couponDiscount > 0 && (
                                  <Text size="xs" variant="primary" style={tw`mb-1`}>
                                    Coupon Discount: -{String(appointment.currency_symbol || '₹')}{String(typeof couponDiscount === 'number' ? couponDiscount.toFixed(2) : '0.00')}
                                  </Text>
                                )}
                                <Text size="2xl" weight="bold" variant="primary" style={{ marginTop: 4, color: SalozyColors.status.success }}>
                                  Final: {String(appointment.currency_symbol || '₹')}{String(typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00')}
                                </Text>
                              </View>
                            );
                          }
                          
                          return (
                            <View>
                              <Text size="xs" variant="secondary" style={tw`mb-1`}>Total Amount</Text>
                              <Text size="2xl" weight="bold" variant="primary" style={{ color: SalozyColors.status.success }}>
                                {String(appointment.currency_symbol || '₹')}{String(typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00')}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          router.push(`/appointments/${appointment.id}`);
                        }}
                        style={[
                          tw`px-5 py-3 rounded-xl`,
                          { backgroundColor: SalozyColors.primary.DEFAULT }
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text size="sm" weight="bold" style={{ color: '#FFFFFF' }}>
                          Details
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {appointment.notes && (
                      <View style={[
                        tw`mt-3 p-3 rounded-xl`,
                        { backgroundColor: colors.secondaryBg }
                      ]}>
                        <Text size="xs" variant="secondary" style={tw`mb-1`}>Notes</Text>
                        <Text size="sm" variant="primary">{appointment.notes}</Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <View style={tw`px-4 mt-8`}>
            <Card style={tw`p-8 items-center`}>
              <View style={[
                tw`w-16 h-16 rounded-full items-center justify-center mb-4`,
                { backgroundColor: colors.secondaryBg }
              ]}>
                <AppointmentsIcon size={32} color={colors.textSecondary} />
              </View>
              <Text size="lg" weight="bold" variant="primary" style={tw`mb-2`}>
                No Appointments Found
              </Text>
              <Text size="sm" variant="secondary" style={tw`text-center`}>
                {searchQuery || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'You don\'t have any appointments yet'}
              </Text>
            </Card>
          </View>
        )}

        {/* Load More Indicator */}
        {currentPage < lastPage && (
          <View style={tw`px-4 mt-4 items-center`}>
            <ActivityIndicator size="small" color={SalozyColors.primary.DEFAULT} />
            <Text size="sm" variant="secondary" style={tw`mt-2`}>
              Loading more appointments...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

