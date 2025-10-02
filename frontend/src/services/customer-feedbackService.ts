import apiClient from './api-client';

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

export interface SurveyStats {
  total_responses: number;
  avg_satisfaction: number;
  male_count: number;
  female_count: number;
  walk_in_count: number;
  online_count: number;
  satisfaction_breakdown: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    very_poor: number;
  };
  monthly_trends: {
    month: string;
    count: number;
    avg_satisfaction: number;
  }[];
  service_breakdown: {
    service: string;
    count: number;
    avg_satisfaction: number;
  }[];
  regional_breakdown: {
    region: string;
    count: number;
    avg_satisfaction: number;
  }[];
}

export interface SurveyFilters {
  search?: string;
  client_channel?: 'walk-in' | 'online';
  sex?: 'Male' | 'Female';
  region?: string;
  service_availed?: string;
  satisfaction_min?: number;
  satisfaction_max?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'control_no' | 'sqd0' | 'client_channel';
  sort_direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface SurveyResponseData {
  data: SurveyResponse[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface SurveyReport {
  id: number;
  title: string;
  period: string;
  total_responses: number;
  average_satisfaction: number;
  generated_at: string;
  status: 'completed' | 'generating' | 'failed';
  file_path?: string;
}

class CustomerFeedbackService {
  private baseUrl = '/customer-feedback';

  /**
   * Get all survey responses with optional filtering and pagination
   */
  async getSurveyResponses(filters: SurveyFilters = {}): Promise<{ data: SurveyResponseData }> {
    try {
      const params = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<{ success: boolean; data: SurveyResponseData }>(`${this.baseUrl}/list?${params.toString()}`);
      
      console.log('Raw API response:', response);
      
      // The API client returns response.data, so we get { success: true, data: SurveyResponseData } directly
      // We need to return { data: SurveyResponseData } for consistency
      if (response && (response as any).success && (response as any).data) {
        return { data: (response as any).data };
      } else {
        console.error('Invalid API response structure:', response);
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      console.error('Error fetching survey responses:', error);
      throw error;
    }
  }

  /**
   * Get a single survey response by ID
   */
  async getSurveyResponse(id: number): Promise<{ data: SurveyResponse }> {
    try {
      const response = await apiClient.get<SurveyResponse>(`${this.baseUrl}/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching survey response:', error);
      throw error;
    }
  }

  /**
   * Get survey statistics and analytics
   */
  async getSurveyStats(): Promise<{ data: SurveyStats }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: SurveyStats }>(`${this.baseUrl}/statistics`);
      
      console.log('Raw stats API response:', response);
      
      // The API client returns response.data, so we get { success: true, data: SurveyStats } directly
      // We need to return { data: SurveyStats } for consistency
      if (response && (response as any).success && (response as any).data) {
        return { data: (response as any).data };
      } else {
        console.error('Invalid stats API response structure:', response);
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      console.error('Error fetching survey statistics:', error);
      throw error;
    }
  }

  /**
   * Submit a new survey response (for public form)
   */
  async submitSurveyResponse(data: Omit<SurveyResponse, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: SurveyResponse }> {
    try {
      const response = await apiClient.post<{ data: SurveyResponse }>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error submitting survey response:', error);
      throw error;
    }
  }

  /**
   * Update a survey response (admin only)
   */
  async updateSurveyResponse(id: number, data: Partial<SurveyResponse>): Promise<{ data: SurveyResponse }> {
    try {
      const response = await apiClient.put<SurveyResponse>(`${this.baseUrl}/${id}`, data);
      return { data: response.data };
    } catch (error) {
      console.error('Error updating survey response:', error);
      throw error;
    }
  }

  /**
   * Delete a survey response (admin only)
   */
  async deleteSurveyResponse(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting survey response:', error);
      throw error;
    }
  }

  /**
   * Export survey responses to CSV
   */
  async exportSurveyResponses(filters: SurveyFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<Blob>(`${this.baseUrl}/export?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting survey responses:', error);
      throw error;
    }
  }

  /**
   * Generate a survey report
   */
  async generateReport(reportData: {
    title: string;
    period: string;
    filters?: SurveyFilters;
    format?: 'pdf' | 'excel';
  }): Promise<{ data: SurveyReport }> {
    try {
      const response = await apiClient.post<{ data: SurveyReport }>(`${this.baseUrl}/reports`, reportData);
      return { data: response.data.data };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Get all generated reports
   */
  async getReports(): Promise<{ data: SurveyReport[] }> {
    try {
      const response = await apiClient.get<{ data: SurveyReport[] }>(`${this.baseUrl}/reports`);
      return { data: response.data.data };
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  /**
   * Download a generated report
   */
  async downloadReport(reportId: number): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(`${this.baseUrl}/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  /**
   * Get satisfaction trends over time
   */
  async getSatisfactionTrends(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{ data: any[] }> {
    try {
      const response = await apiClient.get<{ data: any[] }>(`${this.baseUrl}/trends?period=${period}`);
      return { data: response.data.data };
    } catch (error) {
      console.error('Error fetching satisfaction trends:', error);
      throw error;
    }
  }

  /**
   * Get service quality dimension analysis
   */
  async getSQDAnalysis(): Promise<{ data: any }> {
    try {
      const response = await apiClient.get<{ data: any }>(`${this.baseUrl}/sqd-analysis`);
      return response.data;
    } catch (error) {
      console.error('Error fetching SQD analysis:', error);
      throw error;
    }
  }

  /**
   * Get citizens charter analysis
   */
  async getCCAnalysis(): Promise<{ data: any }> {
    try {
      const response = await apiClient.get<{ data: any }>(`${this.baseUrl}/cc-analysis`);
      return response.data;
    } catch (error) {
      console.error('Error fetching CC analysis:', error);
      throw error;
    }
  }

  /**
   * Bulk delete survey responses
   */
  async bulkDeleteSurveyResponses(ids: number[]): Promise<{ message: string; deleted_count: number }> {
    try {
      const response = await apiClient.post<{ message: string; deleted_count: number }>(`${this.baseUrl}/bulk-delete`, { ids });
      return response.data;
    } catch (error) {
      console.error('Error bulk deleting survey responses:', error);
      throw error;
    }
  }

  /**
   * Get survey response by control number
   */
  async getSurveyResponseByControlNo(controlNo: string): Promise<{ data: SurveyResponse }> {
    try {
      const response = await apiClient.get<{ data: SurveyResponse }>(`${this.baseUrl}/control-no/${controlNo}`);
      return { data: response.data.data };
    } catch (error) {
      console.error('Error fetching survey response by control number:', error);
      throw error;
    }
  }

  /**
   * Validate control number format
   */
  validateControlNumber(controlNo: string): boolean {
    // Control number format: MMDDYY + ID (e.g., 122501001)
    const controlNoRegex = /^\d{8,9}$/;
    return controlNoRegex.test(controlNo);
  }

  /**
   * Generate control number
   */
  generateControlNumber(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    return `${month}${day}${year}`;
  }
}

// Create and export a singleton instance
const customerFeedbackService = new CustomerFeedbackService();
export default customerFeedbackService;
