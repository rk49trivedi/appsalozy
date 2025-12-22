import { Input, RevenueIcon, SearchIcon, Text } from '@/components/atoms';
import {
  PlanActivationModal,
  PlanCancelConfirmModal,
  PlanRefundDetailModal,
  PlanRefundModal
} from '@/components/molecules';
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
  Animated,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface PurchasedPlan {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  plan: {
    id: number;
    name: string;
    price: number;
    validity_days: number;
  };
  created_at: string;
  purchased_at?: string;
  currency_symbol?: string;
  currency_text?: string;
  expires_at?: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'refunded' | 'pending';
  discount_amount?: number;
  original_price?: number;
  final_price?: number;
  transaction_detail?: {
    id?: number;
    payment_method?: string;
    payment_reference?: string;
    amount?: number;
    currency?: string;
    payment_date?: string;
    notes?: string;
    receipt_path?: string;
    activated_by?: {
      id: number;
      name: string;
    } | null;
    activated_at?: string;
  } | null;
  planServiceUsages?: Array<{
    id?: number;
    service: {
      id: number;
      name: string;
    };
    remaining_count: number;
    used_count: number;
  }>;
  can_refund?: boolean;
  can_change_status?: boolean;
  is_expired?: boolean;
  has_used_services?: boolean;
  show_cancel_button?: boolean;
  refund_detail?: {
    id?: number;
    refund_method?: string;
    refund_reference?: string;
    refund_amount?: number;
    currency?: string;
    refund_date?: string;
    reason?: string;
    notes?: string;
    receipt_path?: string;
    processed_by?: {
      id: number;
      name: string;
    } | null;
    processed_at?: string;
    status?: string;
  } | null;
}

interface PurchasedPlansResponse {
  success?: boolean;
  data?: {
    data: PurchasedPlan[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters?: {
    search?: string;
    status?: string;
  };
}

export default function PurchasedPlansScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, isChecking } = useAuth(true);
  const colors = getThemeColors(isDark);
  
  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [plans, setPlans] = useState<PurchasedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [filterAnimation] = useState(new Animated.Value(1));
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [refundingId, setRefundingId] = useState<number | null>(null);
  
  // Modal states
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PurchasedPlan | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefundPlan, setSelectedRefundPlan] = useState<PurchasedPlan | null>(null);
  const [showRefundDetailModal, setShowRefundDetailModal] = useState(false);
  const [selectedRefundDetail, setSelectedRefundDetail] = useState<PurchasedPlan['refund_detail'] | null>(null);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [selectedCancelPlan, setSelectedCancelPlan] = useState<PurchasedPlan | null>(null);
  
  // Processing states
  const [transactionProcessing, setTransactionProcessing] = useState(false);
  const [refundProcessing, setRefundProcessing] = useState(false);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isChecking]);

  const fetchPlans = useCallback(async (page = 1, status = '', search = '') => {
    if (!isAuthenticated || isChecking) return;

    try {
      setLoading(page === 1);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      params.append('page', page.toString());

      const response = await apiClient.get<PurchasedPlansResponse>(
        `${API_ENDPOINTS.PURCHASED_PLANS}?${params.toString()}`
      );

      if (response.success && response.data) {
        const data = response.data;
        // Handle both pagination object and direct data array
        const items = Array.isArray(data) ? data : (data.data || []);
        if (page === 1) {
          setPlans(items);
        } else {
          setPlans(prev => [...prev, ...items]);
        }
        setCurrentPage(Array.isArray(data) ? page : (data.current_page || page));
        setLastPage(Array.isArray(data) ? 1 : (data.last_page || 1));
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to load purchased plans', 'Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, isChecking]);

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      fetchPlans(1, statusFilter, searchQuery);
    }
  }, [isAuthenticated, isChecking, statusFilter, searchQuery]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && !isChecking) {
        fetchPlans(1, statusFilter, searchQuery);
      }
    }, [isAuthenticated, isChecking, statusFilter, searchQuery, fetchPlans])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlans(1, statusFilter, searchQuery);
  }, [fetchPlans, statusFilter, searchQuery]);

  const handleUpdateStatus = async (plan: PurchasedPlan, newStatus: 'active' | 'inactive' | 'cancelled' | 'pending' | 'expired') => {
    // If activating, show modal with transaction form
    if (newStatus === 'active' && plan.status !== 'active') {
      setSelectedPlan(plan);
      setShowActivationModal(true);
      return;
    }

    // For other status changes, proceed directly
    Alert.alert(
      'Update Status',
      `Are you sure you want to change the status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setUpdatingStatusId(plan.id);
              const response = await apiClient.post(API_ENDPOINTS.PURCHASED_PLAN_UPDATE_STATUS(plan.id), {
                status: newStatus,
              });
              
              if (response.success) {
                showToast.success(response.message || 'Status updated successfully', 'Success');
                fetchPlans(currentPage, statusFilter, searchQuery);
              } else {
                showToast.error(response.message || 'Failed to update status', 'Error');
              }
            } catch (err: any) {
              const apiError = err as ApiError;
              showToast.error(apiError.message || 'Failed to update status', 'Error');
            } finally {
              setUpdatingStatusId(null);
            }
          },
        },
      ]
    );
  };

  const handleActivatePlan = async (data: {
    payment_method: string;
    payment_reference?: string;
    amount: number;
    payment_date: string;
    notes?: string;
    receipt?: { uri: string; type: string; name: string } | null;
  }) => {
    if (!selectedPlan) return;

    try {
      setTransactionProcessing(true);
      const formData = new FormData();
      formData.append('status', 'active');
      formData.append('payment_method', data.payment_method);
      formData.append('payment_reference', data.payment_reference || '');
      formData.append('amount', data.amount.toString());
      formData.append('payment_date', data.payment_date);
      formData.append('notes', data.notes || '');
      if (data.receipt) {
        formData.append('receipt', data.receipt as any);
      }

      const response = await apiClient.postFormData(API_ENDPOINTS.PURCHASED_PLAN_UPDATE_STATUS(selectedPlan.id), formData);
      
      if (response.success) {
        showToast.success(response.message || 'Plan activated successfully', 'Success');
        setShowActivationModal(false);
        setSelectedPlan(null);
        fetchPlans(currentPage, statusFilter, searchQuery);
      } else {
        showToast.error(response.message || 'Failed to activate plan', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 422) {
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to activate plan', 'Error');
      }
    } finally {
      setTransactionProcessing(false);
    }
  };

  const handleRefundClick = (plan: PurchasedPlan) => {
    setSelectedRefundPlan(plan);
    setShowRefundModal(true);
  };

  const handleProcessRefund = async (data: {
    refund_method: string;
    refund_reference?: string;
    refund_amount: number;
    refund_date: string;
    reason?: string;
    notes?: string;
    receipt?: { uri: string; type: string; name: string } | null;
  }) => {
    if (!selectedRefundPlan) return;

    try {
      setRefundProcessing(true);
      const formData = new FormData();
      formData.append('refund_method', data.refund_method);
      formData.append('refund_reference', data.refund_reference || '');
      formData.append('refund_amount', data.refund_amount.toString());
      formData.append('refund_date', data.refund_date);
      formData.append('reason', data.reason || '');
      formData.append('notes', data.notes || '');
      // Note: currency is handled by API from planUsage->currency_text
      if (data.receipt) {
        formData.append('receipt', {
          uri: data.receipt.uri,
          type: data.receipt.type || 'image/jpeg',
          name: data.receipt.name || 'refund_receipt.jpg',
        } as any);
      }

      const response = await apiClient.postFormData(API_ENDPOINTS.PURCHASED_PLAN_REFUND(selectedRefundPlan.id), formData);
      
      if (response.success) {
        showToast.success(response.message || 'Refund processed successfully', 'Success');
        setShowRefundModal(false);
        setSelectedRefundPlan(null);
        fetchPlans(currentPage, statusFilter, searchQuery);
      } else {
        showToast.error(response.message || 'Failed to process refund', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError.status === 422) {
        const errors = apiError.errors || {};
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || 'Validation failed';
        showToast.error(errorMessage, 'Validation Error');
      } else {
        showToast.error(apiError.message || 'Failed to process refund', 'Error');
      }
    } finally {
      setRefundProcessing(false);
    }
  };

  const handleCancelPlan = (plan: PurchasedPlan) => {
    setSelectedCancelPlan(plan);
    setShowCancelConfirmModal(true);
  };

  const handleConfirmCancelPlan = async () => {
    if (!selectedCancelPlan) return;

    try {
      setUpdatingStatusId(selectedCancelPlan.id);
      const response = await apiClient.post(API_ENDPOINTS.PURCHASED_PLAN_UPDATE_STATUS(selectedCancelPlan.id), {
        status: 'cancelled',
      });
      
      if (response.success) {
        showToast.success(response.message || 'Plan cancelled successfully', 'Success');
        setShowCancelConfirmModal(false);
        setSelectedCancelPlan(null);
        fetchPlans(currentPage, statusFilter, searchQuery);
      } else {
        showToast.error(response.message || 'Failed to cancel plan', 'Error');
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      showToast.error(apiError.message || 'Failed to cancel plan', 'Error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          bg: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)', 
          text: SalozyColors.status.success 
        };
      case 'pending':
        return { 
          bg: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)', 
          text: SalozyColors.status.warning 
        };
      case 'inactive':
        return { 
          bg: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)', 
          text: colors.textSecondary 
        };
      case 'cancelled':
        return { 
          bg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', 
          text: SalozyColors.status.error 
        };
      case 'expired':
        return { 
          bg: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)', 
          text: SalozyColors.status.warning 
        };
      case 'refunded':
        return { 
          bg: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)', 
          text: '#8B5CF6' 
        };
      default:
        return { 
          bg: colors.secondaryBg, 
          text: colors.textPrimary 
        };
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return String(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return String(dateString || 'N/A');
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

  const activeFilterCount = [searchQuery, statusFilter].filter(Boolean).length;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]} edges={['top']}>
      <GlobalHeader
        title="Purchased Plans"
        subtitle="Manage customer plan purchases"
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
                  {(searchQuery || statusFilter) && (
                    <Text size="xs" variant="secondary" style={tw`mt-0.5`}>
                      {activeFilterCount} active
                    </Text>
                  )}
                </View>
                {(searchQuery || statusFilter) && (
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
                    placeholder="Search by customer name, email, or phone..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
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
                      { value: 'pending', label: 'Pending' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'cancelled', label: 'Cancelled' },
                      { value: 'expired', label: 'Expired' },
                      { value: 'refunded', label: 'Refunded' },
                    ].map((statusOption) => {
                      const statusConfig = statusOption.value !== '' ? getStatusColor(statusOption.value) : null;
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

                {/* Clear Filters Button */}
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
              </Animated.View>
            )}
          </View>

          {/* Plans List */}
          {loading && plans.length === 0 ? (
            <View style={tw`items-center justify-center py-20`}>
              <ActivityIndicator size="large" color={SalozyColors.primary.DEFAULT} />
              <Text style={tw`mt-4`} variant="secondary">Loading purchased plans...</Text>
            </View>
          ) : plans.length === 0 ? (
            <View style={[
              tw`rounded-2xl p-8 items-center justify-center`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor }
            ]}>
              <RevenueIcon size={48} color={colors.textSecondary} />
              <Text size="lg" weight="bold" variant="primary" style={tw`mt-4 mb-2`}>
                No purchased plans found
              </Text>
              <Text size="sm" variant="secondary" style={tw`text-center`}>
                {searchQuery || statusFilter
                  ? 'Try adjusting your filters'
                  : 'No customers have purchased plans yet'}
              </Text>
            </View>
          ) : (
            <View style={tw`gap-3`}>
              {plans.map((plan) => {
                const statusConfig = getStatusColor(plan.status);
                
                return (
                  <View
                    key={plan.id}
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
                            { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }
                          ]}
                        >
                          <RevenueIcon
                            size={24}
                            color={SalozyColors.status.success}
                          />
                        </View>
                        <View style={tw`flex-1 min-w-0`}>
                          <Text size="base" weight="bold" variant="primary" style={tw`mb-1`} numberOfLines={1}>
                            {plan.plan.name}
                          </Text>
                          <Text size="sm" variant="secondary" numberOfLines={1}>
                            {plan.user.name}
                          </Text>
                          <Text size="xs" variant="secondary" style={tw`mt-1`} numberOfLines={1}>
                            {plan.user.email}
                          </Text>
                        </View>
                      </View>
                      <View style={[
                        tw`px-2 py-1 rounded-full`,
                        { backgroundColor: statusConfig.bg }
                      ]}>
                        <Text size="xs" weight="semibold" style={{ color: statusConfig.text }}>
                          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View style={tw`gap-2 mb-3`}>
                      <View style={[
                        tw`flex-row justify-between items-center p-2 rounded-lg`,
                        { backgroundColor: colors.secondaryBg }
                      ]}>
                        <Text size="xs" variant="secondary">Price</Text>
                        <Text size="sm" weight="bold" variant="primary">
                          {plan.currency_symbol || '₹'}{plan.final_price?.toFixed(2) || (plan.plan?.price ?? 0).toFixed(2)}
                        </Text>
                      </View>
                      {plan.expires_at && (
                        <View style={[
                          tw`flex-row justify-between items-center p-2 rounded-lg`,
                          { backgroundColor: colors.secondaryBg }
                        ]}>
                          <Text size="xs" variant="secondary">Expires</Text>
                          <Text size="sm" weight="semibold" variant="primary">
                            {formatDate(plan.expires_at)}
                          </Text>
                        </View>
                      )}
                      {plan.planServiceUsages && plan.planServiceUsages.length > 0 && (
                        <View style={[
                          tw`p-2 rounded-lg`,
                          { backgroundColor: colors.secondaryBg }
                        ]}>
                          <Text size="xs" variant="secondary" style={tw`mb-1`}>Services</Text>
                          {plan.planServiceUsages.map((usage, idx) => (
                            <View key={idx} style={tw`flex-row justify-between items-center mt-1`}>
                              <Text size="xs" variant="primary">{usage.service.name}</Text>
                              <Text size="xs" variant="secondary">
                                {usage.used_count}/{usage.remaining_count + usage.used_count} used
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Transaction Details */}
                    {plan.transaction_detail && (
                      <View style={[tw`p-3 rounded-lg mb-3`, { backgroundColor: colors.secondaryBg }]}>
                        <Text size="xs" weight="bold" variant="primary" style={tw`mb-2`}>Payment Details</Text>
                        <View style={tw`gap-1`}>
                          <Text size="xs" variant="secondary">
                            Method: {plan.transaction_detail?.payment_method ? (plan.transaction_detail.payment_method.charAt(0).toUpperCase() + plan.transaction_detail.payment_method.slice(1)) : 'N/A'}
                          </Text>
                          {plan.transaction_detail.payment_reference && (
                            <Text size="xs" variant="secondary">
                              Reference: {plan.transaction_detail.payment_reference}
                            </Text>
                          )}
                          <Text size="xs" variant="secondary">
                            Amount: {plan.currency_symbol || '₹'}{plan.transaction_detail.amount?.toFixed(2)}
                          </Text>
                          {plan.transaction_detail.payment_date && (
                            <Text size="xs" variant="secondary">
                              Date: {formatDate(plan.transaction_detail.payment_date)}
                            </Text>
                          )}
                          {plan.transaction_detail.activated_by && (
                            <Text size="xs" variant="secondary">
                              Activated by: {plan.transaction_detail.activated_by.name}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={tw`gap-2`}>
                      {/* Status dropdown - only if can change status, not expired, not showing cancel button, and not can refund */}
                      {!plan.show_cancel_button && plan.can_change_status && !plan.is_expired && !plan.can_refund && (
                        <View style={tw`flex-row gap-2`}>
                          {plan.status === 'pending' && (
                            <TouchableOpacity
                              onPress={() => handleUpdateStatus(plan, 'active')}
                              disabled={updatingStatusId === plan.id}
                              style={[
                                tw`flex-1 px-4 py-2 rounded-xl items-center`,
                                { 
                                  backgroundColor: updatingStatusId === plan.id ? colors.secondaryBg : SalozyColors.status.success,
                                  opacity: updatingStatusId === plan.id ? 0.6 : 1
                                }
                              ]}
                              activeOpacity={0.8}
                            >
                              {updatingStatusId === plan.id ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                                  Activate
                                </Text>
                              )}
                            </TouchableOpacity>
                          )}
                          {plan.status === 'active' && (
                            <TouchableOpacity
                              onPress={() => handleUpdateStatus(plan, 'inactive')}
                              disabled={updatingStatusId === plan.id}
                              style={[
                                tw`flex-1 px-4 py-2 rounded-xl items-center`,
                                { 
                                  backgroundColor: updatingStatusId === plan.id ? colors.secondaryBg : SalozyColors.status.warning,
                                  opacity: updatingStatusId === plan.id ? 0.6 : 1
                                }
                              ]}
                              activeOpacity={0.8}
                            >
                              {updatingStatusId === plan.id ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                                  Deactivate
                                </Text>
                              )}
                            </TouchableOpacity>
                          )}
                          {plan.status === 'inactive' && (
                            <TouchableOpacity
                              onPress={() => handleUpdateStatus(plan, 'active')}
                              disabled={updatingStatusId === plan.id}
                              style={[
                                tw`flex-1 px-4 py-2 rounded-xl items-center`,
                                { 
                                  backgroundColor: updatingStatusId === plan.id ? colors.secondaryBg : SalozyColors.status.success,
                                  opacity: updatingStatusId === plan.id ? 0.6 : 1
                                }
                              ]}
                              activeOpacity={0.8}
                            >
                              {updatingStatusId === plan.id ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                                  Activate
                                </Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* Cancel button - if show_cancel_button is true */}
                      {plan.show_cancel_button && (
                        <TouchableOpacity
                          onPress={() => handleCancelPlan(plan)}
                          disabled={updatingStatusId === plan.id}
                          style={[
                            tw`px-4 py-2 rounded-xl items-center`,
                            { 
                              backgroundColor: updatingStatusId === plan.id ? colors.secondaryBg : SalozyColors.status.error,
                              opacity: updatingStatusId === plan.id ? 0.6 : 1
                            }
                          ]}
                          activeOpacity={0.8}
                        >
                          {updatingStatusId === plan.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                              Cancel Plan
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Cancel button for active plans with payment (above refund button) */}
                      {plan.status === 'active' && plan.transaction_detail && !plan.show_cancel_button && (
                        <TouchableOpacity
                          onPress={() => handleCancelPlan(plan)}
                          disabled={updatingStatusId === plan.id}
                          style={[
                            tw`px-4 py-2 rounded-xl items-center`,
                            { 
                              backgroundColor: updatingStatusId === plan.id ? colors.secondaryBg : SalozyColors.status.warning,
                              opacity: updatingStatusId === plan.id ? 0.6 : 1
                            }
                          ]}
                          activeOpacity={0.8}
                        >
                          {updatingStatusId === plan.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                              Cancel Plan
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Refund button */}
                      {plan.can_refund && (
                        <TouchableOpacity
                          onPress={() => handleRefundClick(plan)}
                          disabled={refundingId === plan.id}
                          style={[
                            tw`px-4 py-2 rounded-xl items-center`,
                            { 
                              backgroundColor: refundingId === plan.id ? colors.secondaryBg : SalozyColors.status.error,
                              opacity: refundingId === plan.id ? 0.6 : 1
                            }
                          ]}
                          activeOpacity={0.8}
                        >
                          {refundingId === plan.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                              Refund Plan
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* View Refund Details button */}
                      {plan.refund_detail && (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedRefundDetail(plan.refund_detail || null);
                            setShowRefundDetailModal(true);
                          }}
                          style={[
                            tw`px-4 py-2 rounded-xl items-center`,
                            { backgroundColor: SalozyColors.status.info }
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text size="xs" weight="bold" style={{ color: '#FFFFFF' }}>
                            View Refund Details
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Status messages when actions are not available */}
                      {!plan.can_change_status && !plan.show_cancel_button && (
                        <Text size="xs" variant="secondary" style={tw`text-center`}>
                          {plan.refund_detail ? 'Refunded' : plan.status === 'cancelled' ? 'Cancelled' : 'Status locked'}
                        </Text>
                      )}
                      {plan.is_expired && !plan.show_cancel_button && (
                        <Text size="xs" style={[{ color: SalozyColors.status.error }, tw`text-center`]}>
                          Plan expired - Create new plan
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Load More Button */}
          {!loading && currentPage < lastPage && (
            <TouchableOpacity
              onPress={() => fetchPlans(currentPage + 1, statusFilter, searchQuery)}
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

      {/* Activation Modal */}
      <PlanActivationModal
        visible={showActivationModal}
        plan={selectedPlan}
        onClose={() => {
          setShowActivationModal(false);
          setSelectedPlan(null);
        }}
        onSubmit={handleActivatePlan}
        processing={transactionProcessing}
      />

      {/* Refund Modal */}
      <PlanRefundModal
        visible={showRefundModal}
        plan={selectedRefundPlan}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedRefundPlan(null);
        }}
        onSubmit={handleProcessRefund}
        processing={refundProcessing}
      />

      {/* Refund Details Modal */}
      <PlanRefundDetailModal
        visible={showRefundDetailModal}
        refundDetail={selectedRefundDetail || null}
        onClose={() => {
          setShowRefundDetailModal(false);
          setSelectedRefundDetail(null);
        }}
      />

      {/* Cancel Plan Confirmation Modal */}
      <PlanCancelConfirmModal
        visible={showCancelConfirmModal}
        customerName={selectedCancelPlan?.user.name || ''}
        planName={selectedCancelPlan?.plan.name || ''}
        hasUsedServices={selectedCancelPlan?.has_used_services || false}
        onConfirm={handleConfirmCancelPlan}
        onCancel={() => {
          setShowCancelConfirmModal(false);
          setSelectedCancelPlan(null);
        }}
      />
    </SafeAreaView>
  );
}
