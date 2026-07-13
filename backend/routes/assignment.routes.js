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

// Store uploads IN MEMORY so we can persist the bytes into MongoDB. Render's
// free tier has an ephemeral filesystem (the uploads/ folder is wiped on every
// restart/redeploy), which made downloaded files vanish. Storing the file in
// the DB makes assignment/submission files survive restarts. Cap at 15MB to
// stay under MongoDB's 16MB per-document limit.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

const router = express.Router();

router.use(protect);

// Teacher and HOD can create assignments with file upload
router.post('/', authorize('teacher', 'admin', 'hod'), upload.single('file'), createAssignment);

// Anyone can get assignments (with appropriate filtering in controller)
router.get('/', getAllAssignments);

// Helper: send an attachment from the DB buffer, falling back to disk (legacy)
function sendAttachment(res, att) {
  if (!att) return res.status(404).json({ message: 'File not found' });
  res.setHeader('Content-Disposition', `attachment; filename="${att.fileName}"`);
  res.setHeader('Content-Type', att.fileType || 'application/octet-stream');
  // Preferred: bytes stored in MongoDB (survives server restarts)
  if (att.data && att.data.length) {
    return res.send(Buffer.from(att.data));
  }
  // Legacy fallback: file on disk (may be gone after a restart)
  if (att.filePath) {
    const absPath = path.resolve(att.filePath);
    if (fs.existsSync(absPath)) return res.sendFile(absPath);
  }
  return res.status(404).json({ message: 'File not found on server' });
}

// Download assignment attachment — must come BEFORE /:id route
router.get('/:id/download/:filename', async (req, res) => {
  try {
    const Assignment = require('../models/Assignment');
    const asg = await Assignment.findById(req.params.id);
    if (!asg) return res.status(404).json({ message: 'Assignment not found' });
    const att = asg.attachments.find(a => a.fileName === req.params.filename);
    sendAttachment(res, att);
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
    sendAttachment(res, att);
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