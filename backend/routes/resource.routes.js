const express = require('express');
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

// Store uploads in memory so the file bytes can be persisted in MongoDB.
// Render's filesystem is ephemeral, so files written to disk are lost on every
// restart/redeploy — storing the buffer in the database keeps files available.
const storage = multer.memoryStorage();

// 15MB limit keeps each resource comfortably under MongoDB's 16MB document cap.
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

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