import Cookies from 'js-cookie';

// Cookie configuration
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === 'production', // Only secure in production
  sameSite: 'strict' as const, // CSRF protection
  path: '/', // Available site-wide
};

// Cookie keys
export const COOKIE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
} as const;

// Token management
export const setAuthToken = (token: string): void => {
  Cookies.set(COOKIE_KEYS.AUTH_TOKEN, token, COOKIE_OPTIONS);
};

export const getAuthToken = (): string | undefined => {
  return Cookies.get(COOKIE_KEYS.AUTH_TOKEN);
};

export const removeAuthToken = (): void => {
  Cookies.remove(COOKIE_KEYS.AUTH_TOKEN, { path: '/' });
};

// User data management
export const setUserData = (userData: any): void => {
  Cookies.set(COOKIE_KEYS.USER_DATA, JSON.stringify(userData), COOKIE_OPTIONS);
};

export const getUserData = (): any | null => {
  const userData = Cookies.get(COOKIE_KEYS.USER_DATA);
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data from cookie:', error);
      return null;
    }
  }
  return null;
};

export const removeUserData = (): void => {
  Cookies.remove(COOKIE_KEYS.USER_DATA, { path: '/' });
};

// Clear all auth cookies
export const clearAuthCookies = (): void => {
  removeAuthToken();
  removeUserData();
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
