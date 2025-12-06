/**
 * API Configuration
 * Base URL and API endpoints for Salozy CRM
 */

export const API_CONFIG = {
  BASE_URL: 'https://salozy.com',
  API_PREFIX: '/api',
  TIMEOUT: 30000, // 30 seconds
};

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/login',
  LOGOUT: '/logout',
  PROFILE: '/profile',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENT_BY_ID: (id: string | number) => `/appointments/${id}`,
  
  // Services
  SERVICES: '/services',
  SERVICE_BY_ID: (id: string | number) => `/services/${id}`,
  
  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_BY_ID: (id: string | number) => `/customers/${id}`,
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpoint}`;
};

