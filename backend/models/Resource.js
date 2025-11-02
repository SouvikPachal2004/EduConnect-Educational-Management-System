const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
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
  fileType: {
    type: String,
    enum: ['document', 'video', 'link', 'other'],
    required: true,
  },
  fileName: {
    type: String,
  },
  filePath: {
    type: String,
  },
  fileUrl: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
resourceSchema.index({ class: 1 });
resourceSchema.index({ teacher: 1 });
resourceSchema.index({ fileType: 1 });

module.exports = mongoose.model('Resource', resourceSchema);