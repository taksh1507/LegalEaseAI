const router = require('express').Router();
const db = require('../config/database');
const ai = require('../services/aiService');
const httpError = require('../utils/httpError');
function endpoint(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}
function conversationId(value) {
  const id = Number(value);
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(id) || id < 1 || id > 2147483647)
    throw httpError(400, 'Invalid conversation ID');
  return id;
}
async function ownedConversation(id, owner) {
  const result = await db.query(
    'SELECT id, document_context FROM chat_conversations WHERE id = $1 AND user_id = $2',
    [id, owner],
  );
  if (!result.rows[0]) throw httpError(404, 'Conversation not found');
  return result.rows[0];
}
router.get(
  '/conversations',
  endpoint(async (req, res) => {
    const result = await db.query(
      'SELECT c.*, COUNT(m.id)::integer AS message_count, MAX(m.created_at) AS last_message_at FROM chat_conversations c LEFT JOIN chat_messages m ON c.id = m.conversation_id WHERE c.user_id = $1 GROUP BY c.id ORDER BY c.updated_at DESC, c.id DESC',
      [req.userId],
    );
    res.json({ success: true, data: result.rows });
  }),
);
router.post(
  '/conversations',
  endpoint(async (req, res) => {
    const { title = 'New Conversation', documentContext = '' } = req.body || {};
    if (
      typeof title !== 'string' ||
      !title.trim() ||
      title.length > 500 ||
      typeof documentContext !== 'string' ||
      documentContext.length > 60000
    )
      throw httpError(400, 'Invalid conversation title or context');
    const result = await db.query(
      'INSERT INTO chat_conversations (user_id, title, document_context) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, title.trim(), documentContext],
    );
    res.json({ success: true, data: result.rows[0] });
  }),
);
router.get(
  '/conversations/:conversationId/messages',
  endpoint(async (req, res) => {
    const id = conversationId(req.params.conversationId);
    await ownedConversation(id, req.userId);
    const result = await db.query(
      'SELECT * FROM chat_messages WHERE conversation_id = $1 AND user_id = $2 ORDER BY created_at ASC, id ASC',
      [id, req.userId],
    );
    res.json({ success: true, data: result.rows });
  }),
);
router.post(
  '/conversations/:conversationId/messages',
  endpoint(async (req, res) => {
    const id = conversationId(req.params.conversationId);
    const conversation = await ownedConversation(id, req.userId);
    const { content } = req.body || {};
    if (typeof content !== 'string' || !content.trim() || content.length > 4000)
      throw httpError(400, 'Message must contain 1 to 4000 characters');
    const started = Date.now();
    const response = await ai.generateChatResponse(
      content.trim(),
      conversation.document_context || '',
    );
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const check = await client.query(
        'SELECT id FROM chat_conversations WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [id, req.userId],
      );
      if (!check.rows[0]) throw httpError(404, 'Conversation not found');
      const user = await client.query(
        "INSERT INTO chat_messages (conversation_id, user_id, message_type, content) VALUES ($1, $2, 'user', $3) RETURNING *",
        [id, req.userId, content.trim()],
      );
      const reply = await client.query(
        "INSERT INTO chat_messages (conversation_id, user_id, message_type, content, ai_provider, response_time_ms) VALUES ($1, $2, 'ai', $3, $4, $5) RETURNING *",
        [id, req.userId, response, 'OpenRouter', Date.now() - started],
      );
      await client.query('COMMIT');
      res.json({
        success: true,
        data: {
          userMessage: user.rows[0],
          aiMessage: reply.rows[0],
          responseTime: Date.now() - started,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),
);
router.delete(
  '/conversations/:conversationId',
  endpoint(async (req, res) => {
    const result = await db.query(
      'DELETE FROM chat_conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [conversationId(req.params.conversationId), req.userId],
    );
    if (!result.rows[0]) throw httpError(404, 'Conversation not found');
    res.json({ success: true, message: 'Conversation deleted successfully' });
  }),
);
router.post(
  '/',
  endpoint(async (req, res) =>
    res.json({
      success: true,
      response: await ai.generateChatResponse(req.body?.message, req.body?.context),
      message: 'Chat response generated successfully',
    }),
  ),
);
module.exports = router;
