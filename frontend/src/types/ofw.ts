export interface OFW {
  id: number;
  nameOfWorker: string;
  sex: 'Male' | 'Female';
  position: string; // Position/Profession
  address: string;
  employer: string;
  countryDestination: string;
  oecNumber: string;
  departureDate: string;
  created_at: string;
  updated_at: string;
}

export interface OFWFormData {
  nameOfWorker: string;
  sex: 'Male' | 'Female';
  position: string;
  address: string;
  employer: string;
  countryDestination: string;
  oecNumber: string;
  departureDate: string;
}

export interface SearchFilters {
  search?: string;
  sex?: 'Male' | 'Female' | '';
  country?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface OFWStatistics {
  total_records: number;
  by_gender: Array<{
    sex: string;
    count: number;
  }>;
  by_country: Array<{
    countryDestination: string;
    count: number;
  }>;
  recent_departures: number;
  upcoming_departures: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}
