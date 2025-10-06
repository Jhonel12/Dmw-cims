import React, { useState } from 'react';

// Survey Response Type Definition
export interface SurveyResponse {
  id: number;
  control_no: string;
  client_type?: string;
  client_channel?: 'walk-in' | 'online';
  date: string;
  sex?: 'Male' | 'Female';
  age?: number;
  region?: string;
  service_availed?: string;
  cc1?: string; // Awareness of CC
  cc2?: string; // CC visibility
  cc3?: string; // CC helpfulness
  sqd0?: string; // Overall satisfaction
  sqd1?: string; // Time spent
  sqd2?: string; // Requirements followed
  sqd3?: string; // Steps easy/simple
  sqd4?: string; // Information found easily
  sqd5?: string; // Reasonable fees
  sqd6?: string; // Fair treatment
  sqd7?: string; // Courteous staff
  sqd8?: string; // Got what needed
  suggestions?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface SurveyResponseTableProps {
  data: SurveyResponse[];
  onView: (response: SurveyResponse) => void;
  onExport?: (response: SurveyResponse) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  isInitialLoading?: boolean;
}

const SurveyResponseTable: React.FC<SurveyResponseTableProps> = ({ 
  data, 
  onView, 
  onExport,
  onRefresh,
  isLoading = false,
  isInitialLoading = false
}) => {
  const [sortField, setSortField] = useState<keyof SurveyResponse>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof SurveyResponse) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...(Array.isArray(data) ? data : [])].sort((a, b) => {
    const aValue = a[sortField] ?? '';
    const bValue = b[sortField] ?? '';
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSatisfactionColor = (rating: string | undefined) => {
    if (!rating) return 'text-gray-400';
    const numRating = parseInt(rating);
    if (numRating >= 5) return 'text-green-600';
    if (numRating >= 4) return 'text-blue-600';
    if (numRating >= 3) return 'text-yellow-600';
    if (numRating >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSatisfactionText = (rating: string | undefined) => {
    if (!rating) return 'N/A';
    const numRating = parseInt(rating);
    if (numRating >= 5) return 'Excellent';
    if (numRating >= 4) return 'Good';
    if (numRating >= 3) return 'Fair';
    if (numRating >= 2) return 'Poor';
    return 'Very Poor';
  };

  const getChannelIcon = (channel: string | undefined) => {
    if (channel === 'walk-in') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  // Skeleton loading component for initial load
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          <div className="ml-2">
            <div className="h-3 bg-gray-300 rounded w-20 mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="h-4 bg-gray-300 rounded-full w-16"></div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="h-3 bg-gray-300 rounded w-20"></div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="h-3 bg-gray-300 rounded w-24"></div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="h-3 bg-gray-300 rounded w-16"></div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="h-3 bg-gray-300 rounded w-20"></div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex space-x-1">
          <div className="h-4 bg-gray-300 rounded w-8"></div>
          <div className="h-4 bg-gray-300 rounded w-8"></div>
        </div>
      </td>
    </tr>
  );

  // Show skeleton loading for initial load
  if (isInitialLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200/60 bg-gradient-to-r from-orange-50 to-yellow-100/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Survey Responses</h3>
              <p className="text-xs text-gray-600 mt-1">Loading responses...</p>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Control No.</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Channel</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client Info</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Satisfaction</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200/60 bg-gradient-to-r from-orange-50 to-yellow-100/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Survey Responses</h3>
            <div className="text-xs text-gray-600 mt-1">
              Total responses: {data?.length || 0}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
              <span>Live Data</span>
            </div>
            <button className="btn btn-ghost text-xs px-2 py-1">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export All
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto relative">
        {isLoading && !isInitialLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
              <span className="text-sm">Loading data...</span>
            </div>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('control_no')}
              >
                <div className="flex items-center space-x-1">
                  <span>Control No.</span>
                  {sortField === 'control_no' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('client_channel')}
              >
                <div className="flex items-center space-x-1">
                  <span>Channel</span>
                  {sortField === 'client_channel' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('sex')}
              >
                <div className="flex items-center space-x-1">
                  <span>Client Info</span>
                  {sortField === 'sex' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('service_availed')}
              >
                <div className="flex items-center space-x-1">
                  <span>Service</span>
                  {sortField === 'service_availed' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('sqd0')}
              >
                <div className="flex items-center space-x-1">
                  <span>Satisfaction</span>
                  {sortField === 'sqd0' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100/80 transition-colors duration-150 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {sortField === 'created_at' && (
                    <svg className={`w-3 h-3 transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((response) => (
              <tr key={response.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-100 to-yellow-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-orange-700">
                        {response.control_no ? response.control_no.slice(-2) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{response.control_no || 'N/A'}</div>
                      <div className="text-xs text-gray-500">ID: {response.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <div className={`p-1 rounded-full ${
                      response.client_channel === 'walk-in' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {getChannelIcon(response.client_channel)}
                    </div>
                    <span className={`text-xs font-medium ${
                      response.client_channel === 'walk-in' 
                        ? 'text-blue-700' 
                        : 'text-green-700'
                    }`}>
                      {response.client_channel || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs text-gray-900">
                    {response.sex && response.age ? `${response.sex}, ${response.age}y` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">{response.region || 'No region'}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs text-gray-900 max-w-xs truncate" title={response.service_availed}>
                    {response.service_availed || 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <span className={`text-sm font-semibold ${getSatisfactionColor(response.sqd0)}`}>
                      {response.sqd0 || 'N/A'}
                    </span>
                    {response.sqd0 && (
                      <span className={`text-xs ${getSatisfactionColor(response.sqd0)}`}>
                        ({getSatisfactionText(response.sqd0)})
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs text-gray-900">{formatDate(response.created_at)}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => onView(response)}
                      className="btn btn-ghost text-xs p-1.5 hover:bg-orange-50 hover:text-orange-700"
                      title="View details"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {(!data || data.length === 0) && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No survey responses found</h3>
          <p className="text-sm text-gray-500 mb-4">Survey responses will appear here once clients start submitting feedback</p>
          <button 
            onClick={onRefresh}
            disabled={!onRefresh}
            className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Refresh Data
          </button>
        </div>
      )}

    </div>
  );
};

export default SurveyResponseTable;
