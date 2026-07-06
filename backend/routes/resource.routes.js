const express = require('express');
const path = require('path');
const fs = require('fs');
const { 
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
  downloadResource,
  viewResource
} = require('../controllers/resource.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const multer = require('multer');

const router = express.Router();

// Absolute uploads directory (always relative to backend folder, not CWD)
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename — remove special chars that can break paths
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

router.use(protect);

// Teacher and HOD can create resources
router.post('/', authorize('teacher', 'admin', 'hod'), upload.single('file'), createResource);

// Anyone can get resources (with appropriate filtering in controller)
router.get('/', getAllResources);

// View and download resource files
router.get('/:id/view', viewResource);
router.get('/:id/download', downloadResource);

// Anyone can get a specific resource
router.get('/:id', getResourceById);

// Teacher/HOD can update/delete resources
router.put('/:id', authorize('teacher', 'admin', 'hod'), updateResource);
router.delete('/:id', authorize('teacher', 'admin', 'hod'), deleteResource);

module.exports = router;