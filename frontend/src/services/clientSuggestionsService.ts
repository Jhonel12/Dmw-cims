import apiClient from './api-client';

// Type definitions
export interface ClientSuggestion {
  id: number;
  control_no: string;
  client_type: string;
  sex: string;
  age?: number;
  region?: string;
  service_availed: string;
  suggestions: string;
  email?: string;
  date: string;
  created_at: string;
  updated_at: string;
  client_channel: string;
}

export interface ClientSuggestionFilters {
  client_type?: string;
  sex?: string;
  client_channel?: string;
  service_availed?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  per_page?: number;
}

export interface ClientSuggestionStatistics {
  total_suggestions: number;
  online_suggestions: number;
  walkin_suggestions: number;
  this_month_suggestions: number;
  suggestions_by_client_type: Record<string, number>;
  suggestions_by_service: Record<string, number>;
}

export interface ClientSuggestionResponse {
  success: boolean;
  data: ClientSuggestion[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  message: string;
}

export interface ClientSuggestionStatisticsResponse {
  success: boolean;
  data: ClientSuggestionStatistics;
  message: string;
}

class ClientSuggestionsService {
  /**
   * Get all client suggestions with optional filtering
   */
  async getSuggestions(filters?: ClientSuggestionFilters): Promise<ClientSuggestionResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.keys(filters).forEach(key => {
          const value = filters[key as keyof ClientSuggestionFilters];
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<ClientSuggestionResponse>(`/client-suggestions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching client suggestions:', error);
      throw error;
    }
  }

  /**
   * Get a specific client suggestion by ID
   */
  async getSuggestion(id: number): Promise<{ success: boolean; data: ClientSuggestion; message: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: ClientSuggestion; message: string }>(`/client-suggestions/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching client suggestion:', error);
      throw error;
    }
  }

  /**
   * Get statistics for client suggestions
   */
  async getStatistics(): Promise<ClientSuggestionStatisticsResponse> {
    try {
      const response = await apiClient.get<ClientSuggestionStatisticsResponse>('/client-suggestions/statistics');
      return response;
    } catch (error) {
      console.error('Error fetching client suggestions statistics:', error);
      throw error;
    }
  }

  /**
   * Export client suggestions to CSV
   */
  async exportToCsv(filters: ClientSuggestionFilters): Promise<Blob> {
    try {
      const params: any = {};
      
      if (filters.client_type) {
        params.client_type = filters.client_type;
      }
      if (filters.sex) {
        params.sex = filters.sex;
      }
      if (filters.client_channel) {
        params.client_channel = filters.client_channel;
      }
      if (filters.service_availed) {
        params.service_availed = filters.service_availed;
      }
      if (filters.date_from) {
        params.date_from = filters.date_from;
      }
      if (filters.date_to) {
        params.date_to = filters.date_to;
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const response = await apiClient.post<{
        success: boolean;
        data: {
          filename: string;
          csv_data: string;
          total_records: number;
        };
        message: string;
      }>('/client-suggestions/export/csv', params);

      const blob = new Blob([response.data.csv_data], { type: 'text/csv;charset=utf-8;' });
      return blob;
    } catch (error) {
      console.error('Error exporting client suggestions to CSV:', error);
      throw error;
    }
  }

  /**
   * Export client suggestions to PDF
   */
  async exportToPdf(filters: ClientSuggestionFilters): Promise<Blob> {
    try {
      const params: any = {};
      
      if (filters.client_type) {
        params.client_type = filters.client_type;
      }
      if (filters.sex) {
        params.sex = filters.sex;
      }
      if (filters.client_channel) {
        params.client_channel = filters.client_channel;
      }
      if (filters.service_availed) {
        params.service_availed = filters.service_availed;
      }
      if (filters.date_from) {
        params.date_from = filters.date_from;
      }
      if (filters.date_to) {
        params.date_to = filters.date_to;
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const response = await apiClient.post<{
        success: boolean;
        data: ClientSuggestion[];
        message: string;
      }>('/client-suggestions/export/pdf', params);

      // Convert suggestions data to PDF using jsPDF
      return await this.convertSuggestionsToPDF(response.data);
    } catch (error) {
      console.error('Error exporting client suggestions to PDF:', error);
      throw error;
    }
  }

  /**
   * Convert suggestions data to PDF format using jsPDF
   */
  private async convertSuggestionsToPDF(data: ClientSuggestion[]): Promise<Blob> {
    const { default: jsPDF } = await import('jspdf');
    
    console.log('convertSuggestionsToPDF received data:', data);
    console.log('Data length:', data?.length);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 60; // Increased to make room for larger image
    const lineHeight = 7;
    const margin = 20;

    // More robust data checking
    if (!data || data.length === 0) {
      console.log('No data available, creating empty PDF');
      
      // Add image header for empty PDF
      try {
        const imageData = await this.loadImageAsBase64('/image/image.png');
        if (imageData) {
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = 30;
          doc.addImage(imageData, 'PNG', margin, 10, imgWidth, imgHeight);
        }
      } catch (error) {
        console.log('Could not load image for empty PDF');
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENT SUGGESTIONS', margin, 50);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No client suggestions available.', margin, 70);
      return doc.output('blob');
    }

    // Add image header
    try {
      const imageData = await this.loadImageAsBase64('/image/image.png');
      if (imageData) {
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = 30;
        doc.addImage(imageData, 'PNG', margin, 10, imgWidth, imgHeight);
      }
    } catch (error) {
      console.log('Could not load image for PDF header');
    }

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT SUGGESTIONS', margin, yPosition);
    yPosition += 15;

    // Report info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Total Suggestions: ${data.length}`, margin, yPosition);
    yPosition += 15;

    // Load image once for reuse
    const imageData = await this.loadImageAsBase64('/image/image.png');
    
    // Add suggestions
    data.forEach((suggestion, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        // Add image header to new page
        if (imageData) {
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = 30;
          doc.addImage(imageData, 'PNG', margin, 10, imgWidth, imgHeight);
        }
        yPosition = 60; // Start below the larger image
      }

      // Suggestion header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Suggestion #${index + 1}`, margin, yPosition);
      yPosition += 5;

      // Control number and details
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Control No: ${suggestion.control_no}`, margin, yPosition);
      doc.text(`Client: ${suggestion.client_type} • ${suggestion.sex}`, margin + 80, yPosition);
      doc.text(`Service: ${suggestion.service_availed}`, margin + 150, yPosition);
      yPosition += 5;

      doc.text(`Channel: ${suggestion.client_channel}`, margin, yPosition);
      doc.text(`Date: ${new Date(suggestion.date).toLocaleDateString()}`, margin + 80, yPosition);
      yPosition += 8;

      // Suggestion text
      doc.setFontSize(8);
      const suggestionText = suggestion.suggestions || 'No suggestion provided';
      const maxWidth = pageWidth - (margin * 2) - 10;
      const lines = doc.splitTextToSize(`"${suggestionText}"`, maxWidth);
      
      doc.text(lines, margin + 5, yPosition);
      yPosition += (lines.length * 4) + 10;

      // Add separator line
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
    });

    return doc.output('blob');
  }

  /**
   * Load image as base64 string for PDF generation
   */
  private loadImageAsBase64(src: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          resolve(null);
        }
      };
      img.onerror = () => {
        console.log('Failed to load image:', src);
        resolve(null);
      };
      img.src = src;
    });
  }
}

export const clientSuggestionsService = new ClientSuggestionsService();
