import React, { useState } from 'react';

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'warning' | 'error';
}

interface ActivityLogTabProps {
  // No props needed for static data
}

const ActivityLogTab: React.FC<ActivityLogTabProps> = () => {
  const [filter, setFilter] = useState<'all' | 'success' | 'warning' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Static activity log data
  const activityLogs: ActivityLog[] = [
    {
      id: '1',
      timestamp: '2024-01-20 14:30:25',
      user: 'Admin User',
      action: 'Login',
      description: 'Successfully logged into the system',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: '2',
      timestamp: '2024-01-20 14:25:10',
      user: 'Admin User',
      action: 'Settings Update',
      description: 'Updated profile information',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: '3',
      timestamp: '2024-01-20 14:20:45',
      user: 'Admin User',
      action: 'Client Export',
      description: 'Exported client data to CSV format',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: '4',
      timestamp: '2024-01-20 14:15:30',
      user: 'Admin User',
      action: 'OFW Record Created',
      description: 'Added new OFW record for Juan Dela Cruz',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: '5',
      timestamp: '2024-01-20 14:10:15',
      user: 'Admin User',
      action: 'Client Profile Updated',
      description: 'Modified client profile information',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: '6',
      timestamp: '2024-01-20 14:05:00',
      user: 'Admin User',
      action: 'Report Generated',
      description: 'Generated OFW monthly report',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: '7',
      timestamp: '2024-01-20 13:55:20',
      user: 'Admin User',
      action: 'Failed Login Attempt',
      description: 'Invalid password entered',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      status: 'error'
    },
    {
      id: '8',
      timestamp: '2024-01-20 13:50:10',
      user: 'Admin User',
      action: 'System Backup',
      description: 'Scheduled backup completed successfully',
      ipAddress: '192.168.1.100',
      userAgent: 'System',
      status: 'success'
    },
    {
      id: '9',
      timestamp: '2024-01-20 13:45:35',
      user: 'Admin User',
      action: 'Settings Update',
      description: 'Changed notification preferences',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    },
    {
      id: '10',
      timestamp: '2024-01-20 13:40:50',
      user: 'Admin User',
      action: 'Database Maintenance',
      description: 'Database optimization completed',
      ipAddress: '192.168.1.100',
      userAgent: 'System',
      status: 'success'
    },
    {
      id: '11',
      timestamp: '2024-01-20 13:35:15',
      user: 'Admin User',
      action: 'Security Alert',
      description: 'Multiple failed login attempts detected',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      status: 'warning'
    },
    {
      id: '12',
      timestamp: '2024-01-20 13:30:00',
      user: 'Admin User',
      action: 'Logout',
      description: 'User logged out of the system',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      status: 'success'
    }
  ];

  // Filter and search activities
  const filteredActivities = activityLogs.filter(activity => {
    const matchesFilter = filter === 'all' || activity.status === filter;
    const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Log Header */}
      <div className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Activity Log</h3>
            <p className="text-sm text-gray-600 mt-1">Monitor system activities and user actions</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live monitoring active</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({activityLogs.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Success ({activityLogs.filter(a => a.status === 'success').length})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'warning'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Warning ({activityLogs.filter(a => a.status === 'warning').length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Error ({activityLogs.filter(a => a.status === 'error').length})
            </button>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activities found matching your criteria.
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <span className="text-lg">{getStatusIcon(activity.status)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">{activity.action}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>👤 {activity.user}</span>
                    <span>🌐 {activity.ipAddress}</span>
                    <span>📱 {activity.userAgent.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Activity Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activityLogs.filter(a => a.status === 'success').length}
              </div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {activityLogs.filter(a => a.status === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {activityLogs.filter(a => a.status === 'error').length}
              </div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {activityLogs.length}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogTab;
