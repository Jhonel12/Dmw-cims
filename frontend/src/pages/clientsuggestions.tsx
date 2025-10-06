import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { clientSuggestionsService, type ClientSuggestion, type ClientSuggestionFilters } from '../services/clientSuggestionsService';

const ClientSuggestions: React.FC = () => {
  const { showToast } = useToast();
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [filters, setFilters] = useState<ClientSuggestionFilters>({});

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setIsInitialLoading(true);
        
        const response = await clientSuggestionsService.getSuggestions(filters);
        
        if (response.success) {
          setSuggestions(response.data);
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Client suggestions loaded successfully'
          });
        } else {
          throw new Error(response.message || 'Failed to load suggestions');
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load client suggestions'
        });
        setSuggestions([]);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchSuggestions();
  }, []); // Only run on component mount to prevent duplicate toasts

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewSuggestion = (suggestion: ClientSuggestion) => {
    // For now, just show an alert - you can create a modal later
    alert(`Viewing suggestion from ${suggestion.control_no}:\n\n"${suggestion.suggestions}"`);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await clientSuggestionsService.getSuggestions(filters);
      
      if (response.success) {
        setSuggestions(response.data);
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Client suggestions refreshed successfully'
        });
      } else {
        throw new Error(response.message || 'Failed to refresh suggestions');
      }
    } catch (error) {
      console.error('Error refreshing suggestions:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to refresh client suggestions'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Client Suggestions
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View client feedback and suggestions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="btn btn-ghost flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {isInitialLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-elevated p-3">
                <div className="animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="card-elevated p-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No suggestions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no client suggestions available at the moment.
              </p>
            </div>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div key={suggestion.id} className="card-elevated p-3 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {suggestion.control_no}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      suggestion.client_channel === 'online' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {suggestion.client_channel}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(suggestion.date)}
                    </span>
                  </div>
                  
                  <div className="mb-1">
                    <h3 className="text-xs font-semibold text-gray-900">
                      {suggestion.client_type} • {suggestion.sex} • {suggestion.service_availed}
                    </h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-2 mb-2">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      "{suggestion.suggestions}"
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      {suggestion.email && (
                        <span className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span>{suggestion.email}</span>
                        </span>
                      )}
                      {suggestion.age && (
                        <span className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Age {suggestion.age}</span>
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleViewSuggestion(suggestion)}
                      className="btn btn-ghost text-xs px-2 py-1 hover:bg-teal-50 hover:text-teal-700"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientSuggestions;
