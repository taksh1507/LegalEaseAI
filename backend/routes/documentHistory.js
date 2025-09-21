const express = require('express');
const router = express.Router();
const DocumentHistoryController = require('../controllers/documentHistoryController');
const { authenticateToken } = require('../middleware/auth');

// All document history routes require authentication
router.use(authenticateToken);

// Create new document history entry
router.post('/', DocumentHistoryController.createHistory);

// Get user's document history (with pagination)
router.get('/', DocumentHistoryController.getUserHistory);

// Get user's document history stats
router.get('/stats', DocumentHistoryController.getHistoryStats);

// Get specific document history entry by ID
router.get('/:id', DocumentHistoryController.getHistoryById);

// Delete specific document history entry
router.delete('/:id', DocumentHistoryController.deleteHistory);

// Clear all user's document history
router.delete('/', DocumentHistoryController.clearUserHistory);

module.exports = router;