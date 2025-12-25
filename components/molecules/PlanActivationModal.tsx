import { Input, Text } from '@/components/atoms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { requestCameraPermissionAsync, requestMediaLibraryPermission } from '@/lib/permissions';
import { showToast } from '@/lib/toast';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { DatePicker } from './DatePicker';

interface PlanActivationModalProps {
  visible: boolean;
  plan: {
    id: number;
    user: { name: string };
    plan: { name: string; price: number };
    currency_symbol?: string;
    final_price?: number;
  } | null;
  onClose: () => void;
  onSubmit: (data: {
    payment_method: string;
    payment_reference?: string;
    amount: number;
    payment_date: string;
    notes?: string;
    receipt?: { uri: string; type: string; name: string } | null;
  }) => Promise<void>;
  processing?: boolean;
}

export function PlanActivationModal({
  visible,
  plan,
  onClose,
  onSubmit,
  processing = false,
}: PlanActivationModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [amount, setAmount] = useState(plan?.final_price ?? plan?.plan.price ?? 0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState<{ uri: string; type: string; name: string } | null>(null);

  const handleSubmit = async () => {
    if (!paymentMethod) {
      showToast.error('Please select a payment method', 'Validation Error');
      return;
    }
    if (!amount || amount <= 0) {
      showToast.error('Please enter a valid amount', 'Validation Error');
      return;
    }
    if (!paymentDate) {
      showToast.error('Please select a payment date', 'Validation Error');
      return;
    }

    await onSubmit({
      payment_method: paymentMethod,
      payment_reference: paymentReference || undefined,
      amount,
      payment_date: paymentDate,
      notes: notes || undefined,
      receipt,
    });
  };

  const handleClose = () => {
    if (!processing) {
      setPaymentMethod('cash');
      setPaymentReference('');
      setAmount(plan?.final_price ?? plan?.plan.price ?? 0);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setReceipt(null);
      onClose();
    }
  };

  // Update amount when plan changes
  useEffect(() => {
    if (plan) {
      setAmount(plan.final_price ?? plan.plan.price ?? 0);
    }
  }, [plan]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: cardBg }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={tw`flex-1`}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={tw`flex-1`}>
            {/* Header */}
            <View style={[tw`px-4 py-4 border-b flex-row items-center justify-between`, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <Text size="lg" weight="bold" variant="primary">Activate Plan - Transaction Details</Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={processing}
                style={[
                  tw`w-10 h-10 rounded-full items-center justify-center`,
                  { backgroundColor: colors.secondaryBg }
                ]}
              >
                <Text size="xl" variant="secondary">×</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={tw`flex-1`} 
              contentContainerStyle={tw`p-4 gap-4 pb-8`}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
            {plan && (
              <View style={[tw`p-4 rounded-lg mb-4`, { backgroundColor: colors.secondaryBg }]}>
                <View style={tw`gap-2`}>
                  <Text size="sm" variant="secondary">Customer: <Text weight="bold" variant="primary">{plan.user.name}</Text></Text>
                  <Text size="sm" variant="secondary">Plan: <Text weight="bold" variant="primary">{plan.plan.name}</Text></Text>
                  <Text size="sm" variant="secondary">Plan Price: <Text weight="bold" variant="primary">{plan.currency_symbol || '₹'}{plan.final_price?.toFixed(2) ?? plan.plan.price.toFixed(2)}</Text></Text>
                  <Text size="sm" variant="secondary">Status: <Text weight="bold" style={{ color: SalozyColors.status.warning }}>Pending</Text></Text>
                </View>
              </View>
            )}

            {/* Payment Method */}
            <View>
              <Text size="sm" weight="bold" variant="primary" style={tw`mb-2`}>
                Payment Method <Text style={{ color: SalozyColors.status.error }}>*</Text>
              </Text>
              <View style={tw`flex-row flex-wrap gap-2`}>
                {['cash', 'check', 'card', 'bank_transfer', 'upi', 'other'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    style={[
                      tw`px-4 py-2 rounded-xl`,
                      {
                        backgroundColor: paymentMethod === method ? SalozyColors.primary.DEFAULT : colors.secondaryBg,
                        borderWidth: 1,
                        borderColor: paymentMethod === method ? SalozyColors.primary.DEFAULT : colors.border,
                      }
                    ]}
                  >
                    <Text size="xs" weight="semibold" style={{ color: paymentMethod === method ? '#FFFFFF' : colors.textPrimary }}>
                      {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Reference */}
            <View>
              <Text size="sm" weight="bold" variant="primary" style={tw`mb-2`}>
                Payment Reference {paymentMethod === 'check' && <Text style={{ color: SalozyColors.status.error }}>*</Text>}
                <Text size="xs" variant="secondary"> (Check number, Transaction ID, etc.)</Text>
              </Text>
              <Input
                placeholder="Enter payment reference"
                value={paymentReference}
                onChangeText={setPaymentReference}
                containerStyle={tw`mb-0`}
              />
            </View>

            {/* Amount */}
            <View>
              <Text size="sm" weight="bold" variant="primary" style={tw`mb-2`}>
                Amount <Text style={{ color: SalozyColors.status.error }}>*</Text>
              </Text>
              <Input
                placeholder="Enter amount"
                value={amount.toString()}
                onChangeText={(text) => setAmount(parseFloat(text) || 0)}
                keyboardType="numeric"
                containerStyle={tw`mb-0`}
              />
              {plan && (
                <Text size="xs" variant="secondary" style={tw`mt-1`}>
                  Expected: {plan.currency_symbol || '₹'}{plan.final_price?.toFixed(2) ?? plan.plan.price.toFixed(2)}
                </Text>
              )}
            </View>

            {/* Payment Date */}
            <View>
              <Text size="sm" weight="bold" variant="primary" style={tw`mb-2`}>
                Payment Date <Text style={{ color: SalozyColors.status.error }}>*</Text>
              </Text>
              <DatePicker
                value={paymentDate}
                onChange={(date) => setPaymentDate(date)}
                maximumDate={new Date()}
              />
            </View>

            {/* Notes */}
            <View>
              <Text size="sm" weight="bold" variant="primary" style={tw`mb-2`}>Notes</Text>
              <TextInput
                style={[
                  tw`p-3 rounded-xl border min-h-[80px]`,
                  { backgroundColor: colors.secondaryBg, borderColor: colors.border, color: colors.textPrimary }
                ]}
                placeholder="Additional payment notes..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {/* Receipt Upload */}
            <View>
              <Text size="sm" weight="bold" variant="primary" style={tw`mb-2`}>
                Receipt (Optional)
                <Text size="xs" variant="secondary"> (PDF, JPG, PNG - Max 5MB)</Text>
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    Alert.alert(
                      'Select Receipt',
                      'Choose an option',
                      [
                        {
                          text: 'Camera',
                          onPress: async () => {
                            try {
                              const hasPermission = await requestCameraPermissionAsync();
                              if (!hasPermission) {
                                return;
                              }

                              const result = await ImagePicker.launchCameraAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: false,
                                quality: 0.8,
                              });
                              if (!result.canceled && result.assets[0]) {
                                const asset = result.assets[0];
                                setReceipt({
                                  uri: asset.uri,
                                  type: 'image/jpeg',
                                  name: asset.uri.split('/').pop() || 'receipt.jpg',
                                });
                              }
                            } catch (err) {
                              showToast.error('Failed to take photo', 'Error');
                            }
                          },
                        },
                        {
                          text: 'Photo Library',
                          onPress: async () => {
                            try {
                              const hasPermission = await requestMediaLibraryPermission();
                              if (!hasPermission) {
                                return;
                              }

                              const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: false,
                                quality: 0.8,
                              });
                              if (!result.canceled && result.assets[0]) {
                                const asset = result.assets[0];
                                setReceipt({
                                  uri: asset.uri,
                                  type: 'image/jpeg',
                                  name: asset.uri.split('/').pop() || 'receipt.jpg',
                                });
                              }
                            } catch (err) {
                              showToast.error('Failed to pick image', 'Error');
                            }
                          },
                        },
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                      ],
                      { cancelable: true }
                    );
                  } catch (err) {
                    showToast.error('Failed to open image picker', 'Error');
                  }
                }}
                style={[
                  tw`p-3 rounded-xl border items-center`,
                  { backgroundColor: colors.secondaryBg, borderColor: colors.border }
                ]}
              >
                <Text size="sm" variant="secondary">
                  {receipt ? `Selected: ${receipt.name || 'receipt'}` : 'Tap to select receipt (Image)'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={processing}
              style={[
                tw`px-6 py-4 rounded-xl items-center mt-2`,
                {
                  backgroundColor: processing ? colors.secondaryBg : SalozyColors.primary.DEFAULT,
                  opacity: processing ? 0.6 : 1
                }
              ]}
              activeOpacity={0.8}
            >
              {processing ? (
                <View style={tw`flex-row items-center`}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={tw`mr-2`} />
                  <Text size="base" weight="bold" style={{ color: '#FFFFFF' }}>Activating...</Text>
                </View>
              ) : (
                <Text size="base" weight="bold" style={{ color: '#FFFFFF' }}>Activate Plan</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
