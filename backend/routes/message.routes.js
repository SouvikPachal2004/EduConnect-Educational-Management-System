const express = require('express');
const { 
  sendMessage,
  getMessagesForUser,
  getMessageById,
  saveDraft,
  updateDraft,
  sendDraft,
  deleteMessage
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Send message
router.post('/', sendMessage);

// Get messages for user
router.get('/', getMessagesForUser);

// Get specific message
router.get('/:id', getMessageById);

// Draft management
router.post('/drafts', saveDraft);
router.put('/drafts/:id', updateDraft);
router.post('/drafts/:id/send', sendDraft);

// Delete message
router.delete('/:id', deleteMessage);

module.exports = router;