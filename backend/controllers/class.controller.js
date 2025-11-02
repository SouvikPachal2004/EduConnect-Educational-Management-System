const Class = require('../models/Class');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Create class
const createClass = async (req, res) => {
  try {
    const { name, description, schedule } = req.body;
    
    const newClass = new Class({
      name,
      description,
      schedule,
      teacher: req.user.id,
    });
    
    await newClass.save();
    
    // Populate teacher details
    await newClass.populate('teacher', 'name email');
    
    successResponse(res, newClass, 'Class created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create class', 500, error.message);
  }
};

// Get all classes
const getAllClasses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get classes
    const classes = await Class.find()
      .populate('teacher', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    // Get total count
    const total = await Class.countDocuments();
    
    successResponse(res, {
      classes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Classes fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch classes', 500, error.message);
  }
};

// Get class by ID
const getClassById = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email studentId');
      
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    successResponse(res, classItem, 'Class fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch class', 500, error.message);
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const { name, description, schedule, isActive } = req.body;
    
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to update this class', 403);
    }
    
    // Update fields
    if (name) classItem.name = name;
    if (description) classItem.description = description;
    if (schedule) classItem.schedule = schedule;
    if (isActive !== undefined) classItem.isActive = isActive;
    
    await classItem.save();
    
    // Populate teacher details
    await classItem.populate('teacher', 'name email');
    
    successResponse(res, classItem, 'Class updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update class', 500, error.message);
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to delete this class', 403);
    }
    
    await Class.findByIdAndDelete(req.params.id);
    
    successResponse(res, null, 'Class deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete class', 500, error.message);
  }
};

// Add student to class
const addStudentToClass = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to add students to this class', 403);
    }
    
    // Check if student exists and is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return errorResponse(res, 'Invalid student', 400);
    }
    
    // Check if student is already in class
    if (classItem.students.includes(studentId)) {
      return errorResponse(res, 'Student is already in this class', 400);
    }
    
    classItem.students.push(studentId);
    await classItem.save();
    
    // Populate students
    await classItem.populate('students', 'name email studentId');
    
    successResponse(res, classItem, 'Student added to class successfully');
  } catch (error) {
    errorResponse(res, 'Failed to add student to class', 500, error.message);
  }
};

// Remove student from class
const removeStudentFromClass = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to remove students from this class', 403);
    }
    
    // Check if student is in class
    if (!classItem.students.includes(studentId)) {
      return errorResponse(res, 'Student is not in this class', 400);
    }
    
    classItem.students = classItem.students.filter(
      student => student.toString() !== studentId
    );
    
    await classItem.save();
    
    // Populate students
    await classItem.populate('students', 'name email studentId');
    
    successResponse(res, classItem, 'Student removed from class successfully');
  } catch (error) {
    errorResponse(res, 'Failed to remove student from class', 500, error.message);
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
};