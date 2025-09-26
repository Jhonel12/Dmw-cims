export interface UserSettings {
  name: string;
  email: string;
  role: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    passwordLastChanged: string;
  };
}

export interface SystemSettings {
  maintenance: {
    enabled: boolean;
    message: string;
  };
  backup: {
    autoBackup: boolean;
    frequency: string;
    lastBackup: string;
  };
  integrations: {
    emailService: boolean;
    smsService: boolean;
    apiAccess: boolean;
  };
}

export type SettingsTab = 'profile' | 'preferences' | 'security' | 'system';
