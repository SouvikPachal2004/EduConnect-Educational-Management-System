const express = require('express');
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
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

const router = express.Router();

router.use(protect);

// Teacher can create assignments with file upload
router.post('/', authorize('teacher', 'admin'), upload.single('file'), createAssignment);

// Anyone can get assignments (with appropriate filtering in controller)
router.get('/', getAllAssignments);

// Anyone can get a specific assignment
router.get('/:id', getAssignmentById);

// Teacher can update assignments with file upload
router.put('/:id', authorize('teacher', 'admin'), upload.single('file'), updateAssignment);

// Teacher can delete assignments
router.delete('/:id', authorize('teacher', 'admin'), deleteAssignment);

// Student can submit assignments with file upload
router.post('/:id/submit', authorize('student'), upload.single('file'), submitAssignment);

// Teacher can view submissions and grade them
router.get('/:id/submissions', authorize('teacher', 'admin'), getSubmissionsForAssignment);
router.put('/submissions/:id/grade', authorize('teacher', 'admin'), gradeSubmission);

// Download assignment file
router.get('/:id/download/:filename', getAssignmentById);

// Download submission file
router.get('/submissions/:id/download/:filename', getSubmissionsForAssignment);

module.exports = router;