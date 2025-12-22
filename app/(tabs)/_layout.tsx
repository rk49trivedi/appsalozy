import { Tabs } from 'expo-router';
import React from 'react';

import { AppointmentsIcon, CustomersIcon, DashboardIcon } from '@/components/atoms';
import { AuthGuard } from '@/components/organisms';
import { HapticTab } from '@/components/utils';
import { SalozyColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Tab Layout - Main navigation after login
 * 
 * Pages in this folder:
 * - index.tsx: Home tab
 * - explore.tsx: Explore tab
 * 
 * To add new tabs:
 * 1. Create a new file in app/(tabs)/ folder (e.g., profile.tsx)
 * 2. Add a Tabs.Screen entry below with name matching the file
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthGuard>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: SalozyColors.primary.DEFAULT,
        tabBarInactiveTintColor:
          colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
        },
      }}
    >
      {/* Left tab: Appointments */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, focused }) => (
            <AppointmentsIcon
              size={24}
              color={focused ? SalozyColors.primary.DEFAULT : color}
            />
          ),
        }}
      />

      {/* Center tab: Dashboard (home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <DashboardIcon
              size={26}
              color={focused ? SalozyColors.primary.DEFAULT : color}
            />
          ),
        }}
      />

      {/* Right tab: Profile / account */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <CustomersIcon
              size={24}
              color={focused ? SalozyColors.primary.DEFAULT : color}
            />
          ),
        }}
      />

      {/* Hidden routes - accessible via sidebar but not shown in tab bar */}
      <Tabs.Screen
        name="customers"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="purchased-plans"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="branches"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </AuthGuard>
  );
}
