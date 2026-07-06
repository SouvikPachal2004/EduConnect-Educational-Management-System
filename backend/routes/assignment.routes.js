const express = require('express');
const path = require('path');
const fs = require('fs');
const { 
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissionsForAssignment,
  gradeSubmission
} = require('../controllers/assignment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

const router = express.Router();

router.use(protect);

// Teacher and HOD can create assignments with file upload
router.post('/', authorize('teacher', 'admin', 'hod'), upload.single('file'), createAssignment);

// Anyone can get assignments (with appropriate filtering in controller)
router.get('/', getAllAssignments);

// Download assignment attachment — must come BEFORE /:id route
router.get('/:id/download/:filename', async (req, res) => {
  try {
    const Assignment = require('../models/Assignment');
    const asg = await Assignment.findById(req.params.id);
    if (!asg) return res.status(404).json({ message: 'Assignment not found' });
    const att = asg.attachments.find(a => a.fileName === req.params.filename);
    if (!att) return res.status(404).json({ message: 'File not found' });
    const absPath = path.resolve(att.filePath);
    if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'File not found on server' });
    res.setHeader('Content-Disposition', `attachment; filename="${att.fileName}"`);
    res.setHeader('Content-Type', att.fileType || 'application/octet-stream');
    res.sendFile(absPath);
  } catch (err) {
    res.status(500).json({ message: 'Download failed', error: err.message });
  }
});

// Download submission attachment — must come BEFORE /:id route
router.get('/submissions/:id/download/:filename', async (req, res) => {
  try {
    const Submission = require('../models/Submission');
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Submission not found' });
    const att = sub.attachments.find(a => a.fileName === req.params.filename);
    if (!att) return res.status(404).json({ message: 'File not found' });
    const absPath = path.resolve(att.filePath);
    if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'File not found on server' });
    res.setHeader('Content-Disposition', `attachment; filename="${att.fileName}"`);
    res.setHeader('Content-Type', att.fileType || 'application/octet-stream');
    res.sendFile(absPath);
  } catch (err) {
    res.status(500).json({ message: 'Download failed', error: err.message });
  }
});

// Anyone can get a specific assignment
router.get('/:id', getAssignmentById);

// Teacher/HOD/Admin can update assignments with file upload
router.put('/:id', authorize('teacher', 'admin', 'hod'), upload.single('file'), updateAssignment);

// Teacher/HOD/Admin can delete assignments
router.delete('/:id', authorize('teacher', 'admin', 'hod'), deleteAssignment);

// Student can submit assignments with file upload
router.post('/:id/submit', authorize('student'), upload.single('file'), submitAssignment);

// Teacher/HOD/Admin can view submissions and grade them
router.get('/:id/submissions', authorize('teacher', 'admin', 'hod'), getSubmissionsForAssignment);
router.put('/submissions/:id/grade', authorize('teacher', 'admin', 'hod'), gradeSubmission);

module.exports = router;