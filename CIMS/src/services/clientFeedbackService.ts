import apiClientService from './api-clientService';

export interface CustomerFeedbackData {
  control_no: string;
  client_type?: string;
  client_channel?: 'walk-in' | 'online';
  date: string;
  sex?: 'Male' | 'Female';
  age?: number;
  region?: string;
  service_availed?: string;
  cc1?: string;
  cc2?: string;
  cc3?: string;
  sqd0?: string;
  sqd1?: string;
  sqd2?: string;
  sqd3?: string;
  sqd4?: string;
  sqd5?: string;
  sqd6?: string;
  sqd7?: string;
  sqd8?: string;
  suggestions?: string;
  email?: string;
}

export interface FeedbackSubmissionResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    control_no: string;
  };
}

export interface FeedbackStatistics {
  total_responses: number;
  avg_satisfaction: number;
  male_count: number;
  female_count: number;
}

class ClientFeedbackService {
  /**
   * Submit customer feedback
   */
  async submitFeedback(feedbackData: CustomerFeedbackData) {
    return apiClientService.post('/customer-feedback', feedbackData);
  }

  /**
   * Get all feedback (for admin purposes)
   */
  async getAllFeedback() {
    return apiClientService.get('/customer-feedback');
  }

  /**
   * Get feedback statistics
   */
  async getStatistics() {
    return apiClientService.get('/customer-feedback/statistics');
  }
}

export default new ClientFeedbackService();
