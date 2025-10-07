import apiClient from './api-clientService';

export interface Client {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  date_of_birth: string;
  age: number;
  civil_status: 'Single' | 'Married' | 'Widowed' | 'Divorced' | 'Separated';
  sex: 'Male' | 'Female';
  social_classification: string[];
  social_classification_other?: string;
  house_number: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  zip_code: string;
  telephone: string;
  email: string;
  emergency_name: string;
  emergency_telephone: string;
  emergency_relationship: string;
  has_national_id: boolean;
  national_id_number?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ClientFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  date_of_birth: string;
  age: number;
  civil_status: string;
  sex: string;
  social_classification: string[];
  social_classification_other: string;
  house_number: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  zip_code: string;
  telephone: string;
  email: string;
  emergency_name: string;
  emergency_telephone: string;
  emergency_relationship: string;
  has_national_id: boolean;
  national_id_number: string;
}

export interface ClientResponse {
  success: boolean;
  message: string;
  data: Client;
}

export const clientService = {
  // Create new client
  async createClient(data: ClientFormData): Promise<ClientResponse> {
    const response = await apiClient.post<ClientResponse>('/clients', data);
    if (response.success && response.data) {
      return response as any;
    }
    throw new Error(response.message || 'Failed to create client');
  },

  // Get client by ID
  async getClient(id: number): Promise<ClientResponse> {
    const response = await apiClient.get<ClientResponse>(`/clients/${id}`);
    if (response.success && response.data) {
      return response as any;
    }
    throw new Error(response.message || 'Failed to get client');
  },
};

