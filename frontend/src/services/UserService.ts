import apiClient from './api-client';
import type { LoginCredentials, RegisterData, User, AuthResponse } from '../types/auth';
import type { 
  ExtendedUser, 
  UserStats, 
  CreateUserData, 
  UpdateUserData, 
  UpdateProfileData, 
  ChangePasswordData 
} from '../types/userManagement';
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

  // User Management Methods

  /**
   * Get all users with pagination and filtering
   */
  async getUsers(params?: {
    page?: number;
    per_page?: number;
    role?: string;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{ success: boolean; data: { data: ExtendedUser[]; total: number; per_page: number; current_page: number; last_page: number } }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.role) queryParams.append('role', params.role);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

      const response = await apiClient.get(`/users?${queryParams.toString()}`) as any;
      return response;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(id: number): Promise<{ success: boolean; data: ExtendedUser }> {
    try {
      const response = await apiClient.get(`/users/${id}`) as any;
      return response;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserData): Promise<{ success: boolean; data: ExtendedUser }> {
    try {
      const response = await apiClient.post('/users', userData) as any;
      return response;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: number, userData: UpdateUserData): Promise<{ success: boolean; data: ExtendedUser }> {
    try {
      const response = await apiClient.put(`/users/${id}`, userData) as any;
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/users/${id}`) as any;
      return response;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(profileData: UpdateProfileData): Promise<{ success: boolean; data: ExtendedUser }> {
    try {
      const response = await apiClient.put('/users/profile', profileData) as any;
      
      // Update stored user data if successful
      if (response.success && response.data) {
        setUserData(response.data);
      }
      
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.put('/users/password', passwordData) as any;
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{ success: boolean; data: UserStats }> {
    try {
      const response = await apiClient.get('/users/stats') as any;
      return response;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Export users to CSV
   */
  async exportUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.role) queryParams.append('role', params.role);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const response = await fetch(`/api/proxy/users/export?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      return await response.blob();
    } catch (error) {
      console.error('Export users error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const userService = new UserService();
export default userService;