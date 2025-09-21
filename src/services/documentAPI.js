// Document Analysis API Service
import { TokenManager } from './authAPI';

class DocumentAPI {
  constructor() {
    this.API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  /**
   * Make API request with error handling
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const token = TokenManager.getToken();
      const url = `${this.API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Analyze uploaded file
   */
  async analyzeFile(file) {
    try {
      const token = TokenManager.getToken();
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch(`${this.API_BASE_URL}/api/document/analyze-file`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData, // Don't set Content-Type header for FormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('File analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze text input
   */
  async analyzeText(text) {
    return this.makeRequest('/api/document/analyze-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  /**
   * Send chat message with document context
   */
  async sendChatMessage(message, documentContext = null) {
    return this.makeRequest('/api/document/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message, 
        documentContext 
      }),
    });
  }

  /**
   * Save document analysis to history
   */
  async saveToHistory(documentData) {
    return this.makeRequest('/api/document-history', {
      method: 'POST',
      body: JSON.stringify({
        fileName: documentData.fileName,
        documentType: documentData.documentType || 'Unknown Document',
        summary: documentData.summary,
        riskLevel: documentData.riskLevel,
        redFlagsCount: documentData.redFlagsCount || 0,
        clausesCount: documentData.clausesCount || 0,
        analysisData: documentData.analysisData || documentData
      }),
    });
  }

  /**
   * Get user's document history
   */
  async getHistory(limit = 10, offset = 0) {
    return this.makeRequest(`/api/document-history?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get specific document from history
   */
  async getHistoryById(id) {
    return this.makeRequest(`/api/document-history/${id}`);
  }

  /**
   * Delete document from history
   */
  async deleteFromHistory(id) {
    return this.makeRequest(`/api/document-history/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Clear all user's document history
   */
  async clearHistory() {
    return this.makeRequest('/api/document-history', {
      method: 'DELETE',
    });
  }

  /**
   * Get document history stats
   */
  async getHistoryStats() {
    return this.makeRequest('/api/document-history/stats');
  }

  /**
   * Check server health
   */
  async healthCheck() {
    return this.makeRequest('/health');
  }
}

// Export singleton instance
export const documentAPI = new DocumentAPI();
export default DocumentAPI;