import React from 'react';

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

interface SystemTabProps {
  systemSettings: SystemSettings;
  onSystemSettingsChange: (field: keyof SystemSettings, value: any) => void;
  onNestedSystemSettingsChange: (section: keyof SystemSettings, field: string, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
}

const SystemTab: React.FC<SystemTabProps> = ({
  systemSettings,
  onNestedSystemSettingsChange,
  onSave,
  isSaving
}) => {
  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">System Configuration</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Maintenance Mode</div>
              <div className="text-sm text-gray-600">Enable maintenance mode to restrict access</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemSettings.maintenance.enabled}
                onChange={(e) => onNestedSystemSettingsChange('maintenance', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {systemSettings.maintenance.enabled && (
            <div>
              <label className="form-label">Maintenance Message</label>
              <textarea
                value={systemSettings.maintenance.message}
                onChange={(e) => onNestedSystemSettingsChange('maintenance', 'message', e.target.value)}
                className="form-input"
                rows={3}
                placeholder="Enter maintenance message"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto Backup</div>
              <div className="text-sm text-gray-600">Automatically backup data</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemSettings.backup.autoBackup}
                onChange={(e) => onNestedSystemSettingsChange('backup', 'autoBackup', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Backup Frequency</label>
              <select
                value={systemSettings.backup.frequency}
                onChange={(e) => onNestedSystemSettingsChange('backup', 'frequency', e.target.value)}
                className="form-input"
                disabled={!systemSettings.backup.autoBackup}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="form-label">Last Backup</label>
              <input
                type="text"
                value={systemSettings.backup.lastBackup}
                disabled
                className="form-input bg-gray-50"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Integrations</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Email Service</div>
                  <div className="text-sm text-gray-600">SMTP email notifications</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemSettings.integrations.emailService}
                    onChange={(e) => onNestedSystemSettingsChange('integrations', 'emailService', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">SMS Service</div>
                  <div className="text-sm text-gray-600">SMS notifications</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemSettings.integrations.smsService}
                    onChange={(e) => onNestedSystemSettingsChange('integrations', 'smsService', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">API Access</div>
                  <div className="text-sm text-gray-600">Enable API endpoints</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemSettings.integrations.apiAccess}
                    onChange={(e) => onNestedSystemSettingsChange('integrations', 'apiAccess', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save System Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemTab;
