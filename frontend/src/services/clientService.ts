import apiClient from './api-client';

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

export interface ClientStats {
  total_clients: number;
  verified_clients: number;
  unverified_clients: number;
  ofw_clients: number;
  trashed_clients: number;
}

export interface ClientListResponse {
  success: boolean;
  message: string;
  data: {
    data: Client[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ClientResponse {
  success: boolean;
  message: string;
  data: Client;
}

export interface ClientStatsResponse {
  success: boolean;
  message: string;
  data: ClientStats;
}

export const clientService = {
  // Get all clients with search and filter
  async getClients(params?: {
    search?: string;
    status?: string;
    per_page?: number;
    page?: number;
  }): Promise<ClientListResponse> {
    const response = await apiClient.get('/clients', { params });
    return response;
  },

  // Get client by ID
  async getClient(id: number): Promise<ClientResponse> {
    const response = await apiClient.get(`/clients/${id}`);
    return response;
  },

  // Create new client
  async createClient(data: ClientFormData): Promise<ClientResponse> {
    const response = await apiClient.post('/clients', data);
    return response;
  },

  // Update client
  async updateClient(id: number, data: Partial<ClientFormData>): Promise<ClientResponse> {
    const response = await apiClient.put(`/clients/${id}`, data);
    return response;
  },

  // Soft delete client
  async deleteClient(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/clients/${id}`);
    return response;
  },

  // Restore soft deleted client
  async restoreClient(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/clients/${id}/restore`);
    return response;
  },

  // Permanently delete client
  async forceDeleteClient(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/clients/${id}/force`);
    return response;
  },

  // Get trashed clients
  async getTrashedClients(): Promise<ClientListResponse> {
    const response = await apiClient.get('/clients/trashed');
    return response;
  },

  // Get client statistics
  async getClientStats(): Promise<ClientStatsResponse> {
    const response = await apiClient.get('/clients/statistics');
    return response;
  }
};
