class BackendPDFAPI {
  constructor(baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000') {
    this.baseURL = baseURL;
  }

  /**
   * Generate PDF and download directly
   */
  async generateAndDownloadPDF(documentData, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}/api/pdf/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentData,
          options
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'PDF generation failed');
      }

      // Get the PDF as blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = options.fileName || `legal-analysis-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'PDF downloaded successfully' };

    } catch (error) {
      console.error('Backend PDF generation error:', error);
      throw error;
    }
  }

  /**
   * Generate PDF as base64 for preview
   */
  async generatePDFBase64(documentData, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}/api/pdf/generate-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentData,
          options
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'PDF generation failed');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Backend PDF base64 generation error:', error);
      throw error;
    }
  }

  /**
   * Get HTML preview of PDF content
   */
  async getHTMLPreview(documentData) {
    try {
      const response = await fetch(`${this.baseURL}/api/pdf/preview-html`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'HTML preview generation failed');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('HTML preview generation error:', error);
      throw error;
    }
  }

  /**
   * Check if PDF service is healthy
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/api/pdf/health`);
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('PDF service health check error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default BackendPDFAPI;