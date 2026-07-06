const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a program name'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Please add a program code'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  duration: {
    type: Number,
    required: [true, 'Please add duration in years'],
    min: 1,
    max: 6,
  },
  totalSemesters: {
    type: Number,
    required: [true, 'Please add total semesters'],
    min: 1,
    max: 12,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

programSchema.index({ code: 1 });

module.exports = mongoose.model('Program', programSchema);
