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
  resourceType: {
    type: String,
    enum: ['file', 'url', 'youtube', 'drive', 'video', 'document', 'other'],
    required: true,
  },
  // For file uploads
  fileName: {
    type: String,
  },
  filePath: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  mimeType: {
    type: String,
  },
  // For URLs (website, YouTube, Drive, etc.)
  url: {
    type: String,
  },
  urlType: {
    type: String,
    enum: ['website', 'youtube', 'drive', 'video', 'other'],
  },
  // Metadata
  thumbnail: {
    type: String,
  },
  duration: {
    type: String, // For videos
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  downloads: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
resourceSchema.index({ class: 1 });
resourceSchema.index({ teacher: 1 });
resourceSchema.index({ resourceType: 1 });

module.exports = mongoose.model('Resource', resourceSchema);