import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSidebar } from '@/components/global-sidebar';
import { apiClient, ApiError } from '@/lib/api/client';
import { RevenueIcon, AppointmentsIcon, CustomersIcon, SeatsIcon } from '@/components/dashboard-icons';
import { SalozyColors } from '@/constants/colors';
import { showToast } from '@/lib/toast';
import { API_ENDPOINTS } from '@/lib/api/config';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';

interface DashboardData {
  appointmentStats: {
    today_total: number;
    today_pending: number;
    over_all_apoinment: number;
    today_in_progress: number;
    today_completed: number;
    today_cancelled: number;
  };
  seatStats: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    cleaning: number;
  };
  revenueStats: {
    today: number;
    week: number;
    month: number;
    grand_total: number;
  };
  customerInsights: {
    total_customers: number;
    new_customers: number;
    repeat_customers: number;
  };
  upcomingAppointments: Array<{
    id: number;
    customer_name: string;
    date: string;
    time: string;
    ticket_number: string;
    services_count: number;
    status: string;
  }>;
  recentCompletedServices: Array<{
    id: number;
    customer_name: string;
    service_name: string;
    seat: string;
    completed_at: string;
    duration: string;
  }>;
  serviceAnalytics: Array<{
    service_name: string;
    total_bookings: number;
    total_revenue: number;
  }>;
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { openSidebar } = useSidebar();
  const { isAuthenticated, isChecking } = useAuth(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchDashboardData = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get<DashboardData>(API_ENDPOINTS.DASHBOARD);
      
      if (response.success && response.data) {
        setDashboardData(response.data);
        if (response.currency_symbol) {
          setCurrencySymbol(response.currency_symbol);
        }
      } else {
        showToast.error('Failed to load dashboard data', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      
      // If unauthorized, redirect to login
      if (apiError.status === 401) {
        await apiClient.logout();
        router.replace('/login');
        return;
      }
      
      showToast.error(
        apiError.message || 'Failed to load dashboard data',
        'Error'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      fetchDashboardData();
    }
  }, [isAuthenticated, isChecking]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)', text: '#FBBF24' };
      case 'in_progress': return { bg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' };
      case 'completed': return { bg: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)', text: '#22C55E' };
      case 'cancelled': return { bg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', text: '#EF4444' };
      default: return { bg: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6' };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle relative time strings (e.g., "2 hours ago") or date strings
      if (dateString.includes('ago') || dateString.includes('from now')) {
        return dateString; // Return as-is if it's already a relative time
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString; // Return original if any error occurs
    }
  };

  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: bgColor }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={[tw`mt-4 text-base`, { color: textSecondary }]}>Checking authentication...</Text>
      </SafeAreaView>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (loading && !dashboardData) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: bgColor }]} edges={['top']}>
        <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
        <Text style={[tw`mt-4 text-base`, { color: textSecondary }]}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center px-4`, { backgroundColor: bgColor }]} edges={['top']}>
        <Text style={[tw`text-lg font-semibold mb-2`, { color: textPrimary }]}>No data available</Text>
        <Text style={[tw`text-sm text-center mb-4`, { color: textSecondary }]}>
          Unable to load dashboard data. Please try again.
        </Text>
        <TouchableOpacity
          onPress={fetchDashboardData}
          style={[
            tw`px-6 py-3 rounded-xl`,
            { backgroundColor: SalozyColors.primary.DEFAULT }
          ]}
        >
          <Text style={tw`text-white font-semibold`}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-4`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header with Burger Menu */}
        <View style={tw`px-4 pt-4 pb-2 flex-row justify-between items-center`}>
          <TouchableOpacity
            onPress={openSidebar}
            style={[
              tw`p-2 rounded-xl`,
              { backgroundColor: isDark ? '#374151' : '#F3F4F6' }
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={tw`text-2xl`}>☰</Text>
          </TouchableOpacity>
          <View style={tw`flex-1 ml-4`}>
            <Text style={[tw`text-2xl font-bold`, { color: textPrimary }]}>
              Welcome back!
            </Text>
            <Text style={[tw`text-sm mt-1`, { color: textSecondary }]}>
              Here's your salon overview
            </Text>
          </View>
        </View>

        {/* Stats Cards Grid */}
        <View style={tw`px-4 mt-4`}>
          <View style={tw`flex-row flex-wrap gap-3`}>
            {/* Revenue Card */}
            <View style={[
              tw`rounded-2xl p-4 flex-1 min-w-[48%]`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={[
                  tw`w-10 h-10 rounded-full items-center justify-center`,
                  { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }
                ]}>
                  <RevenueIcon size={24} color={SalozyColors.status.success} />
                </View>
                <View style={[
                  tw`px-2 py-1 rounded-full`,
                  { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }
                ]}>
                  <Text style={[tw`text-xs font-semibold`, { color: SalozyColors.status.success }]}>Today</Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-bold mb-1`, { color: textPrimary }]}>
                {currencySymbol} {dashboardData.revenueStats.grand_total.toLocaleString()}
              </Text>
              <Text style={[tw`text-xs`, { color: textSecondary }]}>Total Revenue</Text>
              <Text style={[tw`text-sm font-semibold mt-1`, { color: '#22C55E' }]}>
                {currencySymbol} {dashboardData.revenueStats.today.toFixed(2)} today
              </Text>
            </View>

            {/* Appointments Card */}
            <View style={[
              tw`rounded-2xl p-4 flex-1 min-w-[48%]`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={[
                  tw`w-10 h-10 rounded-full items-center justify-center`,
                  { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' }
                ]}>
                  <AppointmentsIcon size={24} color={SalozyColors.primary.DEFAULT} />
                </View>
                <View style={[
                  tw`px-2 py-1 rounded-full`,
                  { backgroundColor: isDark ? 'rgba(154, 52, 18, 0.2)' : 'rgba(154, 52, 18, 0.1)' }
                ]}>
                  <Text style={[tw`text-xs font-semibold`, { color: SalozyColors.primary.DEFAULT }]}>Today</Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-bold mb-1`, { color: textPrimary }]}>
                {dashboardData.appointmentStats.over_all_apoinment}
              </Text>
              <Text style={[tw`text-xs`, { color: textSecondary }]}>Total Appointments</Text>
              <View style={tw`flex-row gap-2 mt-1`}>
                <View style={tw`px-2 py-0.5 rounded-full bg-yellow-500/10`}>
                  <Text style={tw`text-yellow-600 text-xs`}>{dashboardData.appointmentStats.today_pending} pending</Text>
                </View>
                <View style={tw`px-2 py-0.5 rounded-full bg-green-500/10`}>
                  <Text style={tw`text-green-600 text-xs`}>{dashboardData.appointmentStats.today_completed} done</Text>
                </View>
              </View>
            </View>

            {/* Customers Card */}
            <View style={[
              tw`rounded-2xl p-4 flex-1 min-w-[48%] mt-3`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={[
                  tw`w-10 h-10 rounded-full items-center justify-center`,
                  { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
                ]}>
                  <CustomersIcon size={24} color={SalozyColors.status.info} />
                </View>
                <View style={[
                  tw`px-2 py-1 rounded-full`,
                  { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
                ]}>
                  <Text style={[tw`text-xs font-semibold`, { color: SalozyColors.status.info }]}>New</Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-bold mb-1`, { color: textPrimary }]}>
                {dashboardData.customerInsights.total_customers}
              </Text>
              <Text style={[tw`text-xs`, { color: textSecondary }]}>Total Customers</Text>
              <Text style={[tw`text-sm font-semibold mt-1`, { color: SalozyColors.status.info }]}>
                {dashboardData.customerInsights.new_customers} new • {dashboardData.customerInsights.repeat_customers} returning
              </Text>
            </View>

            {/* Seats Card */}
            <View style={[
              tw`rounded-2xl p-4 flex-1 min-w-[48%] mt-3`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={[
                  tw`w-10 h-10 rounded-full items-center justify-center`,
                  { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)' }
                ]}>
                  <SeatsIcon size={24} color={SalozyColors.status.warning} />
                </View>
                <View style={[
                  tw`px-2 py-1 rounded-full`,
                  { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)' }
                ]}>
                  <Text style={[tw`text-xs font-semibold`, { color: SalozyColors.status.warning }]}>Available</Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-bold mb-1`, { color: textPrimary }]}>
                {dashboardData.seatStats.total}
              </Text>
              <Text style={[tw`text-xs`, { color: textSecondary }]}>Total Seats</Text>
              <Text style={[tw`text-sm font-semibold mt-1`, { color: '#F97316' }]}>
                {dashboardData.seatStats.available} available • {dashboardData.seatStats.occupied} occupied
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Appointments */}
        <View style={tw`px-4 mt-6`}>
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                Today's Appointments
              </Text>
              <TouchableOpacity>
                <Text style={tw`text-orange-800 text-sm font-semibold`}>View All</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            <View style={tw`flex-row gap-2 mb-4`}>
              <View style={tw`flex-1 bg-blue-500/10 rounded-xl p-3 items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: '#3B82F6' }]}>
                  {dashboardData.appointmentStats.today_total}
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>Total</Text>
              </View>
              <View style={tw`flex-1 bg-yellow-500/10 rounded-xl p-3 items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: '#FBBF24' }]}>
                  {dashboardData.appointmentStats.today_pending}
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>Pending</Text>
              </View>
              <View style={tw`flex-1 bg-green-500/10 rounded-xl p-3 items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: '#22C55E' }]}>
                  {dashboardData.appointmentStats.today_completed}
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>Completed</Text>
              </View>
            </View>

            {/* Appointments List */}
            {dashboardData.upcomingAppointments.length > 0 ? (
              <View style={tw`gap-3`}>
                {dashboardData.upcomingAppointments.map((appointment) => {
                  const statusColor = getStatusColor(appointment.status);
                  return (
                    <View
                      key={appointment.id}
                      style={[
                        tw`rounded-xl p-3`,
                        { backgroundColor: isDark ? '#374151' : '#F9FAFB' }
                      ]}
                    >
                      <View style={tw`flex-row justify-between items-start mb-2`}>
                        <View style={tw`flex-1`}>
                          <View style={tw`flex-row items-center mb-1`}>
                            <View style={[
                              tw`w-8 h-8 rounded-full items-center justify-center mr-2`,
                              { backgroundColor: '#9A3412' + '20' }
                            ]}>
                              <Text style={tw`text-orange-800 font-bold text-xs`}>
                                {appointment.customer_name.charAt(0)}
                              </Text>
                            </View>
                            <Text style={[tw`font-semibold flex-1`, { color: textPrimary }]}>
                              {appointment.customer_name}
                            </Text>
                          </View>
                          <Text style={[tw`text-xs ml-10`, { color: textSecondary }]}>
                            #{appointment.ticket_number}
                          </Text>
                        </View>
                        <View style={[
                          tw`px-2 py-1 rounded-full`,
                          { backgroundColor: statusColor.bg }
                        ]}>
                          <Text style={[tw`text-xs font-semibold`, { color: statusColor.text }]}>
                            {appointment.status === 'pending' ? 'Pending' :
                             appointment.status === 'in_progress' ? 'In Progress' :
                             appointment.status === 'completed' ? 'Completed' : 'Cancelled'}
                          </Text>
                        </View>
                      </View>
                      <View style={tw`flex-row justify-between items-center mt-2`}>
                        <View>
                          <Text style={[tw`text-sm font-medium`, { color: textPrimary }]}>
                            {appointment.time}
                          </Text>
                          <Text style={[tw`text-xs`, { color: textSecondary }]}>
                            {appointment.date}
                          </Text>
                        </View>
                        <View style={tw`px-2 py-1 rounded-full bg-blue-500/10`}>
                          <Text style={tw`text-blue-600 text-xs`}>
                            {appointment.services_count} services
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={tw`items-center justify-center py-8`}>
                <Text style={[tw`text-lg font-medium mb-1`, { color: textSecondary }]}>
                  No Appointments Today
                </Text>
                <Text style={[tw`text-sm`, { color: textSecondary }]}>
                  There are no appointments scheduled for today
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={tw`px-4 mt-4`}>
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Recent Activity
            </Text>
            {dashboardData.recentCompletedServices.length > 0 ? (
              <View style={tw`gap-4`}>
                {dashboardData.recentCompletedServices.map((service, index) => {
                  const colors = ['#3B82F6', '#22C55E', '#FBBF24', '#8B5CF6'];
                  const color = colors[index % colors.length];
                  return (
                    <View key={service.id} style={tw`flex-row`}>
                      <View style={[
                        tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                        { backgroundColor: color + '20' }
                      ]}>
                        <Text style={tw`text-lg`}>✓</Text>
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={[tw`font-semibold mb-1`, { color: textPrimary }]}>
                          {service.service_name}
                        </Text>
                        <Text style={[tw`text-sm mb-1`, { color: textSecondary }]}>
                          Completed by {service.customer_name} at {service.seat}
                        </Text>
                        <Text style={[tw`text-xs`, { color: textSecondary }]}>
                          {formatDate(service.completed_at)} • {service.duration}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={tw`items-center justify-center py-8`}>
                <Text style={[tw`text-sm`, { color: textSecondary }]}>
                  No recent activity
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Top Services */}
        <View style={tw`px-4 mt-4`}>
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Top Services
            </Text>
            {dashboardData.serviceAnalytics.length > 0 ? (
              <View style={tw`gap-3`}>
                {dashboardData.serviceAnalytics.map((service, index) => (
                  <View
                    key={index}
                    style={[
                      tw`rounded-xl p-3`,
                      { backgroundColor: isDark ? '#374151' : '#F9FAFB' }
                    ]}
                  >
                    <View style={tw`flex-row items-center justify-between`}>
                      <View style={tw`flex-row items-center flex-1`}>
                        <View style={[
                          tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
                          { backgroundColor: '#9A3412' + '20' }
                        ]}>
                          <Text style={tw`text-orange-800 font-bold text-xs`}>
                            {service.service_name.charAt(0)}
                          </Text>
                        </View>
                        <Text style={[tw`font-semibold flex-1`, { color: textPrimary }]}>
                          {service.service_name}
                        </Text>
                      </View>
                    </View>
                    <View style={tw`flex-row justify-between items-center mt-2 ml-11`}>
                      <View style={tw`px-2 py-1 rounded-full bg-blue-500/10`}>
                        <Text style={tw`text-blue-600 text-xs`}>
                          {service.total_bookings} bookings
                        </Text>
                      </View>
                      <Text style={[tw`font-semibold`, { color: '#22C55E' }]}>
                        {currencySymbol} {service.total_revenue.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={tw`items-center justify-center py-8`}>
                <Text style={[tw`text-sm`, { color: textSecondary }]}>
                  No service data available
                </Text>
              </View>
            )}
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>
    );
}
