import React, { useState, useEffect } from 'react';
import SurveyResponseTable from '../components/tables/surveyresponseTable';
import type { SurveyResponse } from '../components/tables/surveyresponseTable';
import { useToast } from '../contexts/ToastContext';
import customerFeedbackService, { type SurveyStats, type SurveyFilters } from '../services/customer-feedbackService';
import { getAuthToken } from '../utils/cookieUtils';
import ViewSurveyModal from '../components/modals/viewsurveyModal';
import { Pagination } from '../components/pagination';

const SurveyList: React.FC = () => {
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filters] = useState<SurveyFilters>({});
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { showToast } = useToast();

  // Load survey responses and stats
  useEffect(() => {
    console.log('=== useEffect triggered - starting data load ===');
    
    // Check token from cookies
    const token = getAuthToken();
    console.log('Token from cookies:', token ? 'exists' : 'missing');
    console.log('Token length:', token ? token.length : 0);
    
    // Use the service directly instead of direct fetch
    console.log('Using service to load data...');
    loadSurveyResponses();
    loadStats();
   
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isInitialLoading) {
        console.log('Loading timeout - forcing stop');
        setIsInitialLoading(false);
        setIsLoading(false);
      }
    }, 3000); // Reduced to 3 second timeout
    
    return () => clearTimeout(timeout);
  }, []);

  const loadSurveyResponses = async (page: number = currentPage, perPage: number = itemsPerPage, isPagination: boolean = false) => {
    console.log('=== loadSurveyResponses called ===');
    console.log('Parameters:', { page, perPage, isPagination });
    
    try {
      if (isPagination) {
        setIsLoading(true);
      } else {
        setIsInitialLoading(true);
        setIsLoading(false);
      }

      console.log('Loading survey responses with filters:', { ...filters, page, per_page: perPage });
      
      const response = await customerFeedbackService.getSurveyResponses({
        ...filters,
        page,
        per_page: perPage
      });

      console.log('API Response received:', response);

      // The API returns: { data: { data: [...], current_page: 1, last_page: 2, total: 15 } }
      if (response && response.data && response.data.data) {
        const surveyData = response.data.data;
        const paginationData = response.data;
        
        console.log('Setting survey data:', surveyData);
        console.log('Data length:', surveyData.length);
        
        setSurveyResponses(surveyData);
        setTotalPages(paginationData.last_page || 1);
        setTotalItems(paginationData.total || 0);
        setCurrentPage(paginationData.current_page || 1);
        
        // Store all data for suggestions (we'll load all suggestions separately)
        
        console.log('Data set successfully!');
      } else {
        console.error('Unexpected response structure:', response);
        // Don't set empty data immediately - let the user see the error
        showToast({ title: 'Unexpected data format received', type: 'error' });
      }
      
    } catch (error: any) {
      console.error('=== ERROR in loadSurveyResponses ===');
      console.error('Error details:', error);
      showToast({ title: 'Failed to load survey responses', type: 'error' });
      
      // Only set empty data if this is the initial load
      if (!isPagination) {
        setSurveyResponses([]);
        setTotalPages(1);
        setTotalItems(0);
        setCurrentPage(1);
      }
    } finally {
      // Clear loading states
      if (isPagination) {
        setIsLoading(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  };


  const loadStats = async () => {
    try {
      console.log('Loading survey stats...');
      
      const serviceResponse = await customerFeedbackService.getSurveyStats();
      console.log('Stats service response:', serviceResponse);
      
      if (serviceResponse && serviceResponse.data) {
        console.log('Setting stats data:', serviceResponse.data);
        setStats(serviceResponse.data);
      } else {
        console.error('Unexpected stats response structure:', serviceResponse);
        // Set default stats if API fails
        setStats({
          total_responses: 0,
          avg_satisfaction: 0,
          male_count: 0,
          female_count: 0,
          walk_in_count: 0,
          online_count: 0,
          satisfaction_breakdown: {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0,
            very_poor: 0
          },
          monthly_trends: [],
          service_breakdown: [],
          regional_breakdown: []
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      showToast({ title: 'Failed to load statistics', type: 'error' });
      
      // Set default stats on error
      setStats({
        total_responses: 0,
        avg_satisfaction: 0,
        male_count: 0,
        female_count: 0,
        walk_in_count: 0,
        online_count: 0,
        satisfaction_breakdown: {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
          very_poor: 0
        },
        monthly_trends: [],
        service_breakdown: [],
        regional_breakdown: []
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadSurveyResponses(page, itemsPerPage, true);
  };

  const handleRefresh = () => {
    console.log('=== Refresh button clicked ===');
    loadSurveyResponses();
    loadStats();
  };





  const handleViewResponse = (response: SurveyResponse) => {
    setSelectedResponse(response);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedResponse(null);
  };

  const handleExportResponse = (response: SurveyResponse) => {
    // TODO: Implement export functionality
    console.log('Export response:', response);
    showToast({ title: `Exporting response ${response.control_no}`, type: 'info' });
  };


  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Survey Responses</h1>
            <p className="text-xs text-gray-600">View and manage customer feedback submissions</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="btn btn-primary flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Responses</p>
              <p className="text-lg font-bold text-gray-900">{stats?.total_responses || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Avg. Satisfaction</p>
              <p className="text-lg font-bold text-gray-900">{stats?.avg_satisfaction ? (typeof stats.avg_satisfaction === 'string' ? parseFloat(stats.avg_satisfaction).toFixed(1) : stats.avg_satisfaction.toFixed(1)) : '0'}/5</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Walk-in Clients</p>
              <p className="text-lg font-bold text-gray-900">{stats?.walk_in_count || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Online Clients</p>
              <p className="text-lg font-bold text-gray-900">{stats?.online_count || 0}</p>
            </div>
          </div>
        </div>
      </div>


      {/* Survey Response Table */}
      <SurveyResponseTable
        data={surveyResponses}
        onView={handleViewResponse}
        onExport={handleExportResponse}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading && surveyResponses.length === 0}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />


      {/* View Survey Modal */}
      <ViewSurveyModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        surveyResponse={selectedResponse}
      />
    </div>
  );
};

export default SurveyList;
