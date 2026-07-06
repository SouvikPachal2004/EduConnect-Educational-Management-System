const Program = require('../models/Program');
const Department = require('../models/Department');
const Course = require('../models/Course');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get all programs
// @route   GET /api/programs
// @access  Private
const getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.find({ isActive: true }).sort({ name: 1 });

    // Attach department and subject counts
    const programsWithCounts = await Promise.all(programs.map(async (prog) => {
      const deptCount = await Department.countDocuments({ program: prog._id, isActive: true });
      const subjectCount = await Course.countDocuments({ program: prog._id, isActive: true });
      return {
        ...prog.toObject(),
        departmentCount: deptCount,
        subjectCount: subjectCount,
      };
    }));

    successResponse(res, { programs: programsWithCounts, count: programsWithCounts.length }, 'Programs retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching programs', 500, error.message);
  }
};

// @desc    Get single program
// @route   GET /api/programs/:id
// @access  Private
const getProgramById = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }
    successResponse(res, program, 'Program retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching program', 500, error.message);
  }
};

// @desc    Get departments under a program
// @route   GET /api/programs/:id/departments
// @access  Private
const getProgramDepartments = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    const departments = await Department.find({ program: req.params.id, isActive: true }).sort({ name: 1 });
    successResponse(res, { departments, count: departments.length }, 'Departments retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching departments', 500, error.message);
  }
};

// @desc    Get subjects/courses under a program
// @route   GET /api/programs/:id/subjects
// @access  Private
const getProgramSubjects = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    const subjects = await Course.find({ program: req.params.id, isActive: true }).sort({ semester: 1, name: 1 });
    successResponse(res, { subjects, count: subjects.length }, 'Subjects retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching subjects', 500, error.message);
  }
};

// @desc    Create program
// @route   POST /api/programs
// @access  Private (Admin)
const createProgram = async (req, res) => {
  try {
    const { name, code, description, duration, totalSemesters } = req.body;

    // Check for duplicate code
    const existing = await Program.findOne({ code: code.toUpperCase() });
    if (existing) {
      return errorResponse(res, 'A program with this code already exists', 400);
    }

    const program = await Program.create({
      name,
      code: code.toUpperCase(),
      description,
      duration,
      totalSemesters,
      createdBy: req.user._id,
    });

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'program_creation',
      actionLabel: 'Program creation',
      description: `Created program: ${name} (${code.toUpperCase()})`,
      ipAddress: req.ip || 'Unknown',
      status: 'success',
    });

    successResponse(res, program, 'Program created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Error creating program', 500, error.message);
  }
};

// @desc    Update program
// @route   PUT /api/programs/:id
// @access  Private (Admin)
const updateProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }

    const updated = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    successResponse(res, updated, 'Program updated successfully');
  } catch (error) {
    errorResponse(res, 'Error updating program', 500, error.message);
  }
};

// @desc    Delete (deactivate) program
// @route   DELETE /api/programs/:id
// @access  Private (Admin)
const deleteProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    program.isActive = false;
    await program.save();

    successResponse(res, null, 'Program deactivated successfully');
  } catch (error) {
    errorResponse(res, 'Error deleting program', 500, error.message);
  }
};

module.exports = {
  getAllPrograms,
  getProgramById,
  getProgramDepartments,
  getProgramSubjects,
  createProgram,
  updateProgram,
  deleteProgram,
};
