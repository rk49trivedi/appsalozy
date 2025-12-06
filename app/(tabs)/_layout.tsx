import { Tabs } from 'expo-router';
import React from 'react';

import { AuthGuard } from '@/components/auth-guard';
import { HapticTab } from '@/components/haptic-tab';
import { DashboardIcon } from '@/components/sidebar-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
          tabBarInactiveTintColor: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <DashboardIcon size={24} color={focused ? SalozyColors.primary.DEFAULT : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
