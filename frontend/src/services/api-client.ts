import axios from 'axios';
import { getAuthToken, clearAuthCookies } from '../utils/cookieUtils';

// API Base URL - adjust this to match your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://goalhub.site/api';



class ApiClient {
  private axiosInstance: ReturnType<typeof axios.create>;
  private token: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
      withCredentials: true, // ✅ ADD THIS - Important for Laravel Sanctum/cookies

    });

    this.setupInterceptors();
    this.loadTokenFromStorage();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => { // ✅ Remove 'any' type
        this.refreshTokenFromStorage();
        
        if (this.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => { // ✅ Remove 'any' type
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response, // ✅ Remove 'any' type
      async (error) => { // ✅ Remove 'any' type
        if (error.response?.status === 401) {
          console.log('401 Unauthorized - token may be expired');
          this.clearToken();
          clearAuthCookies();
          this.redirectToLogin();
        }
        return Promise.reject(error);
      }
    );
  }

  private loadTokenFromStorage(): void {
    const storedToken = getAuthToken();
    this.token = storedToken || null;
    console.log('Loaded token from storage:', !!this.token);
  }

  // Refresh token from storage (useful when token is updated elsewhere)
  refreshTokenFromStorage(): void {
    this.loadTokenFromStorage();
  }

  private redirectToLogin(): void {
    // Clear any stored data
    clearAuthCookies();
    
    // Redirect to login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Set authentication token
  setToken(token: string): void {
    this.token = token;
    console.log('Token set in API client:', !!token);
    // Token is already set in cookies by UserService
  }

  // Clear authentication token
  clearToken(): void {
    this.token = null;
    console.log('Token cleared from API client');
    // Cookies are cleared by UserService
  }

  // Logout and destroy session
  async logout(): Promise<void> {
    try {
      console.log('API Client: Calling logout endpoint...');
      // Call logout endpoint to destroy session on server
      await this.post('/auth/logout');
      console.log('API Client: Logout endpoint called successfully');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      console.log('API Client: Clearing local data...');
      // Always clear local data
      this.clearToken();
      clearAuthCookies();
      console.log('API Client: Local data cleared');
    }
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    // Refresh token from storage to ensure we have the latest
    this.refreshTokenFromStorage();
    return !!this.token;
  }

  // Check if token exists and is not expired (basic check)
  hasValidToken(): boolean {
    this.refreshTokenFromStorage();
    return !!this.token && this.token.length > 0;
  }

  // Generic GET request
  async get<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Generic POST request
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Generic PUT request
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Generic PATCH request
  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Generic DELETE request
  async delete<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Upload file with progress
  async uploadFile<T>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.axiosInstance.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // @ts-ignore - onUploadProgress is a valid axios option
        onUploadProgress: (progressEvent: any) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Handle API errors
  private handleError(error: any): never {
    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data as any;
      let message = 'An error occurred';
      
      if (responseData?.message) {
        message = responseData.message;
      } else if (responseData?.errors) {
        // Handle validation errors
        const errorMessages = Object.values(responseData.errors).flat();
        message = errorMessages.join(', ');
      } else if (error.response.status === 401) {
        message = 'Authentication required. Please log in again.';
      } else if (error.response.status === 403) {
        message = 'Access denied. You do not have permission to perform this action.';
      } else if (error.response.status === 404) {
        message = 'The requested resource was not found.';
      } else if (error.response.status >= 500) {
        message = 'Server error. Please try again later.';
      }
      
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Get the underlying axios instance for advanced usage
  getAxiosInstance() {
    return this.axiosInstance;
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;
