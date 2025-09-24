import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useToast } from '../contexts/ToastContext';
import ofwService from '../services/OFWService';
import Calendar from '../components/forms/Calendar';
import CountrySelect from '../components/ui/CountrySelect';
import { useCountries } from '../hooks/useCountries';
import { POSITIONS as POSITION_OPTIONS } from '../constants/positions';
import type { OFW } from '../types/ofw';

// Sex options to match OFWForm
const SEX_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
];

// Reports data interface
interface ReportsData {
  totalRecords: number;
  totalDepartures: number;
  countries: Record<string, number>;
  positions: Record<string, number>;
  monthlyData: Record<string, number>;
  genderDistribution: { male: number; female: number };
  recentDepartures: OFW[];
}

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  country: string;
  sex: string;
  position: string;
}

interface ReportData {
  totalRecords: number;
  totalDepartures: number;
  countries: { [key: string]: number };
  positions: { [key: string]: number };
  monthlyData: { [key: string]: number };
  genderDistribution: { male: number; female: number };
  recentDepartures: OFW[];
}

const Reports: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const { countries, isLoading: countriesLoading } = useCountries();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: '',
    dateTo: '',
    country: '',
    sex: '',
    position: ''
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'departures' | 'countries' | 'positions'>('overview');

  // Select styles to match OFWForm
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
  const loadReportData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading report data with filters:', filters);
      
      // Try the new filtered reports API first
      try {
        const filteredData = await ofwService.getFilteredReports(filters);
        console.log('Filtered reports data received:', filteredData);

        // Process data for reports - cast to ReportsData since the API returns the correct structure
        const processedData: ReportData = filteredData as unknown as ReportsData;

        setReportData(processedData);
        return;
      } catch (filteredError) {
        console.warn('Filtered reports API failed, falling back to basic statistics:', filteredError);
        
        // Fallback to basic statistics if filtered reports fail
        const [statistics, recentDepartures] = await Promise.all([
          ofwService.getStatistics(),
          ofwService.getRecentDepartures()
        ]);

        // Process data for reports - convert from OFWStatistics to ReportsData format
        const processedData: ReportData = {
          totalRecords: statistics.total_records,
          totalDepartures: statistics.recent_departures + statistics.upcoming_departures,
          countries: statistics.by_country.reduce((acc, item) => {
            acc[item.countryDestination] = item.count;
            return acc;
          }, {} as Record<string, number>),
          positions: {}, // Not available in basic statistics
          monthlyData: {}, // Not available in basic statistics
          genderDistribution: {
            male: statistics.by_gender.find(g => g.sex === 'Male')?.count || 0,
            female: statistics.by_gender.find(g => g.sex === 'Female')?.count || 0
          },
          recentDepartures: Array.isArray(recentDepartures) ? recentDepartures : []
        };

        setReportData(processedData);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      showError('Error', 'Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load data on component mount, not on filter changes
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
  }, []);

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
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
    setFilters({
      dateFrom: '',
      dateTo: '',
      country: '',
      sex: '',
      position: ''
    });
    // Load data with empty filters (shows all data)
    loadReportData();
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
        country: filters.country,
        sex: filters.sex,
        position: filters.position
      };
      
      if (format === 'excel') {
        blob = await ofwService.exportToExcel(currentFilters);
        filename = `ofw-reports-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        blob = await ofwService.exportToPdf(currentFilters);
        filename = `ofw-reports-${new Date().toISOString().split('T')[0]}.pdf`;
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Reports & Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600">Comprehensive insights into OFW records and departures</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <label className="form-label">Country</label>
              <CountrySelect
                value={countries.find(option => option.label === filters.country) || null}
                onChange={(selectedOption) => handleFilterChange('country', selectedOption?.label || '')}
                options={countries}
                placeholder="All Countries"
                styles={selectStyles}
                isSearchable
                isClearable
                isLoading={countriesLoading}
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
              <label className="form-label">Position</label>
              <Select
                value={POSITION_OPTIONS.find(option => option.value === filters.position) || null}
                onChange={(selectedOption: any) => handleFilterChange('position', selectedOption?.value || '')}
                options={POSITION_OPTIONS}
                placeholder="All Positions"
                styles={selectStyles}
                isSearchable
                isClearable
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
              { id: 'departures', label: 'Departures', icon: '✈️' },
              { id: 'countries', label: 'Countries', icon: '🌍' },
              { id: 'positions', label: 'Positions', icon: '💼' }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  <div className="stat-card group p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{formatNumber(reportData?.totalRecords || 0)}</div>
                    <div className="text-xs font-medium text-gray-600">Total Records</div>
                  </div>

                  <div className="stat-card group p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{formatNumber(reportData?.totalDepartures || 0)}</div>
                    <div className="text-xs font-medium text-gray-600">Total Departures</div>
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
                    <div className="text-lg font-bold text-gray-900">{Object.keys(reportData?.countries || {}).length}</div>
                    <div className="text-xs font-medium text-gray-600">Countries</div>
                  </div>

                  <div className="stat-card group p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{Object.keys(reportData?.positions || {}).length}</div>
                    <div className="text-xs font-medium text-gray-600">Positions</div>
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
                      <p>Records this month: {formatNumber(reportData?.monthlyData?.[new Date().toISOString().slice(0, 7)] || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Departures Tab */}
            {activeTab === 'departures' && (
              <div className="card-elevated">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Recent Departures</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Country</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Departure Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">OEC Number</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(reportData?.recentDepartures || []).map((ofw) => (
                        <tr key={ofw.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                            {ofw.nameOfWorker}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                            {ofw.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                            {ofw.countryDestination}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                            {new Date(ofw.departureDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                            {ofw.oecNumber}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Countries Tab */}
            {activeTab === 'countries' && (
              <div className="card-elevated p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Departures by Country</h3>
                <div className="space-y-4">
                  {Object.entries(reportData?.countries || {})
                    .sort(([,a], [,b]) => b - a)
                    .map(([countryName, count]) => {
                      const country = countries.find(c => c.label === countryName);
                      return (
                        <div key={countryName} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {country && country.flag ? (
                              <>
                                <img 
                                  src={country.flag} 
                                  alt={`${countryName} flag`}
                                  className="w-6 h-4 object-cover rounded-sm"
                                />
                                <span className="font-medium text-gray-900">{countryName}</span>
                              </>
                            ) : (
                              <span className="font-medium text-gray-900">{countryName}</span>
                            )}
                          </div>
                          <span className="text-lg font-bold text-blue-600">{formatNumber(count)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Positions Tab */}
            {activeTab === 'positions' && (
              <div className="card-elevated p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Departures by Position</h3>
                <div className="space-y-4">
                  {Object.entries(reportData?.positions || {})
                    .sort(([,a], [,b]) => b - a)
                    .map(([position, count]) => (
                      <div key={position} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-base font-medium text-gray-900">{position}</span>
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

export default Reports;
