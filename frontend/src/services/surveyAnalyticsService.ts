import apiClient from './api-client';

// Type definitions
export interface SurveyAnalytics {
  totalResponses: number;
  averageSatisfaction: number;
  maleCount: number;
  femaleCount: number;
  walkInCount: number;
  onlineCount: number;
  satisfactionBreakdown: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    veryPoor: number;
  };
  genderBreakdown?: {
    male: number;
    female: number;
  };
  channelBreakdown?: {
    walk_in: number;
    online: number;
  };
  lastUpdated?: string;
}

export interface SatisfactionByService {
  service_availed: string;
  avg_satisfaction: number;
  total_responses: number;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  very_poor: number;
}

export interface SatisfactionTrend {
  date: string;
  avg_satisfaction: number;
  total_responses: number;
}

export interface RegionalAnalytics {
  region: string;
  total_responses: number;
  avg_satisfaction: number;
  male_count: number;
  female_count: number;
  walk_in_count: number;
  online_count: number;
}

export interface ExportOptions {
  type?: 'summary' | 'detailed' | 'regional';
  format?: 'csv' | 'json';
}

// Service class
class SurveyAnalyticsService {
  /**
   * Get main analytics data
   */
  async getAnalytics(): Promise<SurveyAnalytics> {
    try {
      const response = await apiClient.get<SurveyAnalytics>('/survey-analytics');
      return response;
    } catch (error) {
      console.error('Error fetching survey analytics:', error);
      throw error;
    }
  }

  /**
   * Get satisfaction breakdown by service type
   */
  async getSatisfactionByService(): Promise<{ satisfactionByService: SatisfactionByService[] }> {
    try {
      const response = await apiClient.get<{ satisfactionByService: SatisfactionByService[] }>('/survey-analytics/satisfaction-by-service');
      return response;
    } catch (error) {
      console.error('Error fetching satisfaction by service:', error);
      throw error;
    }
  }

  /**
   * Get satisfaction trends over time
   */
  async getSatisfactionTrends(params?: {
    period?: 'day' | 'week' | 'month';
    days?: number;
  }): Promise<{ satisfactionTrends: SatisfactionTrend[] }> {
    try {
      const response = await apiClient.get<{ satisfactionTrends: SatisfactionTrend[] }>('/survey-analytics/trends', { params });
      return response;
    } catch (error) {
      console.error('Error fetching satisfaction trends:', error);
      throw error;
    }
  }

  /**
   * Get regional analytics
   */
  async getRegionalAnalytics(): Promise<{ regionalAnalytics: RegionalAnalytics[] }> {
    try {
      const response = await apiClient.get<{ regionalAnalytics: RegionalAnalytics[] }>('/survey-analytics/regional');
      return response;
    } catch (error) {
      console.error('Error fetching regional analytics:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(options: ExportOptions = {}): Promise<any> {
    try {
      const response = await apiClient.post('/survey-analytics/export', options);
      return response;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  /**
   * Download CSV file
   */
  async downloadCSV(data: any[], filename: string): Promise<void> {
    try {
      // Convert data to CSV format
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      throw error;
    }
  }
}

// Export the service instance
export const surveyAnalyticsService = new SurveyAnalyticsService();