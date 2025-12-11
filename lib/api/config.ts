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
  REGISTER_VENDOR: '/register-vendor',
  VERIFY_EMAIL: '/verify-email',
  RESEND_VERIFICATION_EMAIL: '/verify-email/resend',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENT_BY_ID: (id: string | number) => `/appointments/${id}`,
  APPOINTMENT_CREATE: '/appointments',
  APPOINTMENT_UPDATE: (id: string | number) => `/appointments/${id}`,
  APPOINTMENT_DELETE: (id: string | number) => `/appointments/${id}`,
  APPOINTMENT_FORM_DATA: '/appointments/form-data',
  
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

