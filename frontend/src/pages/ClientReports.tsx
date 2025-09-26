import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useToast } from '../contexts/ToastContext';
import { clientService } from '../services/clientService';
import type { Client } from '../services/clientService';
import Calendar from '../components/forms/Calendar';

// Civil status options
const CIVIL_STATUS_OPTIONS = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Separated', label: 'Separated' }
];

// Sex options
const SEX_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
];

// Social classification options
const SOCIAL_CLASSIFICATION_OPTIONS = [
  { value: 'Abled', label: 'Abled' },
  { value: 'Differently Abled', label: 'Differently Abled' },
  { value: 'Migrant Workers', label: 'Migrant Workers' },

  { value: '4Ps Beneficiary', label: '4Ps Beneficiary' },
  { value: 'OFW', label: 'OFW' },
  { value: 'Indigenous People', label: 'Indigenous People' },
  { value: 'Senior Citizen', label: 'Senior Citizen' },
  { value: 'Youth', label: 'Youth' },
  { value: 'Solo Parent', label: 'Solo Parent' },
  { value: 'Others', label: 'Others' }
];

// Reports data interface
interface ClientReportData {
  totalClients: number;
  verifiedClients: number;
  unverifiedClients: number;
  ofwClients: number;
  trashedClients: number;
  civilStatusDistribution: Record<string, number>;
  genderDistribution: { male: number; female: number };
  socialClassificationDistribution: Record<string, number>;
  recentClients: Client[];
}

interface ClientReportFilters {
  dateFrom: string;
  dateTo: string;
  sex: string;
  civilStatus: string;
  socialClassification: string;
  place: string;
}

const ClientReports: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ClientReportData | null>(null);
  const [filters, setFilters] = useState<ClientReportFilters>({
    dateFrom: '',
    dateTo: '',
    sex: '',
    civilStatus: '',
    socialClassification: '',
    place: ''
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'demographics' | 'classifications'>('overview');

  // Select styles to match OFW Reports
  const selectStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: '48px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#9ca3af',
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '14px',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#374151',
      fontSize: '14px',
    }),
  };

  // Load report data with current filters
  const loadReportDataWithFilters = async (filtersToUse: ClientReportFilters) => {
    setIsLoading(true);
    try {
      console.log('Loading client report data with filters:', filtersToUse);
      
      // Build query parameters based on filters
      const queryParams: any = {
        per_page: 1000, // Get all clients for analysis
        page: 1
      };

      // Apply filters
      if (filtersToUse.sex) {
        queryParams.sex = filtersToUse.sex;
      }
      if (filtersToUse.civilStatus) {
        queryParams.civil_status = filtersToUse.civilStatus;
      }
      if (filtersToUse.socialClassification) {
        queryParams.social_classification = filtersToUse.socialClassification;
      }
      if (filtersToUse.place) {
        queryParams.place = filtersToUse.place;
      }
      if (filtersToUse.dateFrom) {
        queryParams.date_from = filtersToUse.dateFrom;
      }
      if (filtersToUse.dateTo) {
        queryParams.date_to = filtersToUse.dateTo;
      }

      // Get filtered clients
      const clientsResponse = await clientService.getClients(queryParams);
      const filteredClients = clientsResponse.data.data;

      // Get total statistics (unfiltered) for comparison
      const statsResponse = await clientService.getClientStats();
      const stats = statsResponse.data;

      // Calculate filtered statistics
      const filteredTotal = filteredClients.length;
      const filteredVerified = filteredClients.filter(client => client.has_national_id).length;
      const filteredUnverified = filteredClients.filter(client => !client.has_national_id).length;
      const filteredOfw = filteredClients.filter(client => 
        Array.isArray(client.social_classification) && 
        client.social_classification.includes('OFW')
      ).length;

      // Process data for reports
      const processedData: ClientReportData = {
        totalClients: filteredTotal,
        verifiedClients: filteredVerified,
        unverifiedClients: filteredUnverified,
        ofwClients: filteredOfw,
        trashedClients: stats.trashed_clients, // Keep original trashed count
        civilStatusDistribution: {},
        genderDistribution: { male: 0, female: 0 },
        socialClassificationDistribution: {},
        recentClients: filteredClients.slice(0, 10) // Show first 10 filtered clients
      };

      // Calculate distributions from filtered data
      filteredClients.forEach(client => {
        // Gender distribution
        if (client.sex === 'Male') {
          processedData.genderDistribution.male++;
        } else if (client.sex === 'Female') {
          processedData.genderDistribution.female++;
        }

        // Civil status distribution
        processedData.civilStatusDistribution[client.civil_status] = 
          (processedData.civilStatusDistribution[client.civil_status] || 0) + 1;

        // Social classification distribution
        if (Array.isArray(client.social_classification)) {
          client.social_classification.forEach(classification => {
            processedData.socialClassificationDistribution[classification] = 
              (processedData.socialClassificationDistribution[classification] || 0) + 1;
          });
        }

      });

      setReportData(processedData);
    } catch (error) {
      console.error('Error loading client report data:', error);
      showError('Error', 'Failed to load client report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load report data with current filters
  const loadReportData = async () => {
    await loadReportDataWithFilters(filters);
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await loadReportData();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Load initial data on mount


  const handleFilterChange = (field: keyof ClientReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    loadReportData();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      sex: '',
      civilStatus: '',
      socialClassification: '',
      place: ''
    };
    setFilters(clearedFilters);
    // Load data with empty filters (shows all data)
    loadReportDataWithFilters(clearedFilters);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsLoading(true);
    try {
      let blob: Blob;
      let filename: string;
      
      // Use current filter state for export
      const currentFilters = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sex: filters.sex,
        civilStatus: filters.civilStatus,
        socialClassification: filters.socialClassification,
        place: filters.place
      };
      
      if (format === 'excel') {
        // Use the new CSV export functionality
        blob = await clientService.exportToExcel(currentFilters);
        filename = `client-report-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        // Use the new PDF export functionality
        blob = await clientService.exportToPdf(currentFilters);
        filename = `client-report-${new Date().toISOString().split('T')[0]}.pdf`;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const formatName = format === 'excel' ? 'CSV' : 'PDF';
      showSuccess('Success', `${formatName} export completed successfully!`);
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      showError('Export Error', `Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };


  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Client Reports & Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600">Comprehensive insights into client profiles and demographics</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleExport('excel')}
              disabled={isLoading}
              className="btn btn-secondary flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isLoading ? 'Exporting...' : 'Export CSV'}</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isLoading}
              className="btn btn-primary flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isLoading ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated p-3 sm:p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Filter Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <Calendar
              label="From Date"
              value={filters.dateFrom}
              onChange={(date) => handleFilterChange('dateFrom', date)}
              placeholder="Select start date"
              maxDate={filters.dateTo || undefined}
            />
          </div>
          <div>
            <Calendar
              label="To Date"
              value={filters.dateTo}
              onChange={(date) => handleFilterChange('dateTo', date)}
              placeholder="Select end date"
              minDate={filters.dateFrom || undefined}
            />
          </div>
          <div>
            <label className="form-label">Sex</label>
            <Select
              value={SEX_OPTIONS.find(option => option.value === filters.sex) || null}
              onChange={(selectedOption: any) => handleFilterChange('sex', selectedOption?.value || '')}
              options={SEX_OPTIONS}
              placeholder="All Sex"
              styles={selectStyles}
              isClearable
            />
          </div>
          <div>
            <label className="form-label">Civil Status</label>
            <Select
              value={CIVIL_STATUS_OPTIONS.find(option => option.value === filters.civilStatus) || null}
              onChange={(selectedOption: any) => handleFilterChange('civilStatus', selectedOption?.value || '')}
              options={CIVIL_STATUS_OPTIONS}
              placeholder="All Civil Status"
              styles={selectStyles}
              isClearable
            />
          </div>
          <div>
            <label className="form-label">Social Classification</label>
            <Select
              value={SOCIAL_CLASSIFICATION_OPTIONS.find(option => option.value === filters.socialClassification) || null}
              onChange={(selectedOption: any) => handleFilterChange('socialClassification', selectedOption?.value || '')}
              options={SOCIAL_CLASSIFICATION_OPTIONS}
              placeholder="All Classifications"
              styles={selectStyles}
              isClearable
            />
          </div>
          <div>
            <label className="form-label">Place</label>
            <input
              type="text"
              value={filters.place}
              onChange={(e) => handleFilterChange('place', e.target.value)}
              placeholder="Search by city, province, barangay, street..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        
        {/* Filter Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleClearFilters}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
          <button
            onClick={handleApplyFilters}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Filtering...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="border-b border-gray-200/60">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'demographics', label: 'Demographics', icon: '👥' },
              { id: 'classifications', label: 'Classifications', icon: '🏷️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-base ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Report Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
                <div className="stat-card group p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatNumber(reportData?.totalClients || 0)}</div>
                  <div className="text-xs font-medium text-gray-600">Total Clients</div>
                </div>

                <div className="stat-card group p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatNumber(reportData?.verifiedClients || 0)}</div>
                  <div className="text-xs font-medium text-gray-600">Verified Clients</div>
                </div>

                <div className="stat-card group p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatNumber(reportData?.unverifiedClients || 0)}</div>
                  <div className="text-xs font-medium text-gray-600">Unverified Clients</div>
                </div>

                <div className="stat-card group p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatNumber(reportData?.ofwClients || 0)}</div>
                  <div className="text-xs font-medium text-gray-600">OFW Clients</div>
                </div>

                <div className="stat-card group p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatNumber(reportData?.trashedClients || 0)}</div>
                  <div className="text-xs font-medium text-gray-600">Trashed Clients</div>
                </div>
              </div>

              {/* Gender Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card-elevated p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Gender Distribution</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-base font-medium text-gray-700">Male</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{formatNumber(reportData?.genderDistribution?.male || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-pink-500 rounded-full mr-3"></div>
                        <span className="text-base font-medium text-gray-700">Female</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{formatNumber(reportData?.genderDistribution?.female || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="card-elevated p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
                  <div className="text-base text-gray-600">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <p>Current month: {getCurrentMonth()}</p>
                    <p>Total clients: {formatNumber(reportData?.totalClients || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Demographics Tab */}
          {activeTab === 'demographics' && (
            <div className="card-elevated">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Recent Clients</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Sex</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Civil Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Age</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(reportData?.recentClients || []).map((client) => (
                      <tr key={client.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                          {`${client.first_name} ${client.middle_name ? client.middle_name + ' ' : ''}${client.last_name}${client.suffix ? ' ' + client.suffix : ''}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                          {client.sex}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                          {client.civil_status}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                          {client.age}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                          {new Date(client.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* Classifications Tab */}
          {activeTab === 'classifications' && (
            <div className="card-elevated p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Clients by Social Classification</h3>
              <div className="space-y-4">
                {Object.entries(reportData?.socialClassificationDistribution || {})
                  .sort(([,a], [,b]) => b - a)
                  .map(([classification, count]) => (
                    <div key={classification} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-base font-medium text-gray-900">{classification}</span>
                      <span className="text-lg font-bold text-green-600">{formatNumber(count)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientReports;
