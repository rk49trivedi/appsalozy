import { Text } from '@/components/atoms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_CONFIG } from '@/lib/api/config';
import { Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface RefundDetail {
  refund_method?: string;
  refund_reference?: string;
  refund_amount?: number;
  currency?: string;
  refund_date?: string;
  reason?: string;
  notes?: string;
  receipt_path?: string;
  processed_by?: { name: string };
  processed_at?: string;
  status?: string;
}

interface PlanRefundDetailModalProps {
  visible: boolean;
  refundDetail: RefundDetail | null;
  onClose: () => void;
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

export function PlanRefundDetailModal({
  visible,
  refundDetail,
  onClose,
}: PlanRefundDetailModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: cardBg }]} edges={['top', 'bottom']}>
        <View style={tw`flex-1`}>
          {/* Header */}
          <View style={[tw`px-4 py-4 border-b flex-row items-center justify-between`, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <Text size="lg" weight="bold" variant="primary">Refund Details</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                { backgroundColor: colors.secondaryBg }
              ]}
            >
              <Text size="xl" variant="secondary">×</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 gap-4`}>
            {refundDetail && (
              <>
                <View style={tw`gap-4`}>
                  <View style={tw`flex-row justify-between`}>
                    <Text size="sm" weight="bold" variant="secondary">Refund Method</Text>
                    <Text size="sm" variant="primary">
                      {refundDetail.refund_method?.charAt(0).toUpperCase() + refundDetail.refund_method?.slice(1).replace('_', ' ') || 'N/A'}
                    </Text>
                  </View>
                  <View style={tw`flex-row justify-between`}>
                    <Text size="sm" weight="bold" variant="secondary">Refund Amount</Text>
                    <Text size="sm" weight="bold" variant="primary">
                      {refundDetail.currency === 'INR' ? '₹' : refundDetail.currency || '₹'} {refundDetail.refund_amount?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  {refundDetail.refund_reference && (
                    <View style={tw`flex-row justify-between`}>
                      <Text size="sm" weight="bold" variant="secondary">Refund Reference</Text>
                      <Text size="sm" variant="primary">{refundDetail.refund_reference}</Text>
                    </View>
                  )}
                  <View style={tw`flex-row justify-between`}>
                    <Text size="sm" weight="bold" variant="secondary">Refund Date</Text>
                    <Text size="sm" variant="primary">
                      {refundDetail.refund_date ? formatDate(refundDetail.refund_date) : 'N/A'}
                    </Text>
                  </View>
                  {refundDetail.processed_by && (
                    <View style={tw`flex-row justify-between`}>
                      <Text size="sm" weight="bold" variant="secondary">Processed By</Text>
                      <Text size="sm" variant="primary">{refundDetail.processed_by.name}</Text>
                    </View>
                  )}
                  {refundDetail.processed_at && (
                    <View style={tw`flex-row justify-between`}>
                      <Text size="sm" weight="bold" variant="secondary">Processed At</Text>
                      <Text size="sm" variant="primary">
                        {new Date(refundDetail.processed_at).toLocaleString()}
                      </Text>
                    </View>
                  )}
                  <View style={tw`flex-row justify-between`}>
                    <Text size="sm" weight="bold" variant="secondary">Status</Text>
                    <View style={[
                      tw`px-2 py-1 rounded-full`,
                      { backgroundColor: refundDetail.status === 'processed' ? (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)') : (isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)') }
                    ]}>
                      <Text size="xs" weight="semibold" style={{ color: refundDetail.status === 'processed' ? SalozyColors.status.success : SalozyColors.status.warning }}>
                        {refundDetail.status?.charAt(0).toUpperCase() + refundDetail.status?.slice(1) || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>

                {refundDetail.reason && (
                  <View>
                    <Text size="sm" weight="bold" variant="secondary" style={tw`mb-2`}>Reason for Refund</Text>
                    <View style={[tw`p-3 rounded-lg`, { backgroundColor: colors.secondaryBg }]}>
                      <Text size="sm" variant="primary">{refundDetail.reason}</Text>
                    </View>
                  </View>
                )}

                {refundDetail.notes && (
                  <View>
                    <Text size="sm" weight="bold" variant="secondary" style={tw`mb-2`}>Notes</Text>
                    <View style={[tw`p-3 rounded-lg`, { backgroundColor: colors.secondaryBg }]}>
                      <Text size="sm" variant="primary">{refundDetail.notes}</Text>
                    </View>
                  </View>
                )}

                {refundDetail.receipt_path && (
                  <View>
                    <Text size="sm" weight="bold" variant="secondary" style={tw`mb-2`}>Refund Receipt</Text>
                    <TouchableOpacity
                      onPress={() => {
                        // Open receipt URL
                        const url = `${API_CONFIG.BASE_URL}/${refundDetail.receipt_path}`;
                        // You can use Linking.openURL(url) here if needed
                      }}
                      style={[
                        tw`p-3 rounded-lg items-center`,
                        { backgroundColor: SalozyColors.status.info }
                      ]}
                    >
                      <Text size="sm" weight="bold" style={{ color: '#FFFFFF' }}>View Receipt</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    tw`px-6 py-4 rounded-xl items-center mt-2`,
                    { backgroundColor: SalozyColors.primary.DEFAULT }
                  ]}
                >
                  <Text size="base" weight="bold" style={{ color: '#FFFFFF' }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
