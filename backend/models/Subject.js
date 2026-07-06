const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
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
    default: '',
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  credits: {
    type: Number,
    default: 3,
    min: 1,
    max: 10,
  },
  semester: {
    type: String,
    trim: true,
    default: '',
  },
  // HOD who created this subject
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Teacher assigned by HOD
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Class created by teacher for this subject
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null,
  },
  // Workflow status
  status: {
    type: String,
    enum: ['pending_assignment', 'assigned', 'class_created'],
    default: 'pending_assignment',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

subjectSchema.index({ department: 1 });
subjectSchema.index({ code: 1, department: 1 }, { unique: true });
subjectSchema.index({ assignedTeacher: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
