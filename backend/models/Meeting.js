const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  role: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'accepted' }, // Join request status
  micOn: { type: Boolean, default: true },
  camOn: { type: Boolean, default: true },
  handRaised: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  // Unique room code used in the URL (e.g. abc-defg-hij)
  roomCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    default: 'Class Meeting',
  },
  // Who created/hosts the meeting
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hostName: { type: String, default: '' },
  hostRole: { type: String, default: '' },
  // Optional link to a class
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  // Audience type: 'class-students' | 'all-hods' | 'department-teachers'
  audience: {
    type: String,
    default: 'class-students',
  },
  // Full join URL
  meetingLink: { type: String, default: '' },
  // Scheduled date and time
  scheduledDate: { type: String, default: '' },
  scheduledTime: { type: String, default: '' },
  participants: [participantSchema],
  chat: [chatMessageSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  endedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
