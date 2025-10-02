import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

const SurveyAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState({
    totalResponses: 0,
    averageSatisfaction: 0,
    maleCount: 0,
    femaleCount: 0,
    walkInCount: 0,
    onlineCount: 0,
    satisfactionBreakdown: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      veryPoor: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock analytics data
        setAnalytics({
          totalResponses: 156,
          averageSatisfaction: 4.2,
          maleCount: 89,
          femaleCount: 67,
          walkInCount: 98,
          onlineCount: 58,
          satisfactionBreakdown: {
            excellent: 45,
            good: 67,
            fair: 32,
            poor: 10,
            veryPoor: 2
          }
        });
      } catch (error) {
        showToast('Failed to load analytics data', 'error');
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [showToast]);

  const StatCard = ({ title, value, icon, color = 'blue' }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Survey Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">Loading analytics data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Survey Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Insights and trends from customer feedback
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-ghost text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Responses"
          value={analytics.totalResponses}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="Average Satisfaction"
          value={analytics.averageSatisfaction.toFixed(1)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          color="yellow"
        />
        <StatCard
          title="Walk-in Clients"
          value={analytics.walkInCount}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Online Clients"
          value={analytics.onlineCount}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          color="purple"
        />
      </div>

      {/* Satisfaction Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Satisfaction Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Excellent (5)', count: analytics.satisfactionBreakdown.excellent, color: 'green' },
              { label: 'Good (4)', count: analytics.satisfactionBreakdown.good, color: 'blue' },
              { label: 'Fair (3)', count: analytics.satisfactionBreakdown.fair, color: 'yellow' },
              { label: 'Poor (2)', count: analytics.satisfactionBreakdown.poor, color: 'orange' },
              { label: 'Very Poor (1)', count: analytics.satisfactionBreakdown.veryPoor, color: 'red' }
            ].map((item) => {
              const percentage = analytics.totalResponses > 0 
                ? (item.count / analytics.totalResponses * 100).toFixed(1) 
                : '0';
              
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${item.color}-500 h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                    <span className="text-xs text-gray-500 w-8">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Male</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{analytics.maleCount}</span>
                <span className="text-xs text-gray-500">
                  ({analytics.totalResponses > 0 ? (analytics.maleCount / analytics.totalResponses * 100).toFixed(1) : '0'}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Female</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{analytics.femaleCount}</span>
                <span className="text-xs text-gray-500">
                  ({analytics.totalResponses > 0 ? (analytics.femaleCount / analytics.totalResponses * 100).toFixed(1) : '0'}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyAnalytics;
