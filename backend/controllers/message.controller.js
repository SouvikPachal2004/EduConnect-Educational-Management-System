const Message = require('../models/Message');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Send message
const sendMessage = async (req, res) => {
  try {
    const { recipients, subject, content, parentId } = req.body;
    
    // Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return errorResponse(res, 'At least one recipient is required', 400);
    }
    
    // Check if all recipients exist
    const validRecipients = await User.find({
      _id: { $in: recipients },
      isActive: true
    });
    
    if (validRecipients.length !== recipients.length) {
      return errorResponse(res, 'One or more recipients are invalid', 400);
    }
    
    const message = new Message({
      sender: req.user.id,
      recipients,
      subject,
      content,
      parentMessage: parentId || null,
    });
    
    // If it's a reply, mark parent as having replies
    if (parentId) {
      const parentMessage = await Message.findById(parentId);
      if (parentMessage && parentMessage.sender.toString() !== req.user.id) {
        // Add sender to recipients if not already there
        if (!parentMessage.recipients.includes(req.user.id)) {
          parentMessage.recipients.push(req.user.id);
          await parentMessage.save();
        }
      }
    }
    
    await message.save();
    
    // Populate references
    await message.populate([
      { path: 'sender', select: 'name email' },
      { path: 'recipients', select: 'name email' }
    ]);
    
    successResponse(res, message, 'Message sent successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to send message', 500, error.message);
  }
};

// Get messages for user
const getMessagesForUser = async (req, res) => {
  try {
    const { folder = 'inbox', page = 1, limit = 10 } = req.query;
    
    // Build filter based on folder
    let filter = {};
    
    switch (folder) {
      case 'inbox':
        filter.recipients = req.user.id;
        filter.isDraft = false;
        filter.isDeleted = false;
        break;
      case 'sent':
        filter.sender = req.user.id;
        filter.isDraft = false;
        filter.isDeleted = false;
        break;
      case 'drafts':
        filter.sender = req.user.id;
        filter.isDraft = true;
        break;
      default:
        filter.$or = [
          { recipients: req.user.id },
          { sender: req.user.id }
        ];
        filter.isDeleted = false;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get messages
    const messages = await Message.find(filter)
      .populate([
        { path: 'sender', select: 'name email' },
        { path: 'recipients', select: 'name email' }
      ])
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    // Get total count
    const total = await Message.countDocuments(filter);
    
    successResponse(res, {
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Messages fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch messages', 500, error.message);
  }
};

// Get message by ID
const getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate([
        { path: 'sender', select: 'name email' },
        { path: 'recipients', select: 'name email' }
      ]);
      
    if (!message) {
      return errorResponse(res, 'Message not found', 404);
    }
    
    // Check if user is authorized to view this message
    const isSender = message.sender.toString() === req.user.id;
    const isRecipient = message.recipients.some(recipient => 
      recipient._id.toString() === req.user.id
    );
    
    if (!isSender && !isRecipient) {
      return errorResponse(res, 'Not authorized to view this message', 403);
    }
    
    // Mark as read if recipient
    if (isRecipient && !message.isRead) {
      // Check if user has already read it
      const alreadyRead = message.readBy.some(reader => 
        reader.user.toString() === req.user.id
      );
      
      if (!alreadyRead) {
        message.isRead = true;
        message.readBy.push({
          user: req.user.id,
          readAt: new Date(),
        });
        await message.save();
      }
    }
    
    successResponse(res, message, 'Message fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch message', 500, error.message);
  }
};

// Save draft
const saveDraft = async (req, res) => {
  try {
    const { recipients, subject, content, parentId } = req.body;
    
    const draft = new Message({
      sender: req.user.id,
      recipients: recipients || [],
      subject: subject || '',
      content: content || '',
      parentMessage: parentId || null,
      isDraft: true,
    });
    
    await draft.save();
    
    // Populate references
    await draft.populate([
      { path: 'sender', select: 'name email' },
      { path: 'recipients', select: 'name email' }
    ]);
    
    successResponse(res, draft, 'Draft saved successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to save draft', 500, error.message);
  }
};

// Update draft
const updateDraft = async (req, res) => {
  try {
    const { recipients, subject, content } = req.body;
    
    const draft = await Message.findById(req.params.id);
    if (!draft) {
      return errorResponse(res, 'Draft not found', 404);
    }
    
    // Check if user is the sender of this draft
    if (draft.sender.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to update this draft', 403);
    }
    
    // Check if it's actually a draft
    if (!draft.isDraft) {
      return errorResponse(res, 'Message is not a draft', 400);
    }
    
    // Update fields
    if (recipients) draft.recipients = recipients;
    if (subject) draft.subject = subject;
    if (content) draft.content = content;
    
    await draft.save();
    
    // Populate references
    await draft.populate([
      { path: 'sender', select: 'name email' },
      { path: 'recipients', select: 'name email' }
    ]);
    
    successResponse(res, draft, 'Draft updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update draft', 500, error.message);
  }
};

// Send draft
const sendDraft = async (req, res) => {
  try {
    const draft = await Message.findById(req.params.id);
    if (!draft) {
      return errorResponse(res, 'Draft not found', 404);
    }
    
    // Check if user is the sender of this draft
    if (draft.sender.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to send this draft', 403);
    }
    
    // Check if it's actually a draft
    if (!draft.isDraft) {
      return errorResponse(res, 'Message is not a draft', 400);
    }
    
    // Validate recipients
    if (!draft.recipients || draft.recipients.length === 0) {
      return errorResponse(res, 'At least one recipient is required', 400);
    }
    
    // Mark as sent
    draft.isDraft = false;
    draft.sentAt = new Date();
    
    await draft.save();
    
    // Populate references
    await draft.populate([
      { path: 'sender', select: 'name email' },
      { path: 'recipients', select: 'name email' }
    ]);
    
    successResponse(res, draft, 'Draft sent successfully');
  } catch (error) {
    errorResponse(res, 'Failed to send draft', 500, error.message);
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return errorResponse(res, 'Message not found', 404);
    }
    
    // Check if user is authorized to delete this message
    const isSender = message.sender.toString() === req.user.id;
    const isRecipient = message.recipients.some(recipient => 
      recipient._id.toString() === req.user.id
    );
    
    if (!isSender && !isRecipient) {
      return errorResponse(res, 'Not authorized to delete this message', 403);
    }
    
    // Soft delete
    message.isDeleted = true;
    await message.save();
    
    successResponse(res, null, 'Message deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete message', 500, error.message);
  }
};

module.exports = {
  sendMessage,
  getMessagesForUser,
  getMessageById,
  saveDraft,
  updateDraft,
  sendDraft,
  deleteMessage,
};