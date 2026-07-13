const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  maxPoints: {
    type: Number,
    default: 100,
  },
  attachments: [{
    fileName: String,
    filePath: String,          // legacy: disk path (may be wiped on server restart)
    fileType: String,
    fileSize: Number,
    data: Buffer,              // file bytes stored in DB so it survives restarts
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

// Indexes
assignmentSchema.index({ class: 1 });
assignmentSchema.index({ teacher: 1 });
assignmentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);