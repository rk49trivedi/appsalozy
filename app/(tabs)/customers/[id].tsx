import { AppointmentsIcon, ClockIcon, CustomersIcon, RevenueIcon, Text } from '@/components/atoms';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  address?: string;
  is_active?: boolean;
}

interface CustomerStats {
  total_appointments: number;
  completed_appointments: number;
  pending_appointments: number;
  approved_appointments: number;
  cancelled_appointments: number;
  in_progress_appointments: number;
  first_booking?: string;
  last_booking?: string;
}

interface Appointment {
  id: number;
  ticket_number: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  final_total?: number;
  currency_symbol?: string;
  currency_text?: string;
}

export default function CustomerDetailScreen() {
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

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'bookings'>('details');
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsLastPage, setBookingsLastPage] = useState(1);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchCustomer = async () => {
    if (!isAuthenticated || !id) return;

    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: { customer: Customer; stats: CustomerStats } }>(
        API_ENDPOINTS.CUSTOMER_BY_ID(id)
      );
      
      if (response.success && response.data) {
        setCustomer(response.data.customer);
        setStats(response.data.stats);
      } else {
        showToast.error('Failed to load customer details', 'Error');
        router.back();
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        await apiClient.logout();
        router.replace('/login');
        return;
      }
      showToast.error(apiError.message || 'Failed to load customer details', 'Error');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBookingHistory = async (page = 1) => {
    if (!isAuthenticated || !id) return;

    try {
      setBookingsLoading(true);
      const response = await apiClient.get<{ success: boolean; data: { appointments: { data: Appointment[]; current_page: number; last_page: number } } }>(
        `${API_ENDPOINTS.CUSTOMER_BOOKING_HISTORY(id)}?page=${page}`
      );
      
      if (response.success && response.data) {
        const data = response.data.appointments;
        if (page === 1) {
          setBookings(data.data || []);
        } else {
          setBookings(prev => [...prev, ...(data.data || [])]);
        }
        setBookingsPage(data.current_page || page);
        setBookingsLastPage(data.last_page || 1);
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to load booking history', 'Error');
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isChecking && id) {
      fetchCustomer();
    }
  }, [isAuthenticated, isChecking, id]);

  useEffect(() => {
    if (activeTab === 'bookings' && isAuthenticated && !isChecking && id) {
      fetchBookingHistory(1);
    }
  }, [activeTab, isAuthenticated, isChecking, id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomer();
    if (activeTab === 'bookings') {
      fetchBookingHistory(1);
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

  if (loading && !customer) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={tw`mt-4`} variant="secondary">Loading customer...</Text>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center px-4`, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={tw`text-lg font-semibold mb-2`} variant="primary">Customer not found</Text>
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

  const statusConfig = getStatusColor(customer.is_active ? 'active' : 'inactive');

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
      <GlobalHeader
        title={customer.name}
        subtitle={customer.email}
        showBackButton={true}
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
      >
        <View style={tw`px-4 mt-2 gap-4`}>
          {/* Customer Info Card */}
          <View style={[
            tw`rounded-2xl p-4`,
            { 
              backgroundColor: cardBg, 
              borderWidth: 1, 
              borderColor,
            }
          ]}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View style={tw`flex-row items-center flex-1 min-w-0`}>
                <View
                  style={[
                    tw`w-12 h-12 rounded-full items-center justify-center mr-3 flex-shrink-0`,
                    { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' },
                  ]}
                >
                  <CustomersIcon
                    size={24}
                    color={SalozyColors.status.info}
                  />
                </View>
                <View style={tw`flex-1 min-w-0`}>
                  <Text size="lg" weight="bold" variant="primary" style={tw`mb-1`} numberOfLines={1}>
                    {customer.name}
                  </Text>
                  <Text size="sm" variant="secondary" numberOfLines={1}>
                    {customer.email}
                  </Text>
                  {customer.phone && (
                    <Text size="sm" variant="secondary" style={tw`mt-1`} numberOfLines={1}>
                      {customer.phone}
                    </Text>
                  )}
                </View>
              </View>
              <View style={[
                tw`px-2 py-1 rounded-full`,
                { backgroundColor: statusConfig.bg }
              ]}>
                <Text size="xs" weight="semibold" style={{ color: statusConfig.text }}>
                  {customer.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            {customer.address && (
              <View style={[tw`pt-3 border-t`, { borderColor: colors.border }]}>
                <Text size="xs" variant="secondary" style={tw`mb-1`}>Address</Text>
                <Text size="sm" variant="primary">{customer.address}</Text>
              </View>
            )}
          </View>

          {/* Stats Card */}
          {stats && (
            <View style={[
              tw`rounded-2xl p-4`,
              { 
                backgroundColor: cardBg, 
                borderWidth: 1, 
                borderColor,
              }
            ]}>
              <View style={tw`flex-row items-center mb-3`}>
                <View style={[
                  tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                  { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }
                ]}>
                  <RevenueIcon size={20} color={SalozyColors.status.success} />
                </View>
                <View style={tw`flex-1`}>
                  <Text size="base" weight="bold" variant="primary">Statistics</Text>
                  <Text size="xs" variant="secondary">Customer booking overview</Text>
                </View>
              </View>
              <View style={tw`gap-2`}>
                <View style={[
                  tw`flex-row justify-between items-center p-3 rounded-xl`,
                  { backgroundColor: colors.secondaryBg }
                ]}>
                  <Text size="sm" variant="secondary">Total Appointments</Text>
                  <Text size="sm" weight="bold" variant="primary">{stats.total_appointments}</Text>
                </View>
                <View style={tw`flex-row gap-2`}>
                  <View style={[
                    tw`flex-1 p-3 rounded-xl`,
                    { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }
                  ]}>
                    <Text size="xs" variant="secondary" style={tw`mb-1`}>Completed</Text>
                    <Text size="base" weight="bold" style={{ color: SalozyColors.status.success }}>
                      {stats.completed_appointments}
                    </Text>
                  </View>
                  <View style={[
                    tw`flex-1 p-3 rounded-xl`,
                    { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)' }
                  ]}>
                    <Text size="xs" variant="secondary" style={tw`mb-1`}>Pending</Text>
                    <Text size="base" weight="bold" style={{ color: SalozyColors.status.warning }}>
                      {stats.pending_appointments}
                    </Text>
                  </View>
                </View>
                {stats.first_booking && (
                  <View style={[
                    tw`p-3 rounded-xl`,
                    { backgroundColor: colors.secondaryBg }
                  ]}>
                    <Text size="xs" variant="secondary" style={tw`mb-1`}>First Booking</Text>
                    <Text size="sm" weight="semibold" variant="primary">{formatDate(stats.first_booking)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Tabs */}
          <View style={[
            tw`rounded-2xl p-1`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row`}>
              <TouchableOpacity
                onPress={() => setActiveTab('details')}
                style={[
                  tw`flex-1 py-3 rounded-xl items-center`,
                  activeTab === 'details' && { backgroundColor: SalozyColors.primary.DEFAULT }
                ]}
              >
                <Text
                  weight={activeTab === 'details' ? 'bold' : 'semibold'}
                  style={{ color: activeTab === 'details' ? '#FFFFFF' : textPrimary }}
                >
                  Details
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('bookings')}
                style={[
                  tw`flex-1 py-3 rounded-xl items-center`,
                  activeTab === 'bookings' && { backgroundColor: SalozyColors.primary.DEFAULT }
                ]}
              >
                <Text
                  weight={activeTab === 'bookings' ? 'bold' : 'semibold'}
                  style={{ color: activeTab === 'bookings' ? '#FFFFFF' : textPrimary }}
                >
                  Booking History
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Content */}
          {activeTab === 'details' ? (
            <View style={[
              tw`rounded-2xl p-4`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <View style={tw`flex-row items-center mb-3`}>
                <View style={[
                  tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                  { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
                ]}>
                  <CustomersIcon size={20} color={SalozyColors.status.info} />
                </View>
                <View style={tw`flex-1`}>
                  <Text size="base" weight="bold" variant="primary">Customer Information</Text>
                  <Text size="xs" variant="secondary">Personal details</Text>
                </View>
              </View>
              <View style={tw`gap-3`}>
                <View style={[
                  tw`p-3 rounded-xl`,
                  { backgroundColor: colors.secondaryBg }
                ]}>
                  <Text size="xs" variant="secondary" style={tw`mb-1`}>Email</Text>
                  <Text size="sm" weight="semibold" variant="primary">{customer.email}</Text>
                </View>
                {customer.phone && (
                  <View style={[
                    tw`p-3 rounded-xl`,
                    { backgroundColor: colors.secondaryBg }
                  ]}>
                    <Text size="xs" variant="secondary" style={tw`mb-1`}>Phone</Text>
                    <Text size="sm" weight="semibold" variant="primary">{customer.phone}</Text>
                  </View>
                )}
                {customer.gender && (
                  <View style={[
                    tw`p-3 rounded-xl`,
                    { backgroundColor: colors.secondaryBg }
                  ]}>
                    <Text size="xs" variant="secondary" style={tw`mb-1`}>Gender</Text>
                    <Text size="sm" weight="semibold" variant="primary">
                      {customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1)}
                    </Text>
                  </View>
                )}
                {customer.address && (
                  <View style={[
                    tw`p-3 rounded-xl`,
                    { backgroundColor: colors.secondaryBg }
                  ]}>
                    <Text size="xs" variant="secondary" style={tw`mb-1`}>Address</Text>
                    <Text size="sm" weight="semibold" variant="primary">{customer.address}</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={tw`gap-3`}>
              {bookingsLoading && bookings.length === 0 ? (
                <View style={tw`items-center justify-center py-20`}>
                  <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
                  <Text style={tw`mt-4`} variant="secondary">Loading booking history...</Text>
                </View>
              ) : bookings.length === 0 ? (
                <View style={[
                  tw`rounded-2xl p-8 items-center justify-center`,
                  { backgroundColor: cardBg, borderWidth: 1, borderColor }
                ]}>
                  <AppointmentsIcon size={48} color={colors.textSecondary} />
                  <Text size="lg" weight="bold" variant="primary" style={tw`mt-4 mb-2`}>
                    No bookings found
                  </Text>
                  <Text size="sm" variant="secondary" style={tw`text-center`}>
                    This customer hasn't made any appointments yet
                  </Text>
                </View>
              ) : (
                bookings.map((appointment) => {
                  const statusConfig = getStatusColor(appointment.status);
                  return (
                    <TouchableOpacity
                      key={appointment.id}
                      onPress={() => router.push(`/(tabs)/appointments/${appointment.id}`)}
                      activeOpacity={0.7}
                      style={[
                        tw`rounded-2xl p-4`,
                        { backgroundColor: cardBg, borderWidth: 1, borderColor }
                      ]}
                    >
                      <View style={tw`flex-row items-center justify-between mb-3`}>
                        <View style={tw`flex-1`}>
                          <Text size="base" weight="bold" variant="primary" style={tw`mb-1`}>
                            #{appointment.ticket_number}
                          </Text>
                          <View style={tw`flex-row items-center gap-2 mt-1`}>
                            <View style={tw`flex-row items-center gap-1`}>
                              <AppointmentsIcon size={14} color={colors.textSecondary} />
                              <Text size="xs" variant="secondary">
                                {formatDate(appointment.appointment_date)}
                              </Text>
                            </View>
                            <View style={tw`flex-row items-center gap-1`}>
                              <ClockIcon size={14} color={colors.textSecondary} />
                              <Text size="xs" variant="secondary">
                                {formatTime(appointment.appointment_time)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={[
                          tw`px-2 py-1 rounded-full`,
                          { backgroundColor: statusConfig.bg }
                        ]}>
                          <Text size="xs" weight="semibold" style={{ color: statusConfig.text }}>
                            {appointment.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Text>
                        </View>
                      </View>
                      {appointment.final_total !== undefined && (
                        <View style={[
                          tw`flex-row justify-between items-center pt-3 border-t`,
                          { borderColor: colors.border }
                        ]}>
                          <Text size="xs" variant="secondary">Total Amount</Text>
                          <Text size="sm" weight="bold" variant="primary">
                            {appointment.currency_symbol || '₹'}{(appointment.final_total ?? 0).toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Load More Bookings */}
              {!bookingsLoading && bookingsPage < bookingsLastPage && (
                <TouchableOpacity
                  onPress={() => fetchBookingHistory(bookingsPage + 1)}
                  style={[
                    tw`py-4 rounded-xl items-center`,
                    { backgroundColor: colors.secondaryBg }
                  ]}
                  activeOpacity={0.7}
                >
                  <Text size="sm" weight="semibold" variant="primary">
                    Load More
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
