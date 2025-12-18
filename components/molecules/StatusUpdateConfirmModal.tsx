import { Text } from '@/components/atoms';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Modal, Pressable, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

interface StatusUpdateConfirmModalProps {
  visible: boolean;
  status: 'completed' | 'cancelled';
  onConfirm: () => void;
  onCancel: () => void;
}

export const StatusUpdateConfirmModal: React.FC<StatusUpdateConfirmModalProps> = ({
  visible,
  status,
  onConfirm,
  onCancel,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        style={tw`flex-1 justify-center items-center bg-black/50`}
        onPress={onCancel}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            tw`mx-4 rounded-3xl px-6 pt-6 pb-5`,
            { backgroundColor: cardBg, minWidth: 300, maxWidth: 400 },
          ]}
        >
          <View style={tw`items-center mb-4`}>
            <View
              style={[
                tw`w-16 h-16 rounded-full items-center justify-center mb-3`,
                {
                  backgroundColor:
                    status === 'completed'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                },
              ]}
            >
              <Text
                size="2xl"
                weight="bold"
                style={{
                  color:
                    status === 'completed'
                      ? SalozyColors.status.success
                      : SalozyColors.status.error,
                }}
              >
                {status === 'completed' ? '✓' : '⚠'}
              </Text>
            </View>
            <Text size="xl" weight="bold" variant="primary" style={tw`mb-2 text-center`}>
              Mark Appointment as {status === 'completed' ? 'Completed' : 'Cancelled'}
            </Text>
            <Text
              size="base"
              variant="secondary"
              style={[tw`text-center`, { color: textSecondary }]}
            >
              Are you sure you want to mark this appointment as {status}?
            </Text>
          </View>

          <View style={tw`flex-row gap-3 mt-2`}>
            <TouchableOpacity
              onPress={onCancel}
              style={[
                tw`flex-1 px-5 py-3 rounded-xl border`,
                { borderColor: borderColor },
              ]}
              activeOpacity={0.8}
            >
              <Text
                size="base"
                weight="semibold"
                variant="secondary"
                style={{ textAlign: 'center' }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={[
                tw`flex-1 px-5 py-3 rounded-xl`,
                {
                  backgroundColor:
                    status === 'completed'
                      ? SalozyColors.status.success
                      : SalozyColors.status.error,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                size="base"
                weight="bold"
                style={{ color: '#FFFFFF', textAlign: 'center' }}
              >
                Yes
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
