import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileTab from '../components/settings/ProfileTab';
import PreferencesTab from '../components/settings/PreferencesTab';
import SecurityTab from '../components/settings/SecurityTab';
import SystemTab from '../components/settings/SystemTab';
import ActivityLogTab from '../components/settings/ActivityLogTab';
type SettingsTab = 'profile' | 'preferences' | 'security' | 'system' | 'activity';

interface UserSettings {
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

interface SystemSettings {
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

const Settings: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@example.com',
    role: 'Administrator',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'Asia/Manila',
      dateFormat: 'MM/DD/YYYY',
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordLastChanged: '2024-01-15',
    },
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenance: {
      enabled: false,
      message: 'System is currently under maintenance. Please try again later.',
    },
    backup: {
      autoBackup: true,
      frequency: 'daily',
      lastBackup: '2024-01-20 02:00:00',
    },
    integrations: {
      emailService: true,
      smsService: false,
      apiAccess: true,
    },
  });

  const handleUserSettingsChange = (field: keyof UserSettings, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedSettingsChange = (section: keyof UserSettings, field: string, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  const handleSystemSettingsChange = (field: keyof SystemSettings, value: any) => {
    setSystemSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedSystemSettingsChange = (section: keyof SystemSettings, field: string, value: any) => {
    setSystemSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  const handleSaveSettings = async (type: 'user' | 'system') => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (type === 'user') {
        console.log('Saving user settings:', userSettings);
        showSuccess('Success', 'User settings saved successfully!');
      } else {
        console.log('Saving system settings:', systemSettings);
        showSuccess('Success', 'System settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤', description: 'Personal information' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️', description: 'App preferences' },
    { id: 'security', label: 'Security', icon: '🔒', description: 'Security settings' },
    { id: 'system', label: 'System', icon: '🖥️', description: 'System configuration' },
    { id: 'activity', label: 'Activity Log', icon: '📋', description: 'System activities' },
  ];

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your account and system preferences</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">All systems operational</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="border-b border-gray-200/60">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`py-2 px-1 border-b-2 font-medium text-base ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className="text-xs font-normal text-gray-500">{tab.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <ProfileTab
          userSettings={userSettings}
          onSettingsChange={handleUserSettingsChange}
          onSave={() => handleSaveSettings('user')}
          isSaving={isSaving}
        />
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <PreferencesTab
          userSettings={userSettings}
          onNestedSettingsChange={handleNestedSettingsChange}
          onSave={() => handleSaveSettings('user')}
          isSaving={isSaving}
        />
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <SecurityTab
          userSettings={userSettings}
          onNestedSettingsChange={handleNestedSettingsChange}
          onSave={() => handleSaveSettings('user')}
          isSaving={isSaving}
        />
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <SystemTab
          systemSettings={systemSettings}
          onSystemSettingsChange={handleSystemSettingsChange}
          onNestedSystemSettingsChange={handleNestedSystemSettingsChange}
          onSave={() => handleSaveSettings('system')}
          isSaving={isSaving}
        />
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <ActivityLogTab />
      )}
    </div>
  );
};

export default Settings;
