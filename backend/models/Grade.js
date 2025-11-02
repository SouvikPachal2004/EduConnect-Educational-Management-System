const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
  },
  type: {
    type: String,
    enum: ['assignment', 'exam', 'participation', 'project', 'other'],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  points: {
    type: Number,
    required: true,
  },
  maxPoints: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  letterGrade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'],
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes
gradeSchema.index({ student: 1 });
gradeSchema.index({ class: 1 });
gradeSchema.index({ assignment: 1 });

module.exports = mongoose.model('Grade', gradeSchema);