const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const classRoutes = require('./routes/class.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const gradeRoutes = require('./routes/grade.routes');
const resourceRoutes = require('./routes/resource.routes');
const messageRoutes = require('./routes/message.routes');
const departmentRoutes = require('./routes/department.routes');
const activityLogRoutes = require('./routes/activityLog.routes');
const faceRecognitionRoutes = require('./routes/faceRecognition.routes');
const predictionRoutes = require('./routes/prediction.routes');
const teacherRoutes = require('./routes/separateTeacher.routes');
const hodRoutes = require('./routes/hod.routes');
const managingAuthorityRoutes = require('./routes/managingAuthority.routes');
const approvalRoutes = require('./routes/approval.routes');
const subjectRoutes = require('./routes/subject.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const meetingRoutes = require('./routes/meeting.routes');
const announcementRoutes = require('./routes/announcement.routes');
const programRoutes = require('./routes/program.routes');
const courseRoutes = require('./routes/course.routes');

// Connect to database
connectDB();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5002;

// Auto-cleanup: end old meetings from PREVIOUS days only (not today's meetings)
async function cleanupOldMeetings() {
    try {
        const Meeting = require('./models/Meeting');
        const Class = require('./models/Class');
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const oldMeetings = await Meeting.find({ isActive: true });
        for (const m of oldMeetings) {
            const day = new Date(m.createdAt); day.setHours(0,0,0,0);
            const schedDay = m.scheduledDate ? new Date(m.scheduledDate) : null;
            // Only clean up meetings from BEFORE today (not today's meetings)
            const isOldDay = day < today;
            const schedOld = schedDay && schedDay < today;
            if (isOldDay && !schedDay || schedOld) {
                m.isActive = false; m.endedAt = new Date(); await m.save();
                if (m.classId) await Class.findByIdAndUpdate(m.classId, { meetingLink: '' });
            }
        }
    } catch (e) { console.error('cleanupOldMeetings error:', e.message); }
}
setInterval(cleanupOldMeetings, 60 * 60 * 1000); // every hour
cleanupOldMeetings(); // run once on startup

// Auto-sync active meeting links to class records every 10 seconds
// This ensures student dashboard shows Join button immediately when teacher starts
async function syncActiveMeetingLinks() {
    try {
        const Meeting = require('./models/Meeting');
        const Class = require('./models/Class');
        const activeMeetings = await Meeting.find({ isActive: true, classId: { $ne: null } });
        for (const m of activeMeetings) {
            if (m.meetingLink && m.classId) {
                await Class.findByIdAndUpdate(m.classId, { meetingLink: m.meetingLink });
            }
        }
        // Also clear links for ended meetings
        const endedMeetings = await Meeting.find({ isActive: false, classId: { $ne: null }, endedAt: { $exists: true } });
        const endedClassIds = endedMeetings.map(m => String(m.classId));
        // Only clear if no other active meeting exists for that class
        for (const classId of new Set(endedClassIds)) {
            const stillActive = await Meeting.findOne({ classId, isActive: true });
            if (!stillActive) {
                await Class.findByIdAndUpdate(classId, { meetingLink: '' });
            }
        }
    } catch (e) { /* silent */ }
}
setInterval(syncActiveMeetingLinks, 10000); // every 10 seconds
syncActiveMeetingLinks(); // run immediately on startup

// Middleware — allow all origins (works on Render, Vercel, any domain)
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend — no caching so changes are reflected immediately
app.use(express.static(path.join(__dirname, '../frontend'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/face-recognition', faceRecognitionRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/managing-authority', managingAuthorityRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/courses', courseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'EduConnect backend is running',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend for any other routes (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`EduConnect backend server running on port ${PORT}`);
});

module.exports = app;