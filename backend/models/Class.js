const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    unique: true,
    default: () => uuidv4().substring(0, 8).toUpperCase(),
  },
  description: {
    type: String,
    trim: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    }],
    startTime: {
      type: String, // Format: "HH:MM"
    },
    endTime: {
      type: String, // Format: "HH:MM"
    },
    location: {
      type: String,
      trim: true,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
classSchema.index({ code: 1 });
classSchema.index({ teacher: 1 });

module.exports = mongoose.model('Class', classSchema);