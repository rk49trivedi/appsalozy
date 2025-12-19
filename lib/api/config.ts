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
  PROFILE_UPDATE: '/profile',
  PROFILE_PASSWORD: '/profile/password',
  PROFILE_DELETE_IMAGE: '/profile/image',
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
  APPOINTMENT_UPDATE_STATUS: (id: string | number) => `/appointments/${id}/update-status`,
  APPOINTMENT_UPDATE_SEAT_STATUS: (id: string | number) => `/appointments/${id}/update-seat-status`,
  APPOINTMENT_FORM_DATA: '/appointments/form-data',
  APPOINTMENT_SEAT_MAP: '/appointments/seat-map',
  APPOINTMENT_SEAT_CHECK_AVAILABILITY: (seatId: string | number) => `/appointments/seats/${seatId}/check-availability`,
  
  // Services
  SERVICES: '/services',
  SERVICE_BY_ID: (id: string | number) => `/services/${id}`,
  SERVICE_CREATE: '/services',
  SERVICE_UPDATE: (id: string | number) => `/services/${id}`,
  SERVICE_DELETE: (id: string | number) => `/services/${id}`,
  
  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_BY_ID: (id: string | number) => `/customers/${id}`,
  CUSTOMER_CREATE: '/customers',
  CUSTOMER_BOOKING_HISTORY: (id: string | number) => `/customers/${id}/booking-history`,
  
  // Staff
  STAFF: '/staff',
  STAFF_BY_ID: (id: string | number) => `/staff/${id}`,
  STAFF_CREATE: '/staff',
  STAFF_UPDATE: (id: string | number) => `/staff/${id}`,
  STAFF_DELETE: (id: string | number) => `/staff/${id}`,
  
  // Purchased Plans
  PURCHASED_PLANS: '/purchased-plans',
  PURCHASED_PLAN_UPDATE_STATUS: (id: string | number) => `/purchased-plans/${id}/update-status`,
  PURCHASED_PLAN_REFUND: (id: string | number) => `/purchased-plans/${id}/refund`,
  
  // Branches
  BRANCHES: '/branches',
  BRANCH_BY_ID: (id: string | number) => `/branches/${id}`,
  BRANCH_CREATE: '/branches',
  BRANCH_UPDATE: (id: string | number) => `/branches/${id}`,
  BRANCH_DELETE: (id: string | number) => `/branches/${id}`,
  BRANCH_WORKING_HOURS: (id: string | number) => `/branches/${id}/working-hours`,
  BRANCH_SAVE_WORKING_HOURS: (id: string | number) => `/branches/${id}/working-hours`,
  
  // Working Hours
  WORKING_HOURS: '/working-hours',
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpoint}`;
};

