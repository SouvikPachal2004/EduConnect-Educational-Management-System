const Course = require('../models/Course');
const Program = require('../models/Program');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get all courses (optionally filtered by program)
// @route   GET /api/courses
// @access  Private
const getAllCourses = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.program) filter.program = req.query.program;
    if (req.query.department) filter.department = req.query.department;

    const courses = await Course.find(filter)
      .populate('program', 'name code')
      .sort({ semester: 1, name: 1 });

    successResponse(res, { courses, count: courses.length }, 'Courses retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching courses', 500, error.message);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('program', 'name code');
    if (!course) return errorResponse(res, 'Course not found', 404);
    successResponse(res, course, 'Course retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching course', 500, error.message);
  }
};

// @desc    Create a course (subject catalog entry)
// @route   POST /api/courses
// @access  Private (Admin, Teacher)
const createCourse = async (req, res) => {
  try {
    const { name, code, description, department, program, credits, semester, type } = req.body;

    // Validate program if provided
    if (program) {
      const prog = await Program.findById(program);
      if (!prog) return errorResponse(res, 'Program not found', 404);
    }

    // Check for duplicate code within same program/department
    const existing = await Course.findOne({
      code: code.toUpperCase(),
      ...(program ? { program } : {}),
      isActive: true,
    });
    if (existing) {
      return errorResponse(res, 'A course with this code already exists in this program', 400);
    }

    const course = await Course.create({
      name,
      code: code.toUpperCase(),
      description,
      department,
      program: program || null,
      credits,
      semester,
      type: type || 'Core',
    });

    await course.populate('program', 'name code');

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'course_creation',
      actionLabel: 'Course creation',
      description: `Created subject: ${name} (${code.toUpperCase()})`,
      ipAddress: req.ip || 'Unknown',
      status: 'success',
    });

    successResponse(res, course, 'Course created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Error creating course', 500, error.message);
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (Admin, Teacher)
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 'Course not found', 404);

    if (req.body.code) req.body.code = req.body.code.toUpperCase();

    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('program', 'name code');

    successResponse(res, updated, 'Course updated successfully');
  } catch (error) {
    errorResponse(res, 'Error updating course', 500, error.message);
  }
};

// @desc    Delete (deactivate) a course
// @route   DELETE /api/courses/:id
// @access  Private (Admin, Teacher)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return errorResponse(res, 'Course not found', 404);

    course.isActive = false;
    await course.save();

    successResponse(res, null, 'Course deleted successfully');
  } catch (error) {
    errorResponse(res, 'Error deleting course', 500, error.message);
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
