import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, type ReactNode } from 'react';
import userService from '../services/UserService';
import apiClient from '../services/api-client';
import { isAuthenticated, getUserData, getAuthToken } from '../utils/cookieUtils';
import type { User, LoginCredentials, RegisterData } from '../types/auth';

// Types
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'INITIALIZE_AUTH'; payload: { user: User | null; token: string | null; isAuthenticated: boolean } }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to prevent premature redirects
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null,
      };
    
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'INITIALIZE_AUTH':
      console.log('INITIALIZE_AUTH action:', action.payload);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: action.payload.isAuthenticated,
        // Don't change loading state here - handle it explicitly
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Note: Removed global initialization flag as it was causing issues

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const initialized = useRef(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized.current) {
        console.log('Auth already initialized for this instance, skipping...');
        return;
      }
      
      initialized.current = true;
      const storedUser = getUserData();
      const storedToken = getAuthToken();
      const isAuth = isAuthenticated();
      
      console.log('Initializing auth state:', { storedUser, storedToken, isAuth });
      
      // If we have a token and user data, initialize with stored data first
      if (storedToken && isAuth && storedUser) {
        // Initialize with stored data immediately
        dispatch({
          type: 'INITIALIZE_AUTH',
          payload: { 
            user: storedUser, 
            token: storedToken,
            isAuthenticated: true 
          }
        });
        
        // Update API client with current token
        apiClient.setToken(storedToken);
        
        // Set loading to false after initialization
        dispatch({ type: 'SET_LOADING', payload: false });
        
        // Verify token in background (non-blocking)
        console.log('🔍 Starting background token verification...');
        userService.getCurrentUser().then(response => {
          console.log('✅ Token verification successful:', response);
          if (response.success && response.data) {
            // Update with fresh data if available
            const currentToken = response.data.token || storedToken;
            dispatch({
              type: 'INITIALIZE_AUTH',
              payload: { 
                user: response.data.user, 
                token: currentToken,
                isAuthenticated: true 
              }
            });
            apiClient.setToken(currentToken);
          }
        }).catch(error => {
          console.error('❌ Background token verification failed:', error);
          console.error('❌ Error response:', error.response);
          console.error('❌ Error status:', error.response?.status);
          console.error('❌ Error data:', error.response?.data);
          
          // Check if it's a session expiration (401 error)
          if (error.response?.status === 401) {
            console.log('🚪 Session expired - logging out user');
            
            const errorCode = error.response?.data?.code;
            
            // Show notification (will be caught by api-client interceptor too, but good to have here as backup)
            if (errorCode === 'SESSION_EXPIRED') {
              console.log('Session expired due to inactivity');
              // Note: The toast will be shown by api-client interceptor
            }
            
            // Clear auth state on session expiration
            dispatch({ type: 'LOGOUT' });
            // apiClient will handle cookie clearing, toast notification, and redirect via interceptor
          } else {
            console.log('⚠️ Non-401 error - keeping user logged in');
          }
        });
      } else {
        // No token, user is not authenticated
        dispatch({
          type: 'INITIALIZE_AUTH',
          payload: { user: null, token: null, isAuthenticated: false }
        });
        // Set loading to false after initialization
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
    
    // Fallback timeout to ensure loading state is set to false
    const timeoutId = setTimeout(() => {
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await userService.login(credentials);
      
      if (response.success && response.data) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
      } else {
        const errorMessage = response.message || 'Login failed';
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: errorMessage,
        });
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (userData: RegisterData) => {
    try {
      dispatch({ type: 'REGISTER_START' });
      
      const response = await userService.register(userData);
      
      if (response.success && response.data) {
        dispatch({
          type: 'REGISTER_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
      } else {
        dispatch({
          type: 'REGISTER_FAILURE',
          payload: response.message || 'Registration failed',
        });
      }
    } catch (error: any) {
      dispatch({
        type: 'REGISTER_FAILURE',
        payload: error.message || 'Registration failed',
      });
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log('Starting logout process...');
      await userService.logout();
      console.log('UserService logout completed');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      console.log('Dispatching LOGOUT action');
      dispatch({ type: 'LOGOUT' });
      console.log('Logout process completed');
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};