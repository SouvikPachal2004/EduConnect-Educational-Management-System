const mongoose = require('mongoose');

const enrollmentRequestSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  message: {
    type: String,
    default: '',
  },
  respondedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
enrollmentRequestSchema.index({ student: 1, status: 1 });
enrollmentRequestSchema.index({ class: 1, status: 1 });
enrollmentRequestSchema.index({ teacher: 1 });

// Prevent duplicate enrollment requests
enrollmentRequestSchema.index({ class: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('EnrollmentRequest', enrollmentRequestSchema);
