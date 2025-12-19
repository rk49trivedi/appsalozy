import { apiClient } from '@/lib/api/client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { Logo } from '../atoms/Logo';
import { CustomersIcon } from '../atoms/icons/dashboard-icons';
import {
  AppointmentsIcon,
  BranchIcon,
  DashboardIcon,
  LogoutIcon,
  PurchasedPlansIcon,
  ServicesIcon,
  StaffIcon
} from '../atoms/icons/sidebar-icons';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ visible, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const slideAnim = useRef(new Animated.Value(-300)).current; // Start off-screen to the left
  const [userName, setUserName] = useState<string>('Guest');
  const [branchName, setBranchName] = useState<string>('Salozy');
  const [userImage, setUserImage] = useState<string>('');

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
        toValue: -300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // Fetch user profile when sidebar opens
  useEffect(() => {
    if (visible) {
      const fetchUserProfile = async () => {
        try {
          const response = await apiClient.getProfile();
          // Profile response can have data.user or user or data with name
          const user = response.data?.user || response.data || response.user;
          if (user?.name) {
            setUserName(user.name);
          }

          if(user?.branch?.name) {
            setBranchName(user.branch.name);
          }

          // Check multiple possible field names for profile image
          const profileImage = user?.profile || user?.logo || '';
          if (profileImage && profileImage.trim() !== '') {
            setUserImage(profileImage);
          } else {
            setUserImage(''); // Ensure it's empty if no image
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Keep default name on error
          setUserImage(''); // Reset image on error
        }
      };
      fetchUserProfile();
    }
  }, [visible]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: DashboardIcon, iconName: 'dashboard', route: '/(tabs)', active: pathname === '/(tabs)' || pathname === '/' },
    { id: 'appointments', label: 'Appointments', Icon: AppointmentsIcon, iconName: 'event', route: '/(tabs)/appointments', active: pathname?.startsWith('/(tabs)/appointments') || pathname?.startsWith('/appointments') },
    { id: 'customers', label: 'Customers', Icon: CustomersIcon, iconName: 'people', route: '/(tabs)/customers', active: pathname?.startsWith('/(tabs)/customers') || pathname?.startsWith('/customers') },
    { id: 'services', label: 'Services', Icon: ServicesIcon, iconName: 'content-cut', route: '/(tabs)/services', active: pathname?.startsWith('/(tabs)/services') || pathname?.startsWith('/services') },
    { id: 'staff', label: 'Staff', Icon: StaffIcon, iconName: 'work', route: '/(tabs)/staff', active: pathname?.startsWith('/(tabs)/staff') || pathname?.startsWith('/staff') },
    { id: 'purchased-plans', label: 'Purchased Plans', Icon: PurchasedPlansIcon, iconName: 'card-membership', route: '/(tabs)/purchased-plans', active: pathname?.startsWith('/(tabs)/purchased-plans') || pathname?.startsWith('/purchased-plans') },
    { id: 'branches', label: 'Branches', Icon: BranchIcon, iconName: 'business', route: '/(tabs)/branches', active: pathname?.startsWith('/(tabs)/branches') || pathname?.startsWith('/branches') },
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

  // Generate consistent background color from userName
  const getAvatarColor = (name: string): string => {
    const colors = [
      '#9a3412', '#d5821d', '#dc2626', '#ea580c', '#f97316',
      '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
      '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
      '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return 'G';
    return name.trim().charAt(0).toUpperCase();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill}>
        <BlurView
          intensity={100}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]} />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        
        {/* Sidebar - Slides from left to right */}
        <Animated.View
          style={[
            tw`absolute left-0 top-0 bottom-0 w-[80%] max-w-[300px] z-50`,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={tw`flex-1 bg-white shadow-2xl`}>
            {/* Header with Dark Gradient */}
            <LinearGradient
              colors={['#1a1a1a', '#2d2d2d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tw`p-6 relative overflow-hidden pt-10`}
            >
              {/* Logo in background with opacity */}
              <View style={[tw`absolute top-5 right-0 p-4`, { opacity: 0.1 }]}>
                <Logo size={100} />
              </View>
              
              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                style={tw`absolute top-10 right-4 p-1.5 bg-[#1a1a1a] rounded-full`}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={20} color="white" />
              </TouchableOpacity>

              {/* Profile Section */}
              <View style={tw`relative z-10 flex-row items-center mt-4`}>
                <View style={tw`w-14 h-14 rounded-full border-2 border-[#d5821d] mr-4 overflow-hidden`}>
                  {userImage && userImage.trim() !== '' ? (
                    <Image
                      source={{ uri: userImage }}
                      style={tw`w-full h-full`}
                      contentFit="cover"
                      onError={() => {
                        // If image fails to load, clear it to show fallback
                        setUserImage('');
                      }}
                    />
                  ) : (
                    <View 
                      style={[
                        tw`w-full h-full items-center justify-center`,
                        { backgroundColor: getAvatarColor(userName), minHeight: 56, minWidth: 56 }
                      ]}
                    >
                      <Text style={tw`text-white text-xl font-bold`}>
                        {getInitials(userName)}
                      </Text>
                    </View>
                  )}
                </View>
                <View>
                  <Text style={tw`text-lg font-bold text-white leading-tight max-w-[150px]`} numberOfLines={1}>
                    {userName}
                  </Text>
                  <Text style={tw`text-xs text-[#d5821d] font-medium`}>
                    {branchName}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Menu Items */}
            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
              <View style={tw`py-4 px-3`}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleMenuItemPress(item)}
                    style={[
                      tw`flex-row items-center px-4 py-3 rounded-xl mb-1`,
                      item.active
                        ? { backgroundColor: '#FFF7ED' }
                        : {}
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={tw`w-5 h-5 items-center justify-center mr-4`}>
                      {item.Icon ? (
                        <item.Icon 
                          size={20} 
                          color={item.active ? '#9a3412' : '#78716c'} 
                        />
                      ) : (
                        <MaterialIcons 
                          name={item.iconName as any} 
                          size={20} 
                          color={item.active ? '#9a3412' : '#78716c'} 
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        tw`text-sm font-medium flex-1`,
                        item.active
                          ? { color: '#9a3412', fontWeight: 'bold' }
                          : { color: '#78716c' }
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.active && (
                      <View style={tw`w-1.5 h-1.5 rounded-full bg-[#9a3412]`} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={tw`p-4 border-t border-stone-100`}>
              <TouchableOpacity
                onPress={onLogout}
                style={tw`flex-row items-center px-4 py-3 rounded-xl`}
                activeOpacity={0.7}
              >
                <View style={tw`mr-3`}>
                  <LogoutIcon size={20} color="#EF4444" />
                </View>
                <Text style={tw`text-sm font-medium text-red-500 flex-1`}>
                  Log Out
                </Text>
              </TouchableOpacity>
              <Text style={tw`text-center text-[10px] text-stone-300 mt-4`}>
                Salozy App v1.2.0
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
