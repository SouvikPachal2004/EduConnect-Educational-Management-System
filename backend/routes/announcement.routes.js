const express = require('express');
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/response.utils');

const router = express.Router();

router.use(protect);

// Get announcements (filtered by role for students/teachers/hods)
router.get('/', async (req, res) => {
  try {
    const role = req.user.role;
    let filter = { isActive: true };

    // Build audience filter based on role
    if (role === 'student') {
      filter.targetAudience = { $in: ['all', 'students'] };
    } else if (role === 'teacher') {
      filter.targetAudience = { $in: ['all', 'teachers'] };
    } else if (role === 'hod') {
      filter.targetAudience = { $in: ['all', 'hods', 'teachers'] };
    }
    // admin / managing_authority sees all

    const announcements = await Announcement.find(filter)
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    successResponse(res, { announcements }, 'Announcements fetched');
  } catch (error) {
    errorResponse(res, 'Failed to fetch announcements', 500, error.message);
  }
});

// Create announcement (principal / admin only)
router.post('/', authorize('managing_authority', 'admin'), async (req, res) => {
  try {
    const { title, content, priority, targetAudience, expiresAt } = req.body;
    if (!title || !content) return errorResponse(res, 'Title and content are required', 400);

    const user = await require('../models/User').findById(req.user.id).select('name');
    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      priority: priority || 'medium',
      targetAudience: targetAudience || 'all',
      postedBy: req.user.id,
      postedByName: user ? user.name : 'Principal',
      expiresAt: expiresAt || null,
    });
    await announcement.save();
    successResponse(res, { announcement }, 'Announcement posted successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to post announcement', 500, error.message);
  }
});

// Update announcement
router.put('/:id', authorize('managing_authority', 'admin'), async (req, res) => {
  try {
    const { title, content, priority, targetAudience, isActive } = req.body;
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return errorResponse(res, 'Announcement not found', 404);

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (priority) announcement.priority = priority;
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (isActive !== undefined) announcement.isActive = isActive;
    await announcement.save();

    successResponse(res, { announcement }, 'Announcement updated');
  } catch (error) {
    errorResponse(res, 'Failed to update announcement', 500, error.message);
  }
});

// Delete announcement
router.delete('/:id', authorize('managing_authority', 'admin'), async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    successResponse(res, null, 'Announcement deleted');
  } catch (error) {
    errorResponse(res, 'Failed to delete announcement', 500, error.message);
  }
});

module.exports = router;
