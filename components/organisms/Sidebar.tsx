import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { Logo } from '../atoms/Logo';
import {
    AppointmentsIcon,
    BranchIcon,
    CouponIcon,
    CustomersIcon,
    DashboardIcon,
    GalleryIcon,
    LogoutIcon,
    PlanIcon,
    PurchasedPlansIcon,
    SeatsIcon,
    ServicesIcon,
    SliderIcon,
    StaffIcon,
    SubscriptionsIcon,
} from '../atoms/icons/sidebar-icons';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ visible, onClose, onLogout }: SidebarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const slideAnim = useRef(new Animated.Value(-280)).current; // Start off-screen to the left

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -280,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const bgColor = isDark ? '#1F2937' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const iconColor = isDark ? '#9CA3AF' : '#4B5563';
  const activeIconColor = '#9A3412';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: DashboardIcon, route: '/(tabs)' },
    { id: 'appointments', label: 'All Appointments', Icon: AppointmentsIcon, route: '/appointments' },
    { id: 'my-appointments', label: 'My Appointments', Icon: AppointmentsIcon, route: null },
    { id: 'seats', label: 'Seats', Icon: SeatsIcon, route: null },
    { id: 'services', label: 'Services', Icon: ServicesIcon, route: null },
    { id: 'staff', label: 'Staff', Icon: StaffIcon, route: null },
    { id: 'customers', label: 'Customers', Icon: CustomersIcon, route: null },
    { id: 'plans', label: 'Plan', Icon: PlanIcon, route: null },
    { id: 'purchased-plans', label: 'Purchased Plans', Icon: PurchasedPlansIcon, route: null },
    { id: 'subscriptions', label: 'My Subscriptions', Icon: SubscriptionsIcon, route: null },
  ];

  const settingsItems = [
    { id: 'branch', label: 'Manage Branch', Icon: BranchIcon, route: null },
    { id: 'coupon', label: 'Manage Coupon', Icon: CouponIcon, route: null },
    { id: 'gallery', label: 'Gallery', Icon: GalleryIcon, route: null },
    { id: 'slider', label: 'Slider', Icon: SliderIcon, route: null },
  ];

  const handleMenuItemPress = (item: { route: string | null }) => {
    if (item.route) {
      router.push(item.route as any);
      onClose();
    } else {
      // TODO: Navigate to these routes when pages are created
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={tw`flex-1`}>
        {/* Sidebar - Slides from left to right */}
        <Animated.View
          style={[
            tw`absolute left-0 top-0 bottom-0 w-[280px] z-50`,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView
            style={[
              tw`flex-1`,
              { backgroundColor: bgColor }
            ]}
            edges={['top', 'bottom', 'left']}
          >
            {/* Header */}
            <View style={[
              tw`px-4  border-b flex-row items-center justify-between`,
              { borderColor }
            ]}>
              <Logo size={100} />
              <TouchableOpacity
                onPress={onClose}
                style={tw`p-2`}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[tw`text-2xl`, { color: textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
              <View style={tw`py-2`}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleMenuItemPress(item)}
                    style={[
                      tw`flex-row items-center px-4 py-4 mx-2 rounded-xl mb-1`,
                      { backgroundColor: 'transparent' }
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={tw`w-6 h-6 items-center justify-center mr-3`}>
                      <item.Icon size={24} color={iconColor} />
                    </View>
                    <Text style={[tw`text-base font-medium flex-1`, { color: textPrimary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Settings Section */}
                <View style={[tw`mt-4 pt-4 border-t mx-4`, { borderColor }]}>
                  <Text style={[tw`text-xs font-bold uppercase mb-2 px-4`, { color: textSecondary }]}>
                    Settings
                  </Text>
                  {settingsItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleMenuItemPress(item)}
                      style={tw`flex-row items-center px-4 py-4 mx-2 rounded-xl mb-1`}
                      activeOpacity={0.7}
                    >
                      <View style={tw`w-6 h-6 items-center justify-center mr-3`}>
                        <item.Icon size={20} color={iconColor} />
                      </View>
                      <Text style={[tw`text-base font-medium flex-1`, { color: textPrimary }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Logout Button */}
                <View style={[tw`mt-4 pt-4 border-t mx-4`, { borderColor }]}>
                  <TouchableOpacity
                    onPress={onLogout}
                    style={[
                      tw`flex-row items-center px-4 py-4 mx-2 rounded-xl`,
                      { backgroundColor: '#EF4444' + '20' }
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={tw`w-6 h-6 items-center justify-center mr-3`}>
                      <LogoutIcon size={20} color="#EF4444" />
                    </View>
                    <Text style={[tw`text-base font-semibold flex-1`, { color: '#EF4444' }]}>
                      Logout
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
