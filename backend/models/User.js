const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin', 'hod', 'managing_authority'],
    default: 'student',
  },
  department: {
    type: String,
    trim: true,
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
  },
  teacherId: {
    type: String,
    unique: true,
    sparse: true,
  },
  // Add grade field for students
  grade: {
    type: Number,
    min: 0,
    max: 10,
  },
  // Per-semester CGPAs for students (index = semester - 1)
  semesterCgpas: {
    type: [Number],
    default: [],
  },
  // Current semester
  currentSemester: {
    type: Number,
    min: 1,
    max: 12,
    default: 1,
  },
  // Program reference (for students)
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    default: null,
  },
  profilePicture: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ teacherId: 1 });

module.exports = mongoose.model('User', userSchema);