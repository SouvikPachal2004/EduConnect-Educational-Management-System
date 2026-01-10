const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a department name'],
    unique: true,
    trim: true
  },
  hod: {
    type: String,
    required: [true, 'Please add HOD name'],
    trim: true
  },
  faculty: {
    type: Number,
    required: [true, 'Please add faculty count'],
    min: 0
  },
  students: {
    type: Number,
    required: [true, 'Please add student count'],
    min: 0
  },
  established: {
    type: Number,
    required: [true, 'Please add establishment year'],
    min: 1900,
    max: new Date().getFullYear()
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
