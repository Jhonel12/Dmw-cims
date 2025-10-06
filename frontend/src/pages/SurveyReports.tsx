import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useToast } from '../contexts/ToastContext';
import { surveyReportsService, type SurveyReportFilters } from '../services/surveyReportsService';
import Calendar from '../components/forms/Calendar';

// Local interface definition to avoid import issues
interface SurveyReport {
  id: number;
  title: string;
  period: string;
  generated_at: string;
  status: 'completed' | 'pending' | 'failed';
  total_responses?: number;
  average_satisfaction?: number;
  filters_applied?: SurveyReportFilters;
  breakdowns?: {
    satisfaction: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
      very_poor: number;
    };
    gender: {
      male: number;
      female: number;
    };
    channel: {
      walk_in: number;
      online: number;
    };
  };
}

// Filter options
const SATISFACTION_OPTIONS = [
  { value: '5', label: 'Excellent (5)' },
  { value: '4', label: 'Good (4)' },
  { value: '3', label: 'Fair (3)' },
  { value: '2', label: 'Poor (2)' },
  { value: '1', label: 'Very Poor (1)' }
];

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
];

const CHANNEL_OPTIONS = [
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'online', label: 'Online' }
];

const PERIOD_OPTIONS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'last_year', label: 'Last Year' }
];

const SurveyReports: React.FC = () => {
  const [reports, setReports] = useState<SurveyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    total_reports: 0,
    total_responses: 0,
    overall_satisfaction: 0,
    completed_reports: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState<SurveyReportFilters>({
    period: 'month',
    date_from: '',
    date_to: '',
    satisfaction_level: '',
    sex: '',
    client_channel: '',
    client_type: ''
  });
  
  const { showToast } = useToast();

  // Select styles for react-select
  const selectStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: '38px',
      fontSize: '14px',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      fontSize: '14px',
    }),
  };

  // Load report data with current filters
  const loadReportDataWithFilters = async (filtersToUse: SurveyReportFilters) => {
    setIsLoading(true);
    try {
      const reportsData = await surveyReportsService.getReports(filtersToUse.period, filtersToUse);
      
      // Always use the filtered reports data - don't fall back to recent_reports
      // This ensures filtering works properly
      const filteredReports = reportsData.reports || [];
      setReports(filteredReports);
      
      // Calculate statistics from the filtered reports data
      if (filteredReports.length > 0) {
        const report = filteredReports[0]; // Get the first (and likely only) report
        setStatistics({
          total_reports: filteredReports.length,
          total_responses: report.total_responses || 0,
          overall_satisfaction: report.average_satisfaction || 0,
          completed_reports: filteredReports.filter(r => r.status === 'completed').length
        });
      } else {
        // No filtered results - show zeros
        setStatistics({
          total_reports: 0,
          total_responses: 0,
          overall_satisfaction: 0,
          completed_reports: 0
        });
      }
      } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load reports'
      });
      console.error('Error fetching data:', error);
      
      // Reset to default values on error
      setStatistics({
        total_reports: 0,
        total_responses: 0,
        overall_satisfaction: 0,
        completed_reports: 0
      });
      } finally {
        setIsLoading(false);
      }
    };

  // Load report data with current filters
  const loadReportData = async () => {
    await loadReportDataWithFilters(filters);
  };

  useEffect(() => {
    // Only load data on component mount, not on filter changes
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        // Use the same logic as filtered data loading for consistency
        await loadReportDataWithFilters({
          period: 'month',
          date_from: '',
          date_to: '',
          satisfaction_level: '',
          sex: '',
          client_channel: '',
          client_type: ''
        });
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Only run on mount

  // Filter update functions
  const updateFilter = (key: keyof SurveyReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    console.log('Filter values being sent:', {
      period: filters.period,
      date_from: filters.date_from,
      date_to: filters.date_to,
      satisfaction_level: filters.satisfaction_level,
      sex: filters.sex,
      client_channel: filters.client_channel,
      client_type: filters.client_type
    });
    loadReportData();
  };

  const clearFilters = () => {
    const clearedFilters = {
      period: 'month',
      date_from: '',
      date_to: '',
      satisfaction_level: '',
      sex: '',
      client_channel: '',
      client_type: ''
    };
    setFilters(clearedFilters);
    // Load data with cleared filters
    loadReportDataWithFilters(clearedFilters);
  };


  const handleDownloadReport = async (reportId: number) => {
    try {
      showToast({
        type: 'info',
        title: 'Downloading',
        message: `Downloading report ${reportId}...`
      });
      
      const downloadData = await surveyReportsService.downloadReport(reportId.toString(), {
        format: 'csv',
        period: filters.period as 'week' | 'month' | 'quarter' | 'year'
      });
      
      if (downloadData.csv_data) {
        await surveyReportsService.downloadCSV(downloadData.csv_data, downloadData.filename);
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Report downloaded successfully!'
        });
      } else if (downloadData.download_url) {
        await surveyReportsService.downloadFromUrl(downloadData.download_url, downloadData.filename);
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Report downloaded successfully!'
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to download report'
      });
      console.error('Error downloading report:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsLoading(true);
    try {
      let blob: Blob;
      let filename: string;
      
      // Use current filter state for export
      const currentFilters = {
        period: filters.period,
        date_from: filters.date_from,
        date_to: filters.date_to,
        satisfaction_level: filters.satisfaction_level,
        sex: filters.sex,
        client_channel: filters.client_channel,
        client_type: filters.client_type
      };
      
      if (format === 'csv') {
        blob = await surveyReportsService.exportToCsv(currentFilters);
        filename = `survey-report-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        blob = await surveyReportsService.exportToPdf(currentFilters);
        filename = `survey-report-${new Date().toISOString().split('T')[0]}.pdf`;
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

      const formatName = format === 'csv' ? 'CSV' : 'PDF';
      showToast({
        type: 'success',
        title: 'Success',
        message: `${formatName} export completed successfully!`
      });
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      showToast({
        type: 'error',
        title: 'Export Error',
        message: `Failed to export ${format.toUpperCase()}. Please try again.`
      });
    } finally {
      setIsLoading(false);
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

  // Validate date range
  const isDateRangeValid = () => {
    if (!filters.date_from || !filters.date_to) return true;
    return new Date(filters.date_from) <= new Date(filters.date_to);
  };

  // Get date validation error message
  const getDateValidationError = () => {
    if (!filters.date_from || !filters.date_to) return null;
    if (new Date(filters.date_from) > new Date(filters.date_to)) {
      return 'End date must be on or after start date';
    }
    return null;
  };


  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Survey Reports & Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600">Comprehensive insights into survey responses and analytics</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handleExport('csv')}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <Select
              value={PERIOD_OPTIONS.find(option => option.value === filters.period)}
              onChange={(selected) => updateFilter('period', selected?.value || 'month')}
              options={PERIOD_OPTIONS}
              styles={selectStyles}
              placeholder="Select period"
              isClearable={false}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
            <Calendar
              value={filters.date_from}
              onChange={(date) => {
                updateFilter('date_from', date);
                // If date_to is before the new date_from, clear it
                if (filters.date_to && date && filters.date_to < date) {
                  updateFilter('date_to', '');
                }
              }}
              placeholder="Select start date"
              maxDate={filters.date_to || undefined}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
            <Calendar
              value={filters.date_to}
              onChange={(date) => updateFilter('date_to', date)}
              placeholder="Select end date"
              minDate={filters.date_from || undefined}
            />
            {getDateValidationError() && (
              <p className="text-xs text-red-600 mt-1">{getDateValidationError()}</p>
            )}
          </div>

          {/* Satisfaction Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Satisfaction Level</label>
            <Select
              value={SATISFACTION_OPTIONS.find(option => option.value === filters.satisfaction_level)}
              onChange={(selected) => updateFilter('satisfaction_level', selected?.value || '')}
              options={SATISFACTION_OPTIONS}
              styles={selectStyles}
              placeholder="All levels"
              isClearable={true}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <Select
              value={GENDER_OPTIONS.find(option => option.value === filters.sex)}
              onChange={(selected) => updateFilter('sex', selected?.value || '')}
              options={GENDER_OPTIONS}
              styles={selectStyles}
              placeholder="All genders"
              isClearable={true}
            />
          </div>

          {/* Channel */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client Channel</label>
            <Select
              value={CHANNEL_OPTIONS.find(option => option.value === filters.client_channel)}
              onChange={(selected) => updateFilter('client_channel', selected?.value || '')}
              options={CHANNEL_OPTIONS}
              styles={selectStyles}
              placeholder="All channels"
              isClearable={true}
            />
          </div>
        </div>
        
        {/* Filter Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={clearFilters}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
          <button 
            onClick={handleApplyFilters}
            disabled={isLoading || !isDateRangeValid()}
            className="btn btn-primary"
          >
            {isLoading ? 'Filtering...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="card-elevated p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="stat-card group p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">{statistics.total_reports || 0}</div>
            <div className="text-xs font-medium text-gray-600">Total Reports</div>
          </div>

          <div className="stat-card group p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">{statistics.total_responses || 0}</div>
            <div className="text-xs font-medium text-gray-600">Total Responses</div>
          </div>

          <div className="stat-card group p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">{(statistics.overall_satisfaction || 0).toFixed(1)}</div>
            <div className="text-xs font-medium text-gray-600">Avg. Satisfaction</div>
          </div>

          <div className="stat-card group p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">{statistics.completed_reports || 0}</div>
            <div className="text-xs font-medium text-gray-600">Completed Reports</div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="card-elevated p-3 sm:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports && reports.length > 0 ? reports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.title}</h3>
                <p className="text-sm text-gray-600">{report.period}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                report.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {report.status}
              </span>
            </div>
            
            {/* Basic Stats */}
            <div className="space-y-2 mb-4">
              {report.total_responses !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Responses:</span>
                  <span className="font-medium text-gray-900">{report.total_responses}</span>
                </div>
              )}
              {report.average_satisfaction !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg. Satisfaction:</span>
                  <span className="font-medium text-gray-900">{report.average_satisfaction}/5</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Generated:</span>
                <span className="font-medium text-gray-900">{formatDate(report.generated_at)}</span>
              </div>
            </div>

            {/* Detailed Breakdowns */}
            {report.breakdowns && (
              <div className="space-y-3 mb-4">
                {/* Satisfaction Breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Satisfaction Breakdown</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Excellent (5):</span>
                      <span className="font-medium text-green-600">{report.breakdowns.satisfaction.excellent}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Good (4):</span>
                      <span className="font-medium text-blue-600">{report.breakdowns.satisfaction.good}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Fair (3):</span>
                      <span className="font-medium text-yellow-600">{report.breakdowns.satisfaction.fair}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Poor (2):</span>
                      <span className="font-medium text-orange-600">{report.breakdowns.satisfaction.poor}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Very Poor (1):</span>
                      <span className="font-medium text-red-600">{report.breakdowns.satisfaction.very_poor}</span>
                    </div>
                  </div>
                </div>

                {/* Gender & Channel Distribution */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Gender</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Male:</span>
                        <span className="font-medium text-blue-600">{report.breakdowns.gender.male}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Female:</span>
                        <span className="font-medium text-pink-600">{report.breakdowns.gender.female}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Channel</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Walk-in:</span>
                        <span className="font-medium text-purple-600">{report.breakdowns.channel.walk_in}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Online:</span>
                        <span className="font-medium text-indigo-600">{report.breakdowns.channel.online}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Applied Filters */}
            {report.filters_applied && Object.values(report.filters_applied).some(value => value) && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Applied Filters</h4>
                <div className="flex flex-wrap gap-1">
                  {report.filters_applied.satisfaction_level && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Satisfaction: {SATISFACTION_OPTIONS.find(opt => opt.value === report.filters_applied?.satisfaction_level)?.label}
                    </span>
                  )}
                  {report.filters_applied.sex && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Gender: {report.filters_applied.sex}
                    </span>
                  )}
                  {report.filters_applied.client_channel && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      Channel: {CHANNEL_OPTIONS.find(opt => opt.value === report.filters_applied?.client_channel)?.label}
                    </span>
                  )}
                  {report.filters_applied.date_from && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      From: {new Date(report.filters_applied.date_from).toLocaleDateString()}
                    </span>
                  )}
                  {report.filters_applied.date_to && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      To: {new Date(report.filters_applied.date_to).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleDownloadReport(report.id)}
                className="flex-1 btn btn-ghost text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
              <button className="btn btn-ghost text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
      </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  No survey reports match your current filters. Try adjusting your filter criteria or generate a new report with the current settings.
                </p>
                
                {/* Current Filter Summary */}
                {Object.values(filters).some(value => value && value !== 'month') && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Current Filters:</h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {filters.period && filters.period !== 'month' && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Period: {PERIOD_OPTIONS.find(opt => opt.value === filters.period)?.label}
                        </span>
                      )}
                      {filters.satisfaction_level && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Satisfaction: {SATISFACTION_OPTIONS.find(opt => opt.value === filters.satisfaction_level)?.label}
                        </span>
                      )}
                      {filters.sex && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          Gender: {filters.sex}
                        </span>
                      )}
                      {filters.client_channel && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Channel: {CHANNEL_OPTIONS.find(opt => opt.value === filters.client_channel)?.label}
                        </span>
                      )}
                      {filters.date_from && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                          From: {new Date(filters.date_from).toLocaleDateString()}
                        </span>
                      )}
                      {filters.date_to && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                          To: {new Date(filters.date_to).toLocaleDateString()}
                        </span>
                      )}
          </div>
            </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => handleExport('csv')}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                  <button 
                    onClick={() => handleExport('pdf')}
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Export PDF
                  </button>
                  <button 
                    onClick={clearFilters}
                    className="btn btn-ghost"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Clear Filters
                  </button>
            </div>
          </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SurveyReports;
