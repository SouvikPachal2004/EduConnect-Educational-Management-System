const mongoose = require('mongoose');

const departmentGradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  studentEmail: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10,
  },
  // We can store historical CGPA changes
  history: [{
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    }
  }],
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
departmentGradeSchema.index({ department: 1 });
departmentGradeSchema.index({ student: 1 });
departmentGradeSchema.index({ studentId: 1 });

module.exports = mongoose.model('DepartmentGrade', departmentGradeSchema);