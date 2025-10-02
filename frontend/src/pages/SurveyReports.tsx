import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

const SurveyReports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock reports data
        setReports([
          {
            id: 1,
            title: 'Monthly Survey Summary',
            period: 'December 2024',
            totalResponses: 156,
            averageSatisfaction: 4.2,
            generatedAt: '2024-12-25T10:00:00Z',
            status: 'completed'
          },
          {
            id: 2,
            title: 'Quarterly Analytics Report',
            period: 'Q4 2024',
            totalResponses: 423,
            averageSatisfaction: 4.1,
            generatedAt: '2024-12-20T14:30:00Z',
            status: 'completed'
          },
          {
            id: 3,
            title: 'Annual Survey Report',
            period: '2024',
            totalResponses: 1247,
            averageSatisfaction: 4.0,
            generatedAt: '2024-12-15T09:15:00Z',
            status: 'completed'
          }
        ]);
      } catch (error) {
        showToast('Failed to load reports', 'error');
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [showToast]);

  const handleGenerateReport = () => {
    showToast('Generating new report...', 'info');
    // TODO: Implement report generation
  };

  const handleDownloadReport = (reportId: number) => {
    showToast(`Downloading report ${reportId}...`, 'info');
    // TODO: Implement report download
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Survey Reports</h1>
            <p className="text-sm text-gray-600 mt-1">Loading reports...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Reports</h1>
          <p className="text-sm text-gray-600 mt-1">
            Generate and download survey analytics reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button 
            onClick={handleGenerateReport}
            className="btn btn-primary text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Generate Report
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
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
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Responses:</span>
                <span className="font-medium text-gray-900">{report.totalResponses}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg. Satisfaction:</span>
                <span className="font-medium text-gray-900">{report.averageSatisfaction}/5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Generated:</span>
                <span className="font-medium text-gray-900">{formatDate(report.generatedAt)}</span>
              </div>
            </div>
            
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
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {reports.reduce((sum, report) => sum + report.totalResponses, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Responses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {(reports.reduce((sum, report) => sum + report.averageSatisfaction, 0) / reports.length).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Overall Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {reports.filter(r => r.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed Reports</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyReports;
