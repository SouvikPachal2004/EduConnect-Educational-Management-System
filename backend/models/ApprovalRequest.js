const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
  requestType: {
    type: String,
    required: true,
    enum: ['department', 'course', 'fest', 'freshers_welcome', 'club', 'introductory_session', 'other'],
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalDate: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // For department requests
  departmentData: {
    name: String,
    code: String,
    description: String,
    hod: String,
    hodEmail: String,
    faculty: Number,
    students: Number,
    established: Number,
    budget: String,
  },
  // For course requests
  courseData: {
    name: String,
    code: String,
    description: String,
    department: String,
    credits: Number,
    semester: String,
  },
  // courseId — set after course is created on approval
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  },
  // For event requests (fest, freshers, etc.)
  eventData: {
    eventDate: Date,
    venue: String,
    budget: Number,
    expectedParticipants: Number,
    organizers: [String],
  },
}, {
  timestamps: true,
});

// Index for faster queries
approvalRequestSchema.index({ status: 1, createdAt: -1 });
approvalRequestSchema.index({ requestedBy: 1 });
approvalRequestSchema.index({ requestType: 1 });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
