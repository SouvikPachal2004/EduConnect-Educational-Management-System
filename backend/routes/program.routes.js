const express = require('express');
const {
  getAllPrograms,
  getProgramById,
  getProgramDepartments,
  getProgramSubjects,
  createProgram,
  updateProgram,
  deleteProgram,
} = require('../controllers/program.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getAllPrograms);
router.get('/:id', getProgramById);
router.get('/:id/departments', getProgramDepartments);
router.get('/:id/subjects', getProgramSubjects);

router.post('/', authorize('admin', 'managing_authority'), createProgram);
router.put('/:id', authorize('admin', 'managing_authority'), updateProgram);
router.delete('/:id', authorize('admin', 'managing_authority'), deleteProgram);

module.exports = router;
