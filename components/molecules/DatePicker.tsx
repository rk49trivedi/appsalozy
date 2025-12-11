import { useState } from 'react';
import { View, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import tw from 'twrnc';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getThemeColors, SalozyColors } from '@/constants/colors';
import { Text, Button } from '../atoms';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  onClear?: () => void;
}

export function DatePicker({ value, onChange, placeholder = 'Select date', label, onClear }: DatePickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ? new Date(value) : new Date());

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        const formattedDate = formatDate(selectedDate);
        onChange(formattedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    const formattedDate = formatDate(tempDate);
    onChange(formattedDate);
    setShowPicker(false);
  };

  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View>
      {label && (
        <Text size="sm" weight="semibold" variant="secondary" style={tw`mb-2`}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={[
          tw`w-full px-4 py-3 rounded-xl border flex-row items-center justify-between`,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          }
        ]}
        activeOpacity={0.7}
      >
        <Text 
          size="base" 
          variant={value ? 'primary' : 'secondary'}
          style={!value ? { color: colors.placeholder } : {}}
        >
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <View style={tw`flex-row items-center gap-2`}>
          {value && onClear && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              style={tw`p-1`}
            >
              <Text size="sm" variant="error" weight="bold">✕</Text>
            </TouchableOpacity>
          )}
          <Text size="base" variant="secondary">📅</Text>
        </View>
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={[tw`flex-1 justify-end`, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
            <View style={[
              tw`bg-white rounded-t-3xl p-6`,
              { backgroundColor: colors.background }
            ]}>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text size="lg" weight="bold" variant="primary">Select Date</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text size="lg" variant="primary" weight="bold">✕</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                themeVariant={isDark ? 'dark' : 'light'}
                style={tw`w-full`}
              />
              <View style={tw`flex-row gap-3 mt-4`}>
                <Button
                  variant="outline"
                  onPress={() => setShowPicker(false)}
                  style={tw`flex-1`}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleConfirm}
                  style={tw`flex-1`}
                >
                  Confirm
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )
      )}
    </View>
  );
}

