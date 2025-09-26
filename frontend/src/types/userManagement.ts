import type { User } from './auth';

// Extended User interface for user management
export interface ExtendedUser extends User {
  role: 'Administrator' | 'Manager' | 'User';
  status: 'Active' | 'Inactive' | 'Suspended';
  phone?: string;
  address?: string;
  timezone?: string;
  language?: string;
  password_changed_at?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  administrators: number;
  managers: number;
  regular_users: number;
  recent_users: number;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'Administrator' | 'Manager' | 'User';
  status: 'Active' | 'Inactive' | 'Suspended';
  phone?: string;
  address?: string;
  timezone?: string;
  language?: string;
}

export interface UpdateUserData {
  name: string;
  email: string;
  role: 'Administrator' | 'Manager' | 'User';
  status: 'Active' | 'Inactive' | 'Suspended';
  phone?: string;
  address?: string;
  timezone?: string;
  language?: string;
}

export interface UpdateProfileData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  timezone?: string;
  language?: string;
}

export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}
