import { useEffect, useState, useRef } from 'react';
import { router } from 'expo-router';
import { apiClient } from '@/lib/api/client';

/**
 * Authentication hook
 * Checks if user is authenticated and redirects if not
 */
export function useAuth(redirectToLogin = true) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const redirectToLoginRef = useRef(redirectToLogin);

  useEffect(() => {
    redirectToLoginRef.current = redirectToLogin;
  }, [redirectToLogin]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await apiClient.getStoredToken();
        if (token) {
          // Verify token is valid by checking profile
          try {
            await apiClient.getProfile();
            setIsAuthenticated(true);
          } catch {
            // Token invalid, clear it
            await apiClient.logout();
            setIsAuthenticated(false);
            if (redirectToLoginRef.current) {
              router.replace('/login');
            }
          }
        } else {
          setIsAuthenticated(false);
          if (redirectToLoginRef.current) {
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        if (redirectToLoginRef.current) {
          router.replace('/login');
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []); // Empty dependency array - only run once on mount

  return { isAuthenticated, isChecking };
}

