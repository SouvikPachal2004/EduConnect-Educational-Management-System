const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
  },
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
  content: {
    type: String,
    required: true,
  },
  attachments: [{
    fileName: String,
    filePath: String,          // legacy: disk path (may be wiped on server restart)
    fileType: String,
    fileSize: Number,
    data: Buffer,              // file bytes stored in DB so it survives restarts
  }],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  graded: {
    type: Boolean,
    default: false,
  },
  points: {
    type: Number,
  },
  feedback: {
    type: String,
  },
  gradedAt: {
    type: Date,
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
submissionSchema.index({ assignment: 1 });
submissionSchema.index({ student: 1 });
submissionSchema.index({ class: 1 });

module.exports = mongoose.model('Submission', submissionSchema);