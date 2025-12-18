import { Text } from '@/components/atoms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

interface SeatOption {
  id: number;
  name: string;
}

interface Appointment {
  id: number;
  ticket_number: string;
  appointment_date: string;
  appointment_time: string;
  user?: {
    name: string;
  };
}

interface ApproveAppointmentModalProps {
  visible: boolean;
  appointment: Appointment | null;
  seatOptions: SeatOption[];
  selectedSeatId: number | null;
  loading: boolean;
  approving: boolean;
  onSelectSeat: (seatId: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
}

export const ApproveAppointmentModal: React.FC<ApproveAppointmentModalProps> = ({
  visible,
  appointment,
  seatOptions,
  selectedSeatId,
  loading,
  approving,
  onSelectSeat,
  onConfirm,
  onCancel,
  formatDate,
  formatTime,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable
        style={tw`flex-1 justify-end bg-black/40`}
        onPress={onCancel}
      >
        <SafeAreaView style={tw`flex-1 justify-end`} edges={['bottom']}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              tw`rounded-t-3xl px-5 pt-4 pb-6`,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={tw`items-center mb-3`}>
              <View
                style={tw`w-10 h-1.5 rounded-full bg-gray-300 mb-3`}
              />
              <Text size="lg" weight="bold" variant="primary">
                Approve Appointment
              </Text>
              {appointment && (
                <Text size="sm" variant="secondary" style={tw`mt-1`}>
                  {appointment.user?.name} • #{appointment.ticket_number}
                </Text>
              )}
            </View>

            {appointment && (
              <View
                style={[
                  tw`flex-row items-center mb-4 p-3 rounded-2xl`,
                  { backgroundColor: colors.secondaryBg },
                ]}
              >
                <View style={tw`flex-1`}>
                  <Text size="xs" variant="secondary">
                    Date
                  </Text>
                  <Text size="sm" weight="semibold" variant="primary">
                    {formatDate(appointment.appointment_date)}
                  </Text>
                </View>
                <View
                  style={[
                    tw`w-px h-8 mx-3`,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View style={tw`flex-1`}>
                  <Text size="xs" variant="secondary">
                    Time
                  </Text>
                  <Text size="sm" weight="semibold" variant="primary">
                    {formatTime(appointment.appointment_time)}
                  </Text>
                </View>
              </View>
            )}

            <Text
              size="sm"
              weight="semibold"
              variant="secondary"
              style={tw`mb-2`}
            >
              Select Seat
            </Text>

            {loading ? (
              <View style={tw`py-4 items-center`}>
                <ActivityIndicator
                  size="small"
                  color={SalozyColors.primary.DEFAULT}
                />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`flex-row gap-2 mb-4`}
              >
                {seatOptions.map((seat) => (
                  <TouchableOpacity
                    key={seat.id}
                    onPress={() => onSelectSeat(seat.id)}
                    style={[
                      tw`px-4 py-2 rounded-full border`,
                      {
                        borderColor:
                          selectedSeatId === seat.id
                            ? SalozyColors.primary.DEFAULT
                            : colors.border,
                        backgroundColor:
                          selectedSeatId === seat.id
                            ? SalozyColors.primary.DEFAULT
                            : colors.secondaryBg,
                      },
                    ]}
                  >
                    <Text
                      size="sm"
                      weight="semibold"
                      style={{
                        color:
                          selectedSeatId === seat.id
                            ? '#FFFFFF'
                            : colors.textPrimary,
                      }}
                    >
                      {seat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {seatOptions.length === 0 && !loading && (
                  <View style={tw`py-2`}>
                    <Text size="sm" variant="secondary">
                      No available seats found.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={tw`flex-row gap-3 mt-2`}>
              <TouchableOpacity
                onPress={onCancel}
                style={[
                  tw`flex-1 px-4 py-3 rounded-xl border`,
                  { 
                    borderColor: colors.border,
                    opacity: approving ? 0.5 : 1,
                  },
                ]}
                disabled={approving}
                activeOpacity={0.8}
              >
                <Text
                  size="sm"
                  weight="semibold"
                  variant="secondary"
                  style={{ textAlign: 'center' }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirm}
                disabled={approving || !selectedSeatId}
                style={[
                  tw`flex-1 px-4 py-3 rounded-xl items-center justify-center`,
                  {
                    backgroundColor:
                      approving
                        ? SalozyColors.primary.DEFAULT
                        : !selectedSeatId
                        ? colors.secondaryBg
                        : SalozyColors.primary.DEFAULT,
                    opacity: !selectedSeatId ? 0.6 : 1,
                  },
                ]}
                activeOpacity={approving || !selectedSeatId ? 1 : 0.8}
              >
                {approving ? (
                  <View style={tw`flex-row items-center gap-2`}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text
                      size="sm"
                      weight="bold"
                      style={{ 
                        color: '#FFFFFF', 
                        textAlign: 'center' 
                      }}
                    >
                      Processing...
                    </Text>
                  </View>
                ) : (
                  <Text
                    size="sm"
                    weight="bold"
                    style={{ 
                      color: selectedSeatId ? '#FFFFFF' : colors.textSecondary, 
                      textAlign: 'center' 
                    }}
                  >
                    Approve & Notify
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
};
