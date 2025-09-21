import { TokenManager } from './authAPI';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ChatAPI {
  // Get all conversations for the current user
  async getConversations() {
    try {
      const token = TokenManager.getToken();
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { success: false, error: 'Failed to fetch conversations' };
    }
  }

  // Create a new conversation
  async createConversation(title = 'New Conversation', documentContext = null) {
    try {
      const token = TokenManager.getToken();
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, documentContext })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: 'Failed to create conversation' };
    }
  }

  // Get messages for a specific conversation
  async getMessages(conversationId) {
    try {
      const token = TokenManager.getToken();
      const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: 'Failed to fetch messages' };
    }
  }

  // Send a message in a conversation
  async sendMessage(conversationId, content) {
    try {
      const token = TokenManager.getToken();
      const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  // Delete a conversation
  async deleteConversation(conversationId) {
    try {
      const token = TokenManager.getToken();
      const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return { success: false, error: 'Failed to delete conversation' };
    }
  }
}

export default new ChatAPI();