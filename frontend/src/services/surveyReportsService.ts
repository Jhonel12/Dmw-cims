import apiClient from './api-client';
import jsPDF from 'jspdf';

// Type definitions
export interface SurveyReport {
  id: number;
  title: string;
  period: string;
  total_responses: number;
  average_satisfaction: number;
  generated_at: string;
  status: 'completed' | 'pending' | 'failed';
  filters_applied?: SurveyReportFilters;
  breakdowns?: {
    satisfaction: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
      very_poor: number;
    };
    gender: {
      male: number;
      female: number;
    };
    channel: {
      walk_in: number;
      online: number;
    };
  };
}

export interface SurveyReportFilters {
  period?: string;
  date_from?: string;
  date_to?: string;
  satisfaction_level?: string;
  sex?: string;
  client_channel?: string;
  client_type?: string;
}

export interface ReportData {
  report_id: string;
  title: string;
  period: string;
  total_responses: number;
  average_satisfaction: number;
  satisfaction_breakdown: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    very_poor: number;
  };
  gender_breakdown: {
    male: number;
    female: number;
  };
  channel_breakdown: {
    walk_in: number;
    online: number;
  };
  generated_at: string;
  status: string;
}

export interface ReportStatistics {
  total_reports: number;
  total_responses: number;
  overall_satisfaction: number;
  completed_reports: number;
  reports_by_period: {
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  recent_reports: SurveyReport[];
}

export interface GenerateReportOptions {
  period?: 'week' | 'month' | 'quarter' | 'year';
}

export interface DownloadReportOptions {
  format?: 'csv' | 'pdf';
  period?: 'week' | 'month' | 'quarter' | 'year';
}

// Service class
class SurveyReportsService {
  /**
   * Get all survey reports
   */
  async getReports(period?: string, filters?: SurveyReportFilters): Promise<{ reports: SurveyReport[] }> {
    try {
      const params: any = {};
      
      if (period) {
        params.period = period;
      }
      
      if (filters) {
        Object.keys(filters).forEach(key => {
          const value = filters[key as keyof SurveyReportFilters];
          if (value) {
            params[key] = value;
          }
        });
      }
      
      const response = await apiClient.get<{ 
        success: boolean;
        data: SurveyReport[];
        message: string;
      }>('/survey-reports', { params });
      
      // Transform backend response to frontend format
      return {
        reports: response.data || []
      };
    } catch (error) {
      console.error('Error fetching survey reports:', error);
      throw error;
    }
  }

  /**
   * Generate a new survey report
   */
  async generateReport(options: GenerateReportOptions = {}): Promise<ReportData> {
    try {
      const response = await apiClient.post<ReportData>('/survey-reports/generate', options);
      return response;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Download a specific report
   */
  async downloadReport(reportId: string, options: DownloadReportOptions = {}): Promise<{
    filename: string;
    csv_data?: string;
    download_url?: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (options.format) params.append('format', options.format);
      if (options.period) params.append('period', options.period);

      const url = `/survey-reports/download/${reportId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<{
        filename: string;
        csv_data?: string;
        download_url?: string;
      }>(url);
      
      return response;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  /**
   * Get report statistics
   */
  async getStatistics(): Promise<ReportStatistics> {
    try {
      const response = await apiClient.get<ReportStatistics>('/survey-reports/statistics');
      return response;
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      throw error;
    }
  }

  /**
   * Export survey reports to CSV
   */
  async exportToCsv(filters: SurveyReportFilters): Promise<Blob> {
    try {
      const params: any = {};
      
      if (filters.period) {
        params.period = filters.period;
      }
      if (filters.date_from) {
        params.date_from = filters.date_from;
      }
      if (filters.date_to) {
        params.date_to = filters.date_to;
      }
      if (filters.satisfaction_level) {
        params.satisfaction_level = filters.satisfaction_level;
      }
      if (filters.sex) {
        params.sex = filters.sex;
      }
      if (filters.client_channel) {
        params.client_channel = filters.client_channel;
      }
      if (filters.client_type) {
        params.client_type = filters.client_type;
      }

      const response = await apiClient.post<{
        success: boolean;
        data: {
          filename: string;
          csv_data: string;
          total_records: number;
        };
        message: string;
      }>('/survey-reports/export/csv', params);

      // Create blob from CSV data
      const blob = new Blob([response.data.csv_data], { type: 'text/csv;charset=utf-8;' });
      return blob;
    } catch (error) {
      console.error('Error exporting survey reports to CSV:', error);
      throw error;
    }
  }

  /**
   * Export survey reports to PDF
   */
  async exportToPdf(filters: SurveyReportFilters): Promise<Blob> {
    try {
      const params: any = {};
      
      if (filters.period) {
        params.period = filters.period;
      }
      if (filters.date_from) {
        params.date_from = filters.date_from;
      }
      if (filters.date_to) {
        params.date_to = filters.date_to;
      }
      if (filters.satisfaction_level) {
        params.satisfaction_level = filters.satisfaction_level;
      }
      if (filters.sex) {
        params.sex = filters.sex;
      }
      if (filters.client_channel) {
        params.client_channel = filters.client_channel;
      }
      if (filters.client_type) {
        params.client_type = filters.client_type;
      }

      const response = await apiClient.post<{
        success: boolean;
        data: any[];
        message: string;
      }>('/survey-reports/export/pdf', params);

      // Convert survey data to PDF using jsPDF
      return await this.convertSurveyDataToPDF(response.data);
    } catch (error) {
      console.error('Error exporting survey reports to PDF:', error);
      throw error;
    }
  }

  /**
   * Convert survey data to PDF format using jsPDF
   */
  private async convertSurveyDataToPDF(data: any[]): Promise<Blob> {
    console.log('convertSurveyDataToPDF received data:', data);
    console.log('Data length:', data?.length);
    
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
      doc.setFont('helvetica', 'bold');
      doc.text('SURVEY REPORTS', margin, 50);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No survey data available for the selected filters.', margin, 70);
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
    doc.text('SURVEY REPORTS', margin, yPosition);
    yPosition += 15;

    // Report info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Total Responses: ${data.length}`, margin, yPosition);
    yPosition += 15;

    // Table headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const headers = ['Control No', 'Client Type', 'Sex', 'Satisfaction', 'Date', 'Channel'];
    const colWidths = [25, 45, 20, 25, 35, 25]; // Increased Control No width
    const colSpacing = 5; // Add spacing between columns
    let xPosition = margin;

    // Draw headers
    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index] + colSpacing;
    });
    yPosition += 8;

    // Draw line under headers
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
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
        record.control_no?.toString() || 'N/A',
        this.truncateText(record.client_type || 'N/A', 35), // Increased truncation length
        record.sex || 'N/A',
        record.sqd0 || 'N/A',
        record.date || 'N/A',
        record.client_channel || 'N/A'
      ];

      rowData.forEach((cell, cellIndex) => {
        doc.text(cell, xPosition, yPosition);
        xPosition += colWidths[cellIndex] + colSpacing;
      });
      yPosition += lineHeight;
    }

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

  /**
   * Truncate text to fit in PDF cells
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Download CSV file
   */
  async downloadCSV(data: string, filename: string): Promise<void> {
    try {
      // Create and download file
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
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

  /**
   * Download file from URL
   */
  async downloadFromUrl(url: string, filename: string): Promise<void> {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file from URL:', error);
      throw error;
    }
  }
}

// Export the service instance
export const surveyReportsService = new SurveyReportsService();
