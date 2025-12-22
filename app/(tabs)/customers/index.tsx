import { CustomersIcon, Input, SearchIcon, Text } from '@/components/atoms';
import { AddCustomerModal } from '@/components/molecules';
import { GlobalHeader } from '@/components/organisms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient, ApiError } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { showToast } from '@/lib/toast';
import { router, useFocusEffect } from 'expo-router';
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

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  address?: string;
  is_active?: boolean;
  appointments_count?: number;
}

interface CustomersResponse {
  success?: boolean;
  data?: {
    data: Customer[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters?: {
    search?: string;
    status?: string;
    gender?: string;
    sort?: string;
    direction?: string;
  };
}

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [filterAnimation] = useState(new Animated.Value(1));
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchCustomers = useCallback(async (page = 1, status = '', gender = '', search = '') => {
    if (!isAuthenticated || isChecking) return;

    try {
      setLoading(page === 1);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (gender) params.append('gender', gender);
      params.append('page', page.toString());

      const response = await apiClient.get<CustomersResponse>(
        `${API_ENDPOINTS.CUSTOMERS}?${params.toString()}`
      );

      if (response.success && response.data) {
        const data = response.data;
        // Handle both pagination object and direct data array
        const items = Array.isArray(data) ? data : (data.data || []);
        if (page === 1) {
          setCustomers(items);
        } else {
          setCustomers(prev => [...prev, ...items]);
        }
        setCurrentPage(Array.isArray(data) ? page : (data.current_page || page));
        setLastPage(Array.isArray(data) ? 1 : (data.last_page || 1));
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to load customers', 'Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, isChecking]);

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      fetchCustomers(1, statusFilter, genderFilter, searchQuery);
    }
  }, [isAuthenticated, isChecking, statusFilter, genderFilter, searchQuery]);

  // Refresh when screen comes into focus (e.g., when returning from detail page)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && !isChecking) {
        fetchCustomers(1, statusFilter, genderFilter, searchQuery);
      }
    }, [isAuthenticated, isChecking, statusFilter, genderFilter, searchQuery, fetchCustomers])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCustomers(1, statusFilter, genderFilter, searchQuery);
  }, [fetchCustomers, statusFilter, genderFilter, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const getStatusColor = (isActive: boolean) => {
    if (isActive) {
      return { 
        bg: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)', 
        text: SalozyColors.status.success 
      };
    }
    return { 
      bg: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)', 
      text: colors.textSecondary 
    };
  };

  const getGenderColor = (gender?: string) => {
    switch (gender) {
      case 'male':
        return { 
          bg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', 
          text: SalozyColors.status.info 
        };
      case 'female':
        return { 
          bg: isDark ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.1)', 
          text: '#EC4899' 
        };
      default:
        return { 
          bg: colors.secondaryBg, 
          text: colors.textSecondary 
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

  const activeFilterCount = [searchQuery, statusFilter, genderFilter].filter(Boolean).length;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
      <GlobalHeader
        title="Customers"
        subtitle="Manage your customers"
        rightAction={
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[
              tw`px-3 py-2 rounded-xl`,
              { backgroundColor: SalozyColors.primary.DEFAULT }
            ]}
            activeOpacity={0.8}
          >
            <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
              + New
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
        <View style={tw`px-4 mt-2 gap-4`}>
          {/* Filters Section */}
          <View style={[
            tw`rounded-2xl p-4`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor }
          ]}>
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={tw`flex-row items-center justify-between mb-3`}
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
                  {(searchQuery || statusFilter || genderFilter) && (
                    <Text size="xs" variant="secondary" style={tw`mt-0.5`}>
                      {activeFilterCount} active
                    </Text>
                  )}
                </View>
                {(searchQuery || statusFilter || genderFilter) && (
                  <View style={[
                    tw`px-2.5 py-1 rounded-full mr-2`,
                    { backgroundColor: SalozyColors.primary.DEFAULT }
                  ]}>
                    <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                      {activeFilterCount}
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
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                    leftIcon={
                      <SearchIcon size={20} color={colors.placeholder} />
                    }
                    containerStyle={tw`mb-0`}
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
                      { value: '', label: 'All' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ].map((statusOption) => {
                      const statusConfig = statusOption.value !== '' ? getStatusColor(statusOption.value === 'active') : null;
                      const isSelected = statusFilter === statusOption.value;
                      return (
                        <TouchableOpacity
                          key={statusOption.value}
                          onPress={() => {
                            setStatusFilter(statusOption.value);
                            setCurrentPage(1);
                          }}
                          style={[
                            tw`px-3 py-2.5 rounded-xl`,
                            {
                              backgroundColor: isSelected 
                                ? (statusOption.value === '' ? SalozyColors.primary.DEFAULT : statusConfig?.bg || colors.secondaryBg)
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
                                ? (statusOption.value === '' ? '#FFFFFF' : statusConfig?.text || colors.textPrimary)
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

                {/* Gender Filter */}
                <View style={tw`mb-4`}>
                  <View style={tw`mb-3`}>
                    <Text size="sm" weight="semibold" variant="secondary">
                      Gender
                    </Text>
                  </View>
                  <View style={tw`flex-row flex-wrap gap-2`}>
                    {[
                      { value: '', label: 'All' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ].map((genderOption) => {
                      const genderConfig = genderOption.value !== '' ? getGenderColor(genderOption.value) : null;
                      const isSelected = genderFilter === genderOption.value;
                      return (
                        <TouchableOpacity
                          key={genderOption.value}
                          onPress={() => {
                            setGenderFilter(genderOption.value);
                            setCurrentPage(1);
                          }}
                          style={[
                            tw`px-3 py-2.5 rounded-xl`,
                            {
                              backgroundColor: isSelected 
                                ? (genderOption.value === '' ? SalozyColors.primary.DEFAULT : genderConfig?.bg || colors.secondaryBg)
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
                                ? (genderOption.value === '' ? '#FFFFFF' : genderConfig?.text || colors.textPrimary)
                                : colors.textPrimary 
                            }}
                          >
                            {genderOption.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Clear Filters Button */}
                {(searchQuery || statusFilter || genderFilter) && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setStatusFilter('');
                      setGenderFilter('');
                      setCurrentPage(1);
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

          {/* Customers List */}
          {loading && customers.length === 0 ? (
            <View style={tw`items-center justify-center py-20`}>
              <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
              <Text style={tw`mt-4`} variant="secondary">Loading customers...</Text>
            </View>
          ) : customers.length === 0 ? (
            <View style={[
              tw`rounded-2xl p-8 items-center justify-center`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <CustomersIcon size={48} color={colors.textSecondary} />
              <Text size="lg" weight="bold" variant="primary" style={tw`mt-4 mb-2`}>
                No customers found
              </Text>
              <Text size="sm" variant="secondary" style={tw`text-center`}>
                {searchQuery || statusFilter || genderFilter
                  ? 'Try adjusting your filters'
                  : 'Add your first customer to get started'}
              </Text>
            </View>
          ) : (
            <View style={tw`gap-3`}>
              {customers.map((customer) => {
                const statusConfig = getStatusColor(customer.is_active ?? true);
                const genderConfig = getGenderColor(customer.gender || undefined);
                
                return (
                  <TouchableOpacity
                    key={customer.id}
                    onPress={() => router.push(`/(tabs)/customers/${customer.id}`)}
                    activeOpacity={0.7}
                    style={[
                      tw`rounded-2xl p-4`,
                      { backgroundColor: cardBg, borderWidth: 1, borderColor }
                    ]}
                  >
                    <View style={tw`flex-row items-center justify-between mb-3`}>
                      <View style={tw`flex-row items-center flex-1 min-w-0`}>
                        <View
                          style={[
                            tw`w-12 h-12 rounded-full items-center justify-center mr-3 flex-shrink-0`,
                            { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
                          ]}
                        >
                          <CustomersIcon
                            size={24}
                            color={SalozyColors.status.info}
                          />
                        </View>
                        <View style={tw`flex-1 min-w-0`}>
                          <Text size="base" weight="bold" variant="primary" style={tw`mb-1`} numberOfLines={1}>
                            {customer.name}
                          </Text>
                          <Text size="sm" variant="secondary" numberOfLines={1}>
                            {customer.email}
                          </Text>
                          {customer.phone && (
                            <Text size="xs" variant="secondary" style={tw`mt-1`} numberOfLines={1}>
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

                    <View style={tw`flex-row items-center gap-2 flex-wrap`}>
                      {customer.gender && (
                        <View style={[
                          tw`px-2 py-1 rounded-lg`,
                          { backgroundColor: genderConfig.bg }
                        ]}>
                          <Text size="xs" weight="medium" style={{ color: genderConfig.text }}>
                            {customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1)}
                          </Text>
                        </View>
                      )}
                      {customer.appointments_count !== undefined && (
                        <View style={[
                          tw`px-2 py-1 rounded-lg`,
                          { backgroundColor: colors.secondaryBg }
                        ]}>
                          <Text size="xs" variant="secondary" weight="medium">
                            {customer.appointments_count} {customer.appointments_count === 1 ? 'appointment' : 'appointments'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Load More Button */}
          {!loading && currentPage < lastPage && (
            <TouchableOpacity
              onPress={() => fetchCustomers(currentPage + 1, statusFilter, genderFilter, searchQuery)}
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
      </ScrollView>

      {/* Add Customer Modal */}
      <AddCustomerModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchCustomers(1, statusFilter, genderFilter, searchQuery);
        }}
      />
    </SafeAreaView>
  );
}
