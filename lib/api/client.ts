/**
 * API Client
 * Handles all API requests with authentication and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getApiUrl } from './config';

const TOKEN_KEY = '@salozy:access_token';

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  user?: T;
  access_token?: string;
  token_type?: string;
  currency_symbol?: string;
  currency_text?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

class ApiClient {
  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  private async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  private async getHeaders(includeAuth = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth = true
  ): Promise<ApiResponse<T>> {
    const url = getApiUrl(endpoint);
    const headers = await this.getHeaders(includeAuth);

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          message: data.message || 'An error occurred',
          errors: data.errors,
          status: response.status,
        };
        
        // Add additional error data for email verification
        if (data.email_verification_required) {
          (error as any).email_verification_required = data.email_verification_required;
          (error as any).email = data.email;
        }
        
        throw error;
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout. Please check your connection.',
          status: 408,
        } as ApiError;
      }

      if (error.status) {
        throw error;
      }

      throw {
        message: error.message || 'Network error. Please check your connection.',
        status: 0,
      } as ApiError;
    }
  }

  async get<T = any>(endpoint: string, includeAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    includeAuth = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      includeAuth
    );
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    includeAuth = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      includeAuth
    );
  }

  async putFormData<T = any>(
    endpoint: string,
    formData: FormData,
    includeAuth = true
  ): Promise<ApiResponse<T>> {
    const url = getApiUrl(endpoint);
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          message: data.message || 'An error occurred',
          errors: data.errors,
          status: response.status,
        };
        throw error;
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout. Please check your connection.',
          status: 408,
        } as ApiError;
      }

      if (error.status) {
        throw error;
      }

      throw {
        message: error.message || 'Network error. Please check your connection.',
        status: 0,
      } as ApiError;
    }
  }

  async delete<T = any>(endpoint: string, body?: any, includeAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'DELETE',
        body: body ? JSON.stringify(body) : undefined,
      },
      includeAuth
    );
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.post('/login', { email, password }, false);
    
    if (response.access_token) {
      await this.setToken(response.access_token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      // Try to call logout API - if it fails (e.g., token already invalid), that's okay
      await this.post('/logout');
    } catch (error) {
      // Silently ignore logout API errors - token might already be invalid
      // The important part is clearing the local token
    } finally {
      // Always clear the local token, even if API call fails
      await this.removeToken();
    }
  }

  async getProfile(): Promise<ApiResponse> {
    return this.get('/profile');
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // Get stored token
  async getStoredToken(): Promise<string | null> {
    return this.getToken();
  }

  // Vendor registration
  async registerVendor(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    company_name: string;
    company_domain: string;
  }): Promise<ApiResponse> {
    return this.post('/register-vendor', data, false);
  }

  // Email verification
  async verifyEmail(token: string, email: string): Promise<ApiResponse> {
    return this.post('/verify-email', { token, email }, false);
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<ApiResponse> {
    return this.post('/verify-email/resend', { email }, false);
  }

  // Forgot password
  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.post('/forgot-password', { email }, false);
  }

  // Reset password
  async resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<ApiResponse> {
    return this.post('/reset-password', data, false);
  }
}

export const apiClient = new ApiClient();

