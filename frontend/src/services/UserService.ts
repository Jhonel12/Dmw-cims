import apiClient from './api-client';
import type { LoginCredentials, RegisterData, User, AuthResponse } from '../types/auth';
import { setAuthToken, setUserData, clearAuthCookies, isAuthenticated, getUserData } from '../utils/cookieUtils';

class UserService {
  constructor() {
    // No need for constructor setup - apiClient handles everything
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const data = await apiClient.post<AuthResponse>('/auth/login', credentials);

      if (data.success && data.data) {
        // Store token and user data in cookies
        setAuthToken(data.data.token);
        setUserData(data.data.user);
        apiClient.setToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register user
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const data = await apiClient.post<AuthResponse>('/auth/register', userData);

      if (data.success && data.data) {
        // Store token and user data in cookies
        setAuthToken(data.data.token);
        setUserData(data.data.user);
        apiClient.setToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('UserService: Starting logout...');
      // Use the new logout method from api-client
      await apiClient.logout();
      console.log('UserService: API client logout completed');

      // Clear stored data (already done by api-client.logout, but keeping for safety)
      this.clearStoredData();
      console.log('UserService: Stored data cleared');

      return { success: true, message: 'Logout successful' };
    } catch (error) {
      console.error('Logout error:', error);
      // Clear stored data even if API call fails
      this.clearStoredData();
      console.log('UserService: Stored data cleared after error');
      
      return { success: false, message: 'Logout failed' };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<{ success: boolean; data: { user: User; token?: string; token_type?: string } }> {
    try {
      const data = await apiClient.get<{ success: boolean; data: { user: User; token?: string; token_type?: string } }>('/auth/me');
      
      // If token is returned, update stored token and API client
      if (data.success && data.data && data.data.token) {
        setAuthToken(data.data.token);
        apiClient.setToken(data.data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(): Promise<{ success: boolean; data: { token: string; token_type: string } }> {
    try {
      const data = await apiClient.post<{ success: boolean; data: { token: string; token_type: string } }>('/auth/refresh');

      if (data.success && data.data) {
        // Update token
        apiClient.setToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return isAuthenticated() && !!getUserData();
  }

  // Get stored user data
  getStoredUser(): User | null {
    return getUserData();
  }

  // Clear all stored data
  clearStoredData(): void {
    clearAuthCookies();
    apiClient.clearToken();
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    return { isValid: true };
  }
}

// Create and export a singleton instance
const userService = new UserService();
export default userService;