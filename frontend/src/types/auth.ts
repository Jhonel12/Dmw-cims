// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    token_type: string;
  };
  errors?: { [key: string]: string[] };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { [key: string]: string[] };
  error?: string;
}
