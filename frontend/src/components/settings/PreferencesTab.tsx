import React from 'react';

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

interface PreferencesTabProps {
  userSettings: UserSettings;
  onNestedSettingsChange: (section: keyof UserSettings, field: string, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
}

const PreferencesTab: React.FC<PreferencesTabProps> = ({
  userSettings,
  onNestedSettingsChange,
  onSave,
  isSaving
}) => {
  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">App Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Theme</label>
            <select
              value={userSettings.preferences.theme}
              onChange={(e) => onNestedSettingsChange('preferences', 'theme', e.target.value)}
              className="form-input"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label className="form-label">Language</label>
            <select
              value={userSettings.preferences.language}
              onChange={(e) => onNestedSettingsChange('preferences', 'language', e.target.value)}
              className="form-input"
            >
              <option value="en">English</option>
              <option value="fil">Filipino</option>
            </select>
          </div>
          <div>
            <label className="form-label">Timezone</label>
            <select
              value={userSettings.preferences.timezone}
              onChange={(e) => onNestedSettingsChange('preferences', 'timezone', e.target.value)}
              className="form-input"
            >
              <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
              <option value="UTC">UTC (UTC+0)</option>
            </select>
          </div>
          <div>
            <label className="form-label">Date Format</label>
            <select
              value={userSettings.preferences.dateFormat}
              onChange={(e) => onNestedSettingsChange('preferences', 'dateFormat', e.target.value)}
              className="form-input"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      <div className="card-elevated p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Email Notifications</div>
              <div className="text-sm text-gray-600">Receive notifications via email</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userSettings.notifications.email}
                onChange={(e) => onNestedSettingsChange('notifications', 'email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">SMS Notifications</div>
              <div className="text-sm text-gray-600">Receive notifications via SMS</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userSettings.notifications.sms}
                onChange={(e) => onNestedSettingsChange('notifications', 'sms', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Push Notifications</div>
              <div className="text-sm text-gray-600">Receive push notifications in browser</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userSettings.notifications.push}
                onChange={(e) => onNestedSettingsChange('notifications', 'push', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesTab;
