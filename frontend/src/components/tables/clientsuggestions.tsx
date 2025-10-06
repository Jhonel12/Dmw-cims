import React, { useState } from 'react';

interface ClientSuggestion {
  id: number;
  control_no: string;
  client_type: string;
  sex: string;
  age?: number;
  region?: string;
  service_availed: string;
  suggestions: string;
  email?: string;
  created_at: string;
  updated_at: string;
  client_channel: string;
}

interface ClientSuggestionsTableProps {
  data: ClientSuggestion[];
  onView?: (suggestion: ClientSuggestion) => void;
  isLoading?: boolean;
  isInitialLoading?: boolean;
}

const ClientSuggestionsTable: React.FC<ClientSuggestionsTableProps> = ({
  data,
  onView,
  isLoading = false,
  isInitialLoading = false
}) => {
  const [sortField, setSortField] = useState<keyof ClientSuggestion>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof ClientSuggestion) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getSortIcon = (field: keyof ClientSuggestion) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  if (isInitialLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-xs text-gray-600">Loading suggestions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <div className="text-center py-6">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="mt-2 text-xs font-medium text-gray-900">No suggestions found</h3>
            <p className="mt-1 text-xs text-gray-500">
              There are no client suggestions available at the moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort('control_no')}
              >
                <div className="flex items-center space-x-0.5">
                  <span>Control No</span>
                  {getSortIcon('control_no')}
                </div>
              </th>
              <th 
                className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort('client_type')}
              >
                <div className="flex items-center space-x-0.5">
                  <span>Client Type</span>
                  {getSortIcon('client_type')}
                </div>
              </th>
              <th 
                className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort('sex')}
              >
                <div className="flex items-center space-x-0.5">
                  <span>Sex</span>
                  {getSortIcon('sex')}
                </div>
              </th>
              <th 
                className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort('service_availed')}
              >
                <div className="flex items-center space-x-0.5">
                  <span>Service</span>
                  {getSortIcon('service_availed')}
                </div>
              </th>
              <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Suggestions
              </th>
              <th 
                className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort('client_channel')}
              >
                <div className="flex items-center space-x-0.5">
                  <span>Channel</span>
                  {getSortIcon('client_channel')}
                </div>
              </th>
              <th 
                className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-0.5">
                  <span>Date</span>
                  {getSortIcon('created_at')}
                </div>
              </th>
              <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((suggestion) => (
              <tr key={suggestion.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-1 py-0.5">
                  <div className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                    {suggestion.control_no || 'N/A'}
                  </div>
                </td>
                <td className="px-1 py-0.5">
                  <div className="text-xs text-gray-900">{suggestion.client_type || 'N/A'}</div>
                </td>
                <td className="px-1 py-0.5">
                  <div className="text-xs text-gray-900">{suggestion.sex || 'N/A'}</div>
                </td>
                <td className="px-1 py-0.5">
                  <div className="text-xs text-gray-900">{suggestion.service_availed || 'N/A'}</div>
                </td>
                <td className="px-1 py-0.5 max-w-xs">
                  <div className="text-xs text-gray-900" title={suggestion.suggestions}>
                    {truncateText(suggestion.suggestions, 60)}
                  </div>
                </td>
                <td className="px-1 py-0.5">
                  <div className={`text-xs px-1 py-0.5 rounded-full ${
                    suggestion.client_channel === 'online' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {suggestion.client_channel || 'N/A'}
                  </div>
                </td>
                <td className="px-1 py-0.5">
                  <div className="text-xs text-gray-900">{formatDate(suggestion.created_at)}</div>
                </td>
                <td className="px-1 py-0.5">
                  <div className="flex items-center justify-center">
                    {onView && (
                      <button
                        onClick={() => onView(suggestion)}
                        className="btn btn-ghost text-xs p-0.5 hover:bg-teal-50 hover:text-teal-700"
                        title="View suggestion details"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientSuggestionsTable;
