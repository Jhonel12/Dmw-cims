import apiClient from './api-client';
import type { 
  OFW, 
  OFWFormData, 
  SearchFilters, 
  OFWStatistics, 
  ApiResponse, 
  PaginatedResponse 
} from '../types/ofw';
import jsPDF from 'jspdf';

class OFWService {
  /**
   * Get all OFW records with optional search and filters
   */
  async getOFWRecords(filters: SearchFilters = {}): Promise<PaginatedResponse<OFW>> {
    const params = new URLSearchParams();
    
    // Add search parameters
    if (filters.search) params.append('search', filters.search);
    if (filters.sex) params.append('sex', filters.sex);
    if (filters.country) params.append('country', filters.country);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    if (filters.page) params.append('page', filters.page.toString());

    const queryString = params.toString();
    const url = queryString ? `/ofw?${queryString}` : '/ofw';
    
    const response = await apiClient.get<ApiResponse<PaginatedResponse<OFW>>>(url);
    return response.data;
  }

  /**
   * Get a specific OFW record by ID
   */
  async getOFWRecord(id: number): Promise<OFW> {
    const response = await apiClient.get<ApiResponse<OFW>>(`/ofw/${id}`);
    return response.data;
  }

  /**
   * Create a new OFW record
   */
  async createOFWRecord(data: OFWFormData): Promise<OFW> {
    const response = await apiClient.post<ApiResponse<OFW>>('/ofw', data);
    return response.data;
  }

  /**
   * Update an existing OFW record
   */
  async updateOFWRecord(id: number, data: Partial<OFWFormData>): Promise<OFW> {
    const response = await apiClient.put<ApiResponse<OFW>>(`/ofw/${id}`, data);
    return response.data;
  }

  /**
   * Delete an OFW record
   */
  async deleteOFWRecord(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/ofw/${id}`);
  }

  /**
   * Search for OFW record by OEC number
   */
  async searchByOECNumber(oecNumber: string): Promise<OFW> {
    const response = await apiClient.get<ApiResponse<OFW>>(`/ofw/search-oec?oecNumber=${encodeURIComponent(oecNumber)}`);
    return response.data;
  }

  /**
   * Get OFW statistics
   */
  async getStatistics(): Promise<OFWStatistics> {
    const response = await apiClient.get<ApiResponse<OFWStatistics>>('/ofw/statistics');
    return response.data;
  }

  /**
   * Get OFW records by country
   */
  async getOFWRecordsByCountry(country: string, filters: Omit<SearchFilters, 'country'> = {}): Promise<PaginatedResponse<OFW>> {
    return this.getOFWRecords({ ...filters, country });
  }

  /**
   * Get OFW records by gender
   */
  async getOFWRecordsByGender(sex: 'Male' | 'Female', filters: Omit<SearchFilters, 'sex'> = {}): Promise<PaginatedResponse<OFW>> {
    return this.getOFWRecords({ ...filters, sex });
  }

  /**
   * Get recent departures (last 30 days)
   */
  async getRecentDepartures(filters: SearchFilters = {}): Promise<PaginatedResponse<OFW>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.getOFWRecords({
      ...filters,
      sort_by: 'departureDate',
      sort_order: 'desc'
    });
  }

  /**
   * Get upcoming departures (next 30 days)
   */
  async getUpcomingDepartures(filters: SearchFilters = {}): Promise<PaginatedResponse<OFW>> {
    return this.getOFWRecords({
      ...filters,
      sort_by: 'departureDate',
      sort_order: 'asc'
    });
  }

  /**
   * Export OFW records (if backend supports it)
   */
  async exportOFWRecords(filters: SearchFilters = {}, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.sex) params.append('sex', filters.sex);
    if (filters.country) params.append('country', filters.country);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    params.append('format', format);

    const queryString = params.toString();
    const url = queryString ? `/ofw/export?${queryString}` : '/ofw/export';
    
    const response = await apiClient.getAxiosInstance().get(url, {
      responseType: 'blob'
    });
    
    return response.data as Blob;
  }

  /**
   * Validate OFW form data before submission
   */
  validateOFWData(data: OFWFormData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!data.nameOfWorker?.trim()) {
      errors.nameOfWorker = 'Name of Worker is required';
    }

    if (!data.sex) {
      errors.sex = 'Sex is required';
    }

    if (!data.position?.trim()) {
      errors.position = 'Position is required';
    }

    if (!data.address?.trim()) {
      errors.address = 'Address is required';
    }

    if (!data.employer?.trim()) {
      errors.employer = 'Employer is required';
    }

    if (!data.countryDestination?.trim()) {
      errors.countryDestination = 'Country Destination is required';
    }

    if (!data.oecNumber?.trim()) {
      errors.oecNumber = 'OEC Number is required';
    }

    if (!data.departureDate?.trim()) {
      errors.departureDate = 'Departure Date is required';
    } else {
      const departureDate = new Date(data.departureDate);
      
      if (isNaN(departureDate.getTime())) {
        errors.departureDate = 'Please enter a valid date';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Format OFW data for display
   */
  formatOFWForDisplay(ofw: OFW): OFW {
    return {
      ...ofw,
      departureDate: ofw.departureDate ? new Date(ofw.departureDate).toLocaleDateString() : '',
      created_at: ofw.created_at ? new Date(ofw.created_at).toLocaleDateString() : '',
      updated_at: ofw.updated_at ? new Date(ofw.updated_at).toLocaleDateString() : '',
    };
  }

  /**
   * Get unique countries from OFW records
   */
  async getUniqueCountries(): Promise<string[]> {
    const response = await this.getOFWRecords({ per_page: 1000 }); // Get all records
    const countries = new Set<string>();
    
    response.data.forEach(ofw => {
      if (ofw.countryDestination) {
        countries.add(ofw.countryDestination);
      }
    });
    
    return Array.from(countries).sort();
  }

  /**
   * Get unique positions from OFW records
   */
  async getUniquePositions(): Promise<string[]> {
    const response = await this.getOFWRecords({ per_page: 1000 }); // Get all records
    const positions = new Set<string>();
    
    response.data.forEach(ofw => {
      if (ofw.position) {
        positions.add(ofw.position);
      }
    });
    
    return Array.from(positions).sort();
  }

  /**
   * Get filtered reports data
   */
  async getFilteredReports(filters: {
    dateFrom?: string;
    dateTo?: string;
    country?: string;
    sex?: string;
    position?: string;
  }): Promise<OFWStatistics> {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.country) params.append('country', filters.country);
      if (filters.sex) params.append('sex', filters.sex);
      if (filters.position) params.append('position', filters.position);

      console.log('Fetching reports with filters:', filters);
      console.log('API URL:', `/ofw/reports?${params.toString()}`);
      console.log('Date filters being sent:', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        dateFromType: typeof filters.dateFrom,
        dateToType: typeof filters.dateTo
      });
      
      const response = await apiClient.get(`/ofw/reports?${params.toString()}`);
      
      console.log('Reports API response:', (response as any).data);
      console.log('Response status:', (response as any).status);
      
      // Check if response has success property (new API format)
      if ((response as any).data.success !== undefined) {
        if ((response as any).data.success) {
          return (response as any).data.data;
        } else {
          throw new Error((response as any).data.message || 'Failed to fetch reports data');
        }
      } else {
        // Direct data format (fallback for existing API)
        return (response as any).data as OFWStatistics;
      }
    } catch (error: any) {
      console.error('Error fetching filtered reports:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  /**
   * Export OFW records to Excel
   */
  async exportToExcel(filters: {
    dateFrom?: string;
    dateTo?: string;
    country?: string;
    sex?: string;
    position?: string;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.country) params.append('country', filters.country);
      if (filters.sex) params.append('sex', filters.sex);
      if (filters.position) params.append('position', filters.position);

      const response = await apiClient.get(`/ofw/export/excel?${params.toString()}`);
      
      console.log('CSV export API response:', (response as any).data);
      console.log('Response data.data:', (response as any).data.data);
      
      // Extract data from response - handle different possible structures
      let exportData = [];
      if ((response as any).data && (response as any).data.data) {
        exportData = (response as any).data.data;
      } else if ((response as any).data && Array.isArray((response as any).data)) {
        exportData = (response as any).data;
      } else if ((response as any).data && (response as any).data.success && (response as any).data.data) {
        exportData = (response as any).data.data;
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
  }

  /**
   * Export OFW records to PDF
   */
  async exportToPdf(filters: {
    dateFrom?: string;
    dateTo?: string;
    country?: string;
    sex?: string;
    position?: string;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.country) params.append('country', filters.country);
      if (filters.sex) params.append('sex', filters.sex);
      if (filters.position) params.append('position', filters.position);

      const response = await apiClient.get(`/ofw/export/pdf?${params.toString()}`);
      
      console.log('PDF export API response:', (response as any).data);
      console.log('Response data.data:', (response as any).data.data);
      
      // Extract data from response - handle different possible structures
      let exportData = [];
      if ((response as any).data && (response as any).data.data) {
        exportData = (response as any).data.data;
      } else if ((response as any).data && Array.isArray((response as any).data)) {
        exportData = (response as any).data;
      } else if ((response as any).data && (response as any).data.success && (response as any).data.data) {
        exportData = (response as any).data.data;
      }
      
      console.log('Extracted export data:', exportData);
      console.log('Export data length:', exportData.length);
      
      // Convert JSON response to PDF format using jsPDF
      return await this.convertToPDF(exportData);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    console.log('convertToCSV received data:', data);
    console.log('CSV data length:', data?.length);
    console.log('CSV data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No data available for CSV, returning empty message');
      return 'No data available';
    }
    
    console.log('Data is valid, proceeding with CSV generation');

    const headers = [
      'Name of Worker',
      'Sex',
      'Position',
      'Country Destination',
      'Address',
      'Employer',
      'OEC Number',
      'Departure Date'
    ];

    const csvRows = [headers.join(',')];

    data.forEach(record => {
      const row = [
        `"${record.nameOfWorker || ''}"`,
        `"${record.sex || ''}"`,
        `"${record.position || ''}"`,
        `"${record.countryDestination || ''}"`,
        `"${record.address || ''}"`,
        `"${record.employer || ''}"`,
        `"${record.oecNumber || ''}"`,
        `"${record.departureDate || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
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

  /**
   * Convert data to PDF format using jsPDF
   */
  private async convertToPDF(data: any[]): Promise<Blob> {
    console.log('convertToPDF received data:', data);
    console.log('Data length:', data?.length);
    console.log('Data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    
    console.log('Data is valid, proceeding with PDF generation');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 60; // Increased to make room for larger image
    const lineHeight = 7;
    const margin = 20;

    // More robust data checking
    if (!data || !Array.isArray(data) || data.length === 0) {
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
      doc.text('OFW Records Report', 20, 50);
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
    doc.text('OFW RECORDS REPORT', margin, yPosition);
    yPosition += 15;

    // Report info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Total Records: ${data.length}`, margin, yPosition);
    yPosition += 15;

    // Table headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const headers = ['Name', 'Sex', 'Position', 'Country', 'OEC #', 'Departure Date'];
    const colWidths = [35, 15, 25, 25, 20, 25];
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
      const record = data[index];
      
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        // Add image header to new page
        if (imageData) {
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = 30;
          doc.addImage(imageData, 'PNG', margin, 10, imgWidth, imgHeight);
        }
        yPosition = 60; // Start below the larger image
      }

      xPosition = margin;
      const rowData = [
        this.truncateText(record.nameOfWorker || 'N/A', 30),
        record.sex || 'N/A',
        this.truncateText(record.position || 'N/A', 20),
        this.truncateText(record.countryDestination || 'N/A', 20),
        record.oecNumber || 'N/A',
        record.departureDate || 'N/A'
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
  }

  /**
   * Truncate text to fit in table cells
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}

// Create and export a singleton instance
const ofwService = new OFWService();
export default ofwService;
