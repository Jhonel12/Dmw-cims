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

interface SecurityTabProps {
  userSettings: UserSettings;
  onNestedSettingsChange: (section: keyof UserSettings, field: string, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
}

const SecurityTab: React.FC<SecurityTabProps> = ({
  userSettings,
  onNestedSettingsChange,
  onSave,
  isSaving
}) => {
  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Two-Factor Authentication</div>
              <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                userSettings.security.twoFactorEnabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {userSettings.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={userSettings.security.twoFactorEnabled}
                  onChange={(e) => onNestedSettingsChange('security', 'twoFactorEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Session Timeout (minutes)</label>
              <select
                value={userSettings.security.sessionTimeout}
                onChange={(e) => onNestedSettingsChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="form-input"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
              </select>
            </div>
            <div>
              <label className="form-label">Password Last Changed</label>
              <input
                type="text"
                value={userSettings.security.passwordLastChanged}
                disabled
                className="form-input bg-gray-50"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button className="btn btn-secondary">
              Change Password
            </button>
            <button className="btn btn-secondary">
              View Login History
            </button>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Security Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;
