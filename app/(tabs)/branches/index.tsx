import { AppointmentsIcon, Input, SearchIcon, Text } from '@/components/atoms';
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
    Alert,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  allow_staff?: boolean;
  currency_symbol?: string;
  currency_text?: string;
  branch_user?: {
    name: string;
    email: string;
  };
}

interface BranchesResponse {
  success?: boolean;
  data?: {
    data: Branch[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  current_branch_id?: number;
  filters?: {
    search?: string;
    status?: string;
    sort?: string;
    direction?: string;
  };
}

export default function BranchesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchBranches = useCallback(async (page = 1, status = '', search = '') => {
    if (!isAuthenticated || isChecking) return;

    try {
      setLoading(page === 1);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      params.append('page', page.toString());

      const response = await apiClient.get<BranchesResponse>(
        `${API_ENDPOINTS.BRANCHES}?${params.toString()}`
      );

      if (response.success && response.data) {
        const data = response.data;
        // Handle both pagination object and direct data array
        const items = Array.isArray(data) ? data : (data.data || []);
        if (page === 1) {
          setBranches(items);
        } else {
          setBranches(prev => [...prev, ...items]);
        }
        setCurrentPage(Array.isArray(data) ? page : (data.current_page || page));
        setLastPage(Array.isArray(data) ? 1 : (data.last_page || 1));
        if (response.current_branch_id) {
          setCurrentBranchId(response.current_branch_id);
        }
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to load branches', 'Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, isChecking]);

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      fetchBranches(1, statusFilter, searchQuery);
    }
  }, [isAuthenticated, isChecking, statusFilter, searchQuery]);

  // Refresh when screen comes into focus (e.g., when returning from edit/create)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && !isChecking) {
        fetchBranches(1, statusFilter, searchQuery);
      }
    }, [isAuthenticated, isChecking, statusFilter, searchQuery, fetchBranches])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBranches(1, statusFilter, searchQuery);
  }, [fetchBranches, statusFilter, searchQuery]);

  const handleDelete = (branchId: number) => {
    Alert.alert(
      'Delete Branch',
      'Are you sure you want to delete this branch? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(branchId);
              const response = await apiClient.delete(API_ENDPOINTS.BRANCH_DELETE(branchId));
              
              if (response.success) {
                showToast.success(response.message || 'Branch deleted successfully', 'Success');
                fetchBranches(currentPage, statusFilter, searchQuery);
              } else {
                showToast.error(response.message || 'Failed to delete branch', 'Error');
              }
            } catch (err: any) {
              const apiError = err as ApiError;
              showToast.error(apiError.message || 'Failed to delete branch', 'Error');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
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

  const activeFilterCount = [searchQuery, statusFilter].filter(Boolean).length;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
      <GlobalHeader
        title="Branches"
        subtitle="Manage your branches"
        showBackButton={true}
        rightAction={
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/branches/create')}
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
                  <Text size="base" weight="bold" variant="primary">Filters</Text>
                  <Text size="xs" variant="secondary">
                    {activeFilterCount > 0 ? `${activeFilterCount} active` : 'No filters applied'}
                  </Text>
                </View>
              </View>
              <Text size="base" variant="secondary">
                {showFilters ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showFilters && (
              <View style={tw`gap-3`}>
                <View>
                  <Text size="xs" variant="secondary" style={tw`mb-2`}>
                    Search
                  </Text>
                  <Input
                    placeholder="Search by name, address, or phone..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    leftIcon={
                      <SearchIcon size={20} color={colors.placeholder} />
                    }
                    containerStyle={tw`mb-0`}
                  />
                </View>

                <View>
                  <Text size="xs" variant="secondary" style={tw`mb-2`}>
                    Status
                  </Text>
                  <View style={tw`flex-row flex-wrap gap-2`}>
                    {[
                      { value: '', label: 'All' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ].map((statusOption) => {
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
                                ? (statusOption.value === '' ? SalozyColors.primary.DEFAULT : 
                                   statusOption.value === 'active' ? SalozyColors.status.success : colors.secondaryBg)
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
                                ? (statusOption.value === '' ? '#FFFFFF' : 
                                   statusOption.value === 'active' ? SalozyColors.status.success : colors.textPrimary)
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

                {(searchQuery || statusFilter) && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setStatusFilter('');
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
              </View>
            )}
          </View>

          {/* Branches List */}
          {loading && branches.length === 0 ? (
            <View style={tw`items-center justify-center py-20`}>
              <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
              <Text style={tw`mt-4`} variant="secondary">Loading branches...</Text>
            </View>
          ) : branches.length === 0 ? (
            <View style={[
              tw`rounded-2xl p-8 items-center justify-center`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <AppointmentsIcon size={48} color={colors.textSecondary} />
              <Text size="lg" weight="bold" variant="primary" style={tw`mt-4 mb-2`}>
                No branches found
              </Text>
              <Text size="sm" variant="secondary" style={tw`text-center`}>
                {searchQuery || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Add your first branch to get started'}
              </Text>
            </View>
          ) : (
            <View style={tw`gap-3`}>
              {branches.map((branch) => {
                const statusConfig = branch.is_active
                  ? { bg: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)', text: SalozyColors.status.success }
                  : { bg: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)', text: colors.textSecondary };
                
                return (
                  <TouchableOpacity
                    key={branch.id}
                    onPress={() => router.push(`/(tabs)/branches/${branch.id}/edit`)}
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
                          <AppointmentsIcon
                            size={24}
                            color={SalozyColors.status.info}
                          />
                        </View>
                        <View style={tw`flex-1 min-w-0`}>
                          <View style={tw`flex-row items-center gap-2`}>
                            <Text size="base" weight="bold" variant="primary" style={tw`mb-1`} numberOfLines={1}>
                              {branch.name}
                            </Text>
                            {currentBranchId === branch.id && (
                              <View style={[
                                tw`px-2 py-0.5 rounded-full`,
                                { backgroundColor: SalozyColors.primary.DEFAULT }
                              ]}>
                                <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                                  Current
                                </Text>
                              </View>
                            )}
                          </View>
                          {branch.address && (
                            <Text size="sm" variant="secondary" numberOfLines={1}>
                              {branch.address}
                            </Text>
                          )}
                          {branch.phone && (
                            <Text size="xs" variant="secondary" style={tw`mt-1`} numberOfLines={1}>
                              {branch.phone}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={[
                        tw`px-2 py-1 rounded-full`,
                        { backgroundColor: statusConfig.bg }
                      ]}>
                        <Text size="xs" weight="semibold" style={{ color: statusConfig.text }}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    <View style={tw`flex-row gap-2 mt-3`}>
                      <TouchableOpacity
                        onPress={() => router.push(`/(tabs)/branches/${branch.id}/edit`)}
                        style={[
                          tw`flex-1 px-4 py-2 rounded-xl items-center`,
                          { backgroundColor: SalozyColors.primary.DEFAULT }
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => router.push(`/(tabs)/branches/${branch.id}/working-hours`)}
                        style={[
                          tw`flex-1 px-4 py-2 rounded-xl items-center`,
                          { backgroundColor: SalozyColors.status.info }
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                          Hours
                        </Text>
                      </TouchableOpacity>
                      {branch.id !== currentBranchId && (
                        <TouchableOpacity
                          onPress={() => handleDelete(branch.id)}
                          disabled={deletingId === branch.id}
                          style={[
                            tw`flex-1 px-4 py-2 rounded-xl items-center`,
                            { 
                              backgroundColor: deletingId === branch.id ? colors.secondaryBg : SalozyColors.status.error,
                              opacity: deletingId === branch.id ? 0.6 : 1
                            }
                          ]}
                          activeOpacity={0.8}
                        >
                          {deletingId === branch.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                              Delete
                            </Text>
                          )}
                        </TouchableOpacity>
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
              onPress={() => fetchBranches(currentPage + 1, statusFilter, searchQuery)}
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
    </SafeAreaView>
  );
}
