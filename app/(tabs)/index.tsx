import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sidebar } from '@/components/sidebar';
import { apiClient } from '@/lib/api/client';

// Mock data - Replace with actual API calls
const mockData = {
  appointmentStats: {
    today_total: 12,
    today_pending: 3,
    over_all_apoinment: 156,
    today_in_progress: 2,
    today_completed: 7,
    today_cancelled: 0,
  },
  seatStats: {
    total: 8,
    available: 5,
    occupied: 2,
    maintenance: 1,
    cleaning: 0,
  },
  revenueStats: {
    today: 1250.00,
    week: 8750.00,
    month: 32500.00,
    grand_total: 125000.00,
  },
  customerInsights: {
    total_customers: 89,
    new_customers: 12,
    repeat_customers: 77,
  },
  upcomingAppointments: [
    {
      id: 1,
      customer_name: 'John Doe',
      date: 'Dec 15, 2024',
      time: '10:00 AM',
      ticket_number: 'T001',
      services_count: 2,
      status: 'pending',
    },
    {
      id: 2,
      customer_name: 'Jane Smith',
      date: 'Dec 15, 2024',
      time: '11:30 AM',
      ticket_number: 'T002',
      services_count: 1,
      status: 'in_progress',
    },
    {
      id: 3,
      customer_name: 'Mike Johnson',
      date: 'Dec 15, 2024',
      time: '2:00 PM',
      ticket_number: 'T003',
      services_count: 3,
      status: 'pending',
    },
  ],
  recentCompletedServices: [
    {
      id: 1,
      customer_name: 'Sarah Williams',
      service_name: 'Haircut & Styling',
      seat: 'Seat 1',
      completed_at: '2024-12-15T09:30:00',
      duration: '45 min',
    },
    {
      id: 2,
      customer_name: 'David Brown',
      service_name: 'Beard Trim',
      seat: 'Seat 3',
      completed_at: '2024-12-15T08:15:00',
      duration: '20 min',
    },
  ],
  serviceAnalytics: [
    {
      service_name: 'Haircut & Styling',
      total_bookings: 45,
      total_revenue: 6750.00,
    },
    {
      service_name: 'Beard Trim',
      total_bookings: 32,
      total_revenue: 1920.00,
    },
    {
      service_name: 'Hair Color',
      total_bookings: 18,
      total_revenue: 5400.00,
    },
  ],
};

const currency_symbol = '₹';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: Fetch data from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Close sidebar first
              setSidebarVisible(false);
              
              // Call logout API
              await apiClient.logout();
              
              // Navigate to login screen
              setTimeout(() => {
                router.replace('/');
              }, 200);
            } catch (error) {
              console.error('Logout error:', error);
              // Even if API call fails, clear local token and redirect
              await apiClient.logout();
              setTimeout(() => {
                router.replace('/');
              }, 200);
            }
          },
        },
      ]
    );
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  return (
    <>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onLogout={handleLogout}
      />
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
        <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-4`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header with Burger Menu */}
        <View style={tw`px-4 pt-4 pb-2 flex-row justify-between items-center`}>
          <TouchableOpacity
            onPress={() => setSidebarVisible(true)}
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
                <View style={tw`w-10 h-10 rounded-full bg-green-500/20 items-center justify-center`}>
                  <Text style={tw`text-lg`}>💰</Text>
                </View>
                <View style={tw`px-2 py-1 rounded-full bg-green-500/10`}>
                  <Text style={tw`text-green-600 text-xs font-semibold`}>Today</Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-bold mb-1`, { color: textPrimary }]}>
                {currency_symbol} {mockData.revenueStats.grand_total.toLocaleString()}
              </Text>
              <Text style={[tw`text-xs`, { color: textSecondary }]}>Total Revenue</Text>
              <Text style={[tw`text-sm font-semibold mt-1`, { color: '#22C55E' }]}>
                {currency_symbol} {mockData.revenueStats.today.toFixed(2)} today
              </Text>
            </View>

            {/* Appointments Card */}
            <View style={[
              tw`rounded-2xl p-4 flex-1 min-w-[48%]`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center`}>
                  <Text style={tw`text-lg`}>📅</Text>
                </View>
                <View style={tw`px-2 py-1 rounded-full bg-blue-500/10`}>
                  <Text style={tw`text-blue-600 text-xs font-semibold`}>Today</Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-bold mb-1`, { color: textPrimary }]}>
                {mockData.appointmentStats.over_all_apoinment}
              </Text>
              <Text style={[tw`text-xs`, { color: textSecondary }]}>Total Appointments</Text>
              <View style={tw`flex-row gap-2 mt-1`}>
                <View style={tw`px-2 py-0.5 rounded-full bg-yellow-500/10`}>
                  <Text style={tw`text-yellow-600 text-xs`}>{mockData.appointmentStats.today_pending} pending</Text>
                </View>
                <View style={tw`px-2 py-0.5 rounded-full bg-green-500/10`}>
                  <Text style={tw`text-green-600 text-xs`}>{mockData.appointmentStats.today_completed} done</Text>
                </View>
              </View>
            </View>

            {/* Customers Card */}
            <View style={[
              tw`rounded-2xl p-4 flex-1 min-w-[48%] mt-3`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center`}>
                  <Text style={tw`text-lg`}>👥</Text>
                </View>
                <View style={tw`px-2 py-1 rounded-full bg-purple-500/10`}>
                  <Text style={tw`text-purple-600 text-xs font-semibold`}>New</Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-bold mb-1`, { color: textPrimary }]}>
                {mockData.customerInsights.total_customers}
              </Text>
              <Text style={[tw`text-xs`, { color: textSecondary }]}>Total Customers</Text>
              <Text style={[tw`text-sm font-semibold mt-1`, { color: '#8B5CF6' }]}>
                {mockData.customerInsights.new_customers} new • {mockData.customerInsights.repeat_customers} returning
              </Text>
            </View>

            {/* Seats Card */}
            <View style={[
              tw`rounded-2xl p-4 flex-1 min-w-[48%] mt-3`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`w-10 h-10 rounded-full bg-orange-500/20 items-center justify-center`}>
                  <Text style={tw`text-lg`}>🪑</Text>
                </View>
                <View style={tw`px-2 py-1 rounded-full bg-orange-500/10`}>
                  <Text style={tw`text-orange-600 text-xs font-semibold`}>Available</Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-bold mb-1`, { color: textPrimary }]}>
                {mockData.seatStats.total}
              </Text>
              <Text style={[tw`text-xs`, { color: textSecondary }]}>Total Seats</Text>
              <Text style={[tw`text-sm font-semibold mt-1`, { color: '#F97316' }]}>
                {mockData.seatStats.available} available • {mockData.seatStats.occupied} occupied
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
                  {mockData.appointmentStats.today_total}
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>Total</Text>
              </View>
              <View style={tw`flex-1 bg-yellow-500/10 rounded-xl p-3 items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: '#FBBF24' }]}>
                  {mockData.appointmentStats.today_pending}
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>Pending</Text>
              </View>
              <View style={tw`flex-1 bg-green-500/10 rounded-xl p-3 items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: '#22C55E' }]}>
                  {mockData.appointmentStats.today_completed}
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>Completed</Text>
              </View>
            </View>

            {/* Appointments List */}
            {mockData.upcomingAppointments.length > 0 ? (
              <View style={tw`gap-3`}>
                {mockData.upcomingAppointments.map((appointment) => {
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
            {mockData.recentCompletedServices.length > 0 ? (
              <View style={tw`gap-4`}>
                {mockData.recentCompletedServices.map((service, index) => {
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
            {mockData.serviceAnalytics.length > 0 ? (
              <View style={tw`gap-3`}>
                {mockData.serviceAnalytics.map((service, index) => (
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
                        {currency_symbol} {service.total_revenue.toFixed(2)}
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
    </>
  );
}
