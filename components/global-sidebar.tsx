import { apiClient } from '@/lib/api/client';
import { router } from 'expo-router';
import { createContext, ReactNode, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { Sidebar } from './sidebar';

interface SidebarContextType {
  sidebarVisible: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * Global Sidebar Provider
 * Provides sidebar functionality across all pages
 */
export function GlobalSidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Close sidebar immediately
            setSidebarVisible(false);
            
            // Perform logout asynchronously
            (async () => {
              try {
                // Clear token and call logout API
                // The logout method will clear token even if API fails
                await apiClient.logout();
                
                // Wait a bit to ensure AsyncStorage is cleared
                await new Promise(resolve => setTimeout(resolve, 150));
                
                // Navigate directly to login page
                router.replace('/login');
              } catch (error) {
                console.error('Logout error:', error);
                // Even on error, try to navigate
                router.replace('/login');
              }
            })();
          },
        },
      ]
    );
  };

  const value = {
    sidebarVisible,
    openSidebar: () => setSidebarVisible(true),
    closeSidebar: () => setSidebarVisible(false),
    toggleSidebar: () => setSidebarVisible(prev => !prev),
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onLogout={handleLogout}
      />
    </SidebarContext.Provider>
  );
}

/**
 * Hook to control sidebar visibility
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within GlobalSidebarProvider');
  }
  return context;
}
