const express = require('express');
const { 
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource
} = require('../controllers/resource.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const multer = require('multer');

const router = express.Router();

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

router.use(protect);

// Teacher can create resources
router.post('/', authorize('teacher', 'admin'), upload.single('file'), createResource);

// Anyone can get resources (with appropriate filtering in controller)
router.get('/', getAllResources);

// Anyone can get a specific resource
router.get('/:id', getResourceById);

// Teacher can update/delete resources
router.put('/:id', authorize('teacher', 'admin'), updateResource);
router.delete('/:id', authorize('teacher', 'admin'), deleteResource);

module.exports = router;