const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: [true, 'Please add an action'],
    enum: [
      'login',
      'logout',
      'user_creation',
      'user_update',
      'user_deletion',
      'department_creation',
      'department_update',
      'department_deletion',
      'course_creation',
      'course_update',
      'course_deletion',
      'grade_submission',
      'attendance_marked',
      'assignment_created',
      'assignment_submitted',
      'resource_upload',
      'system_backup',
      'timetable_update',
      'settings_change',
      'other'
    ]
  },
  actionLabel: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'warning'],
    default: 'success'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ status: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
