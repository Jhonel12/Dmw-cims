import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../hooks/useModal';
import AddClientModal from '../components/modals/AddClientModal';
import ofwService from '../services/OFWService';
import { clientService, type Client, type ClientStats } from '../services/clientService';
import type { OFWStatistics, OFW } from '../types/ofw';

const Dashboard: React.FC = () => {
  const { showError } = useToast();
  const [statistics, setStatistics] = useState<OFWStatistics | null>(null);
  const [recentDepartures, setRecentDepartures] = useState<OFW[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addClientModal = useModal();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load all dashboard data in parallel
      const [statsResponse, recentResponse, clientStatsResponse, recentClientsResponse] = await Promise.all([
        ofwService.getStatistics(),
        ofwService.getRecentDepartures({ per_page: 5 }),
        clientService.getClientStats().catch(() => ({ data: null })), // Handle client stats error gracefully
        clientService.getClients({ per_page: 5, page: 1 }).catch(() => ({ data: { data: [] } })) // Handle client list error gracefully
      ]);
      
      setStatistics(statsResponse);
      setRecentDepartures(recentResponse.data);
      setClientStats(clientStatsResponse.data);
      setRecentClients(recentClientsResponse.data.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Error', 'Failed to load dashboard data. Using fallback data.');
      // Keep mock data as fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic stats based on real data
  const stats = statistics && clientStats ? [
    { 
      title: 'Total OFW Records', 
      value: statistics.total_records.toLocaleString(), 
      change: '+12%', 
      changeType: 'positive',
      gradient: 'from-blue-500 to-blue-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    { 
      title: 'Total Clients', 
      value: clientStats.total_clients.toLocaleString(), 
      change: '+15%', 
      changeType: 'positive',
      gradient: 'from-indigo-500 to-indigo-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      title: 'Verified Clients', 
      value: clientStats.verified_clients.toLocaleString(), 
      change: '+8%', 
      changeType: 'positive',
      gradient: 'from-green-500 to-green-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      title: 'OFW Clients', 
      value: clientStats.ofw_clients.toLocaleString(), 
      change: '+23%', 
      changeType: 'positive',
      gradient: 'from-yellow-500 to-orange-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ] : [
    // Fallback mock data
    { 
      title: 'Total OFW Records', 
      value: '0', 
      change: '+0%', 
      changeType: 'positive',
      gradient: 'from-blue-500 to-blue-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    { 
      title: 'Total Clients', 
      value: '0', 
      change: '+0%', 
      changeType: 'positive',
      gradient: 'from-indigo-500 to-indigo-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      title: 'Verified Clients', 
      value: '0', 
      change: '+0%', 
      changeType: 'positive',
      gradient: 'from-green-500 to-green-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      title: 'OFW Clients', 
      value: '0', 
      change: '+0%', 
      changeType: 'positive',
      gradient: 'from-yellow-500 to-orange-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  // Use real data for recent departures
  const recentDeparturesData = recentDepartures.map(ofw => ({
    name: ofw.nameOfWorker,
    country: ofw.countryDestination,
    date: ofw.departureDate,
    position: ofw.position,
    status: new Date(ofw.departureDate) <= new Date() ? 'active' : 'pending'
  }));

  // Use real data for recent clients
  const recentClientsData = recentClients.map(client => {
    const fullName = `${client.first_name} ${client.middle_name ? client.middle_name + ' ' : ''}${client.last_name}${client.suffix ? ' ' + client.suffix : ''}`;
    return {
      name: fullName,
      email: client.email,
      date: client.created_at,
      status: client.has_national_id ? 'verified' : 'pending',
      age: client.age || Math.floor((new Date().getTime() - new Date(client.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    };
  });

  const handleAddClient = () => {
    addClientModal.open();
  };

  const handleAddClientSuccess = () => {
    // Refresh dashboard data after successful client creation
    loadDashboardData();
  };

  const quickActions = [
    {
      title: 'Add New OFW',
      description: 'Register a new OFW record',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      gradient: 'from-blue-500 to-blue-600',
      href: '/add-ofw'
    },
    {
      title: 'Add New Client',
      description: 'Register a new client profile',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      gradient: 'from-indigo-500 to-indigo-600',
      onClick: handleAddClient
    },
    {
      title: 'Client Profiles',
      description: 'Manage client information',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      gradient: 'from-green-500 to-green-600',
      href: '/client-profile'
    },
    {
      title: 'Generate Report',
      description: 'Create detailed reports',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-purple-600',
      href: '/reports'
    }
  ];

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
              Welcome to DMW Region 10
            </h1>
            <p className="text-xs text-gray-600 mb-1">
              Overseas Filipino Workers Tracking System
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
              <span className="text-xs">Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card group p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 bg-gradient-to-br ${stat.gradient} text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                {stat.icon}
              </div>
              <div className="text-right">
                <div className={`text-xs font-semibold ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
                <div className="text-xs text-gray-500">vs last month</div>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs font-medium text-gray-600">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Recent Departures */}
      <div className="card-elevated">
        <div className="p-3 sm:p-4 border-b border-gray-200/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Recent Departures</h2>
              <p className="text-xs text-gray-600">Latest OFW departures this month</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={loadDashboardData}
                disabled={isLoading}
                className="btn btn-ghost text-xs px-2 py-1"
              >
                {isLoading ? (
                  <div className="spinner w-3 h-3 mr-1"></div>
                ) : (
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
              <button className="btn btn-ghost text-xs px-2 py-1">
                View All
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="table w-full min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Country</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="table-row">
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : recentDeparturesData.length > 0 ? (
                recentDeparturesData.map((departure, index) => (
                  <tr key={index} className="table-row">
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-700">
                            {departure.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="font-medium text-gray-900 text-sm">{departure.name}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-900 text-sm">{departure.position}</td>
                    <td className="px-3 py-2 text-gray-900 text-sm">{departure.country}</td>
                    <td className="px-3 py-2">
                      <span className={`badge ${
                        departure.status === 'active' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {departure.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-900 text-sm">
                      {new Date(departure.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                // Empty state
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="text-sm">No recent departures found</p>
                      <p className="text-xs text-gray-400">Add some OFW records to see them here</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Clients */}
      <div className="card-elevated">
        <div className="p-3 sm:p-4 border-b border-gray-200/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Recent Clients</h2>
              <p className="text-xs text-gray-600">Latest registered clients this month</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={loadDashboardData}
                disabled={isLoading}
                className="btn btn-ghost text-xs px-2 py-1"
              >
                {isLoading ? (
                  <div className="spinner w-3 h-3 mr-1"></div>
                ) : (
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
              <button className="btn btn-ghost text-xs px-2 py-1">
                View All
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="table w-full min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Age</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registered</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-client-${index}`} className="table-row">
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : recentClientsData.length > 0 ? (
                recentClientsData.map((client, index) => (
                  <tr key={index} className="table-row">
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-indigo-700">
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="font-medium text-gray-900 text-sm">{client.name}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-900 text-sm">{client.age} years</td>
                    <td className="px-3 py-2 text-gray-900 text-sm">{client.email}</td>
                    <td className="px-3 py-2">
                      <span className={`badge ${
                        client.status === 'verified' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-900 text-sm">
                      {new Date(client.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                // Empty state
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-sm">No recent clients found</p>
                      <p className="text-xs text-gray-400">Add some client profiles to see them here</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-elevated p-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          <p className="text-xs text-gray-600 mt-1">Common tasks and shortcuts</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="group p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-200 text-left"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${action.gradient} rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-200`}>
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{action.title}</h3>
              <p className="text-xs text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={addClientModal.isOpen}
        onClose={addClientModal.close}
        onSuccess={handleAddClientSuccess}
      />
    </div>
  );
};

export default Dashboard;
