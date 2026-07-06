const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  // 'all' = everyone, 'hods' = only HODs, 'teachers' = only teachers, 'students' = only students
  targetAudience: { type: String, default: 'all' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postedByName: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
}, { timestamps: true });

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ targetAudience: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
