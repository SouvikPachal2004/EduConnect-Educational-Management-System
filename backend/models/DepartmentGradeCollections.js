// This file defines separate models for each department's grade collection

const mongoose = require('mongoose');

// Base schema for department grades
const baseGradeSchema = new mongoose.Schema({
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

// Function to create a model for a specific department
const getDepartmentGradeModel = (departmentName) => {
  // Sanitize department name for collection name
  const sanitizedName = departmentName.replace(/[^a-zA-Z0-9]/g, '');
  const modelName = `${sanitizedName}Grade`;
  const collectionName = `${sanitizedName}-Grade`;
  
  // Check if model already exists
  if (mongoose.models[modelName]) {
    return mongoose.model(modelName);
  }
  
  // Create and return new model
  return mongoose.model(modelName, baseGradeSchema, collectionName);
};

module.exports = {
  getDepartmentGradeModel,
  baseGradeSchema
};