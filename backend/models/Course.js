const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  // Program this subject belongs to (e.g. B.Tech, BCA, MCA)
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    default: null,
  },
  credits: {
    type: Number,
    default: 3,
  },
  semester: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Core', 'Elective', 'Lab', 'Project', 'Other'],
    default: 'Core',
  },
  // Teacher assigned by HOD
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Class created by teacher for this course
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null,
  },
  // Approval request that created this course
  approvalRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalRequest',
  },
  status: {
    type: String,
    enum: ['pending_assignment', 'assigned', 'class_created', 'active'],
    default: 'pending_assignment',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

courseSchema.index({ department: 1 });
courseSchema.index({ program: 1 });
courseSchema.index({ code: 1 });
courseSchema.index({ assignedTeacher: 1 });

module.exports = mongoose.model('Course', courseSchema);
