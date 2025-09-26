import apiClient from './api-client';
import jsPDF from 'jspdf';

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
    sex?: string;
    place?: string;
    civil_status?: string;
    sort_by?: string;
    per_page?: number;
    page?: number;
  }): Promise<ClientListResponse> {
    const response = await apiClient.get('/clients', { params });
    return response as any;
  },

  // Get client by ID
  async getClient(id: number): Promise<ClientResponse> {
    const response = await apiClient.get(`/clients/${id}`);
    return response as any;
  },

  // Create new client
  async createClient(data: ClientFormData): Promise<ClientResponse> {
    const response = await apiClient.post('/clients', data);
    return response as any;
  },

  // Update client
  async updateClient(id: number, data: Partial<ClientFormData>): Promise<ClientResponse> {
    const response = await apiClient.put(`/clients/${id}`, data);
    return response as any;
  },

  // Soft delete client
  async deleteClient(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/clients/${id}`);
    return response as any;
  },

  // Restore soft deleted client
  async restoreClient(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/clients/${id}/restore`);
    return response as any;
  },

  // Permanently delete client
  async forceDeleteClient(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/clients/${id}/force`);
    return response as any;
  },

  // Get trashed clients
  async getTrashedClients(): Promise<ClientListResponse> {
    const response = await apiClient.get('/clients/trashed');
    return response as any;
  },

  // Get client statistics
  async getClientStats(): Promise<ClientStatsResponse> {
    const response = await apiClient.get('/clients/stats');
    return response as ClientStatsResponse;
  },

  /**
   * Export clients to PDF
   */
  async exportToPdf(filters: {
    dateFrom?: string;
    dateTo?: string;
    sex?: string;
    civilStatus?: string;
    socialClassification?: string;
    region?: string;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.sex) params.append('sex', filters.sex);
      if (filters.civilStatus) params.append('civil_status', filters.civilStatus);
      if (filters.socialClassification) params.append('social_classification', filters.socialClassification);
      if (filters.region) params.append('region', filters.region);

      const response = await apiClient.get(`/clients?${params.toString()}&per_page=1000`);
      
      console.log('Client PDF export API response:', (response as any).data);
      
      // Extract data from response
      let exportData = [];
      const responseData = (response as any).data;
      if (responseData && responseData.data) {
        exportData = responseData.data;
      } else if (responseData && Array.isArray(responseData)) {
        exportData = responseData;
      } else if (responseData && responseData.success && responseData.data) {
        exportData = responseData.data;
      }
      
      console.log('Extracted client export data:', exportData);
      
      // Convert JSON response to PDF format using jsPDF
      return await this.convertClientsToPDF(exportData);
    } catch (error) {
      console.error('Error exporting clients to PDF:', error);
      throw error;
    }
  },

  /**
   * Export client records to Excel (CSV)
   */
  async exportToExcel(filters: {
    dateFrom?: string;
    dateTo?: string;
    sex?: string;
    civilStatus?: string;
    socialClassification?: string;
    place?: string;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.sex) params.append('sex', filters.sex);
      if (filters.civilStatus) params.append('civil_status', filters.civilStatus);
      if (filters.socialClassification) params.append('social_classification', filters.socialClassification);
      if (filters.place) params.append('place', filters.place);

      const response = await apiClient.get(`/clients?${params.toString()}&per_page=1000`) as any;
      const responseData = response.data;
      
      console.log('CSV export API response:', responseData);
      console.log('Response data.data:', responseData.data);
      
      // Extract data from response - handle different possible structures
      let exportData = [];
      if (responseData && responseData.data) {
        exportData = responseData.data;
      } else if (responseData && Array.isArray(responseData)) {
        exportData = responseData;
      } else if (responseData && responseData.success && responseData.data) {
        exportData = responseData.data;
      }
      
      console.log('Extracted CSV export data:', exportData);
      console.log('CSV export data length:', exportData.length);
      
      // Convert JSON response to CSV format and create blob
      const csvData = this.convertToCSV(exportData);
      return new Blob([csvData], { type: 'text/csv' });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  },

  /**
   * Convert data to CSV format
   */
  convertToCSV(data: Client[]): string {
    console.log('convertToCSV received data:', data);
    console.log('CSV data length:', data?.length);
    console.log('CSV data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No data available for CSV, returning empty message');
      return 'No data available';
    }
    
    console.log('Data is valid, proceeding with CSV generation');

    // CSV Header Section
    const csvRows = [
      'CLIENT REPORT',
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Total Clients: ${data.length}`,
      '', // Empty line for spacing
    ];

    // Column headers
    const headers = [
      'ID',
      'Name',
      'Sex',
      'Civil Status',
      'Age',
      'Social Classification',
      'Address',
      'City',
      'Province',
      'Region',
      'Zip Code',
      'Telephone',
      'Email',
      'Emergency Contact',
      'Emergency Phone',
      'Emergency Relationship',
      'National ID',
      'National ID Number',
      'Created Date'
    ];

    csvRows.push(headers.join(','));

    data.forEach(client => {
      const fullName = [
        client.first_name,
        client.middle_name,
        client.last_name,
        client.suffix
      ].filter(Boolean).join(' ');

      const address = [
        client.house_number,
        client.street,
        client.barangay
      ].filter(Boolean).join(', ');

      const socialClassification = Array.isArray(client.social_classification) 
        ? client.social_classification.join('; ') 
        : client.social_classification || '';

      const row = [
        `"${client.id || ''}"`,
        `"${fullName}"`,
        `"${client.sex || ''}"`,
        `"${client.civil_status || ''}"`,
        `"${client.age || ''}"`,
        `"${socialClassification}"`,
        `"${address}"`,
        `"${client.city || ''}"`,
        `"${client.province || ''}"`,
        `"${client.region || ''}"`,
        `"${client.zip_code || ''}"`,
        `"${client.telephone || ''}"`,
        `"${client.email || ''}"`,
        `"${client.emergency_name || ''}"`,
        `"${client.emergency_telephone || ''}"`,
        `"${client.emergency_relationship || ''}"`,
        `"${client.has_national_id ? 'Yes' : 'No'}"`,
        `"${client.national_id_number || ''}"`,
        `"${client.created_at ? new Date(client.created_at).toLocaleDateString() : ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  },

  /**
   * Convert client data to PDF format using jsPDF
   */
  async convertClientsToPDF(data: Client[]): Promise<Blob> {
    console.log('convertClientsToPDF received data:', data);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 60;
    const lineHeight = 7;
    const margin = 20;

    // Check if data is available
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No client data available, creating empty PDF');
      
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
      doc.text('CLIENT REPORT', 20, 50);
      doc.setFontSize(12);
      doc.text('No data available', 20, 70);
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
    doc.text('CLIENT REPORT', margin, yPosition);
    yPosition += 15;

    // Report info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Total Clients: ${data.length}`, margin, yPosition);
    yPosition += 15;

    // Table headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const headers = ['Name', 'Sex', 'Age', 'Civil Status', 'Region', 'City', 'Classification'];
    const colWidths = [40, 15, 10, 20, 25, 25, 30];
    let xPosition = margin;

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });

    yPosition += 5;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Table data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Load image once for reuse
    const imageData = await this.loadImageAsBase64('/image/image.png');
    
    for (let index = 0; index < data.length; index++) {
      const client = data[index];
      
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        // Add image header to new page
        if (imageData) {
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = 30;
          doc.addImage(imageData, 'PNG', margin, 10, imgWidth, imgHeight);
        }
        yPosition = 60; // Start below the image
      }

      xPosition = margin;
      const fullName = `${client.first_name} ${client.middle_name ? client.middle_name + ' ' : ''}${client.last_name}${client.suffix ? ' ' + client.suffix : ''}`;
      const classification = Array.isArray(client.social_classification) 
        ? client.social_classification.join(', ') 
        : client.social_classification || 'N/A';

      const rowData = [
        this.truncateText(fullName, 35),
        client.sex || 'N/A',
        client.age?.toString() || 'N/A',
        this.truncateText(client.civil_status || 'N/A', 15),
        this.truncateText(client.region || 'N/A', 20),
        this.truncateText(client.city || 'N/A', 20),
        this.truncateText(classification, 25)
      ];

      rowData.forEach((cell, colIndex) => {
        doc.text(cell, xPosition, yPosition);
        xPosition += colWidths[colIndex];
      });

      yPosition += lineHeight;

      // Add separator line every 10 rows
      if ((index + 1) % 10 === 0) {
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 2;
      }
    }

    return doc.output('blob');
  },

  /**
   * Load image as base64 string for PDF generation
   */
  loadImageAsBase64(src: string): Promise<string | null> {
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
  },

  /**
   * Truncate text to fit in table cells
   */
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
};
