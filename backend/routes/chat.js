const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/aiService');

// Get user's chat conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Use userId from JWT token
    
    const conversations = await db.query(`
      SELECT 
        c.*,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at
      FROM chat_conversations c
      LEFT JOIN chat_messages m ON c.id = m.conversation_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.updated_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: conversations.rows
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Use userId from JWT token
    const { conversationId } = req.params;

    // Verify conversation belongs to user
    const conversation = await db.query(
      'SELECT id FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (conversation.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    const messages = await db.query(`
      SELECT *
      FROM chat_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `, [conversationId]);

    res.json({
      success: true,
      data: messages.rows
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// Create a new conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Use userId from JWT token
    const { title, documentContext } = req.body;

    const result = await db.query(`
      INSERT INTO chat_conversations (user_id, title, document_context)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, title || 'New Conversation', documentContext || null]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation'
    });
  }
});

// Send a message in a conversation
router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Use userId from JWT token
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    // Verify conversation belongs to user
    const conversation = await db.query(
      'SELECT id FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (conversation.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Insert user message
    const userMessage = await db.query(`
      INSERT INTO chat_messages (conversation_id, user_id, message_type, content)
      VALUES ($1, $2, 'user', $3)
      RETURNING *
    `, [conversationId, userId, content.trim()]);

    // Generate AI response using the AI service
    const startTime = Date.now();
    
    console.log(`🤖 Generating AI response for: "${content.trim()}"`);
    const aiResult = await aiService.generateChatResponse(content.trim());
    
    const responseTime = Date.now() - startTime;
    console.log(`⚡ AI response generated in ${responseTime}ms`);

    // Insert AI response
    const aiMessage = await db.query(`
      INSERT INTO chat_messages (conversation_id, user_id, message_type, content, ai_provider, response_time_ms)
      VALUES ($1, $2, 'ai', $3, $4, $5)
      RETURNING *
    `, [conversationId, userId, aiResult.content, aiResult.provider, responseTime]);

    res.json({
      success: true,
      data: {
        userMessage: userMessage.rows[0],
        aiMessage: aiMessage.rows[0]
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Delete a conversation
router.delete('/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Use userId from JWT token
    const { conversationId } = req.params;

    const result = await db.query(
      'DELETE FROM chat_conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [conversationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
});

// Simple chat endpoint without authentication for general chatbot functionality
router.post('/', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    console.log('💬 Received chat message:', message);
    
    // Generate AI response using the AI service
    const aiResponse = await aiService.generateChatResponse(message, context);
    
    console.log('🤖 AI response generated:', aiResponse);
    
    res.json({
      success: true,
      response: aiResponse,
      message: 'Chat response generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate chat response',
      error: error.message
    });
  }
});

module.exports = router;