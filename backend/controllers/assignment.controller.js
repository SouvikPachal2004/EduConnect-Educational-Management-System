const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Class = require('../models/Class');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Create assignment
const createAssignment = async (req, res) => {
  try {
    const { title, description, classId, dueDate, maxPoints } = req.body;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to create assignment for this class', 403);
    }
    
    const assignment = new Assignment({
      title,
      description,
      class: classId,
      teacher: req.user.id,
      dueDate: new Date(dueDate),
      maxPoints,
    });
    
    await assignment.save();
    
    // Populate class and teacher details
    await assignment.populate([
      { path: 'class', select: 'name code' },
      { path: 'teacher', select: 'name email' }
    ]);
    
    successResponse(res, assignment, 'Assignment created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create assignment', 500, error.message);
  }
};

// Get all assignments
const getAllAssignments = async (req, res) => {
  try {
    const { classId, status, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (classId) filter.class = classId;
    if (status) filter.status = status;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get assignments
    const assignments = await Assignment.find(filter)
      .populate([
        { path: 'class', select: 'name code' },
        { path: 'teacher', select: 'name email' }
      ])
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    // Get total count
    const total = await Assignment.countDocuments(filter);
    
    successResponse(res, {
      assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Assignments fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch assignments', 500, error.message);
  }
};

// Get assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate([
        { path: 'class', select: 'name code' },
        { path: 'teacher', select: 'name email' }
      ]);
      
    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }
    
    successResponse(res, assignment, 'Assignment fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch assignment', 500, error.message);
  }
};

// Update assignment
const updateAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, maxPoints, status } = req.body;
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }
    
    // Check if user is the teacher of this assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to update this assignment', 403);
    }
    
    // Update fields
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (maxPoints) assignment.maxPoints = maxPoints;
    if (status) assignment.status = status;
    
    await assignment.save();
    
    // Populate class and teacher details
    await assignment.populate([
      { path: 'class', select: 'name code' },
      { path: 'teacher', select: 'name email' }
    ]);
    
    successResponse(res, assignment, 'Assignment updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update assignment', 500, error.message);
  }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }
    
    // Check if user is the teacher of this assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to delete this assignment', 403);
    }
    
    await Assignment.findByIdAndDelete(req.params.id);
    
    successResponse(res, null, 'Assignment deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete assignment', 500, error.message);
  }
};

// Submit assignment
const submitAssignment = async (req, res) => {
  try {
    const { content } = req.body;
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }
    
    // Check if assignment is published
    if (assignment.status !== 'published') {
      return errorResponse(res, 'Assignment is not published', 400);
    }
    
    // Check if user is a student
    if (req.user.role !== 'student') {
      return errorResponse(res, 'Only students can submit assignments', 403);
    }
    
    // Check if student is enrolled in the class
    const classItem = await Class.findById(assignment.class);
    if (!classItem.students.includes(req.user.id)) {
      return errorResponse(res, 'Not enrolled in this class', 403);
    }
    
    // Check if submission already exists
    const existingSubmission = await Submission.findOne({
      assignment: req.params.id,
      student: req.user.id,
    });
    
    if (existingSubmission) {
      return errorResponse(res, 'Assignment already submitted', 400);
    }
    
    const submission = new Submission({
      assignment: req.params.id,
      student: req.user.id,
      class: assignment.class,
      content,
    });
    
    await submission.save();
    
    // Populate references
    await submission.populate([
      { path: 'assignment', select: 'title' },
      { path: 'student', select: 'name email' },
      { path: 'class', select: 'name' }
    ]);
    
    successResponse(res, submission, 'Assignment submitted successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to submit assignment', 500, error.message);
  }
};

// Get submissions for assignment (teacher only)
const getSubmissionsForAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }
    
    // Check if user is the teacher of this assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to view submissions for this assignment', 403);
    }
    
    const submissions = await Submission.find({ assignment: req.params.id })
      .populate([
        { path: 'student', select: 'name email studentId' },
        { path: 'class', select: 'name' }
      ])
      .sort({ submittedAt: -1 });
    
    successResponse(res, submissions, 'Submissions fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch submissions', 500, error.message);
  }
};

// Grade submission
const gradeSubmission = async (req, res) => {
  try {
    const { points, feedback } = req.body;
    
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return errorResponse(res, 'Submission not found', 404);
    }
    
    // Check if user is the teacher of this assignment
    const assignment = await Assignment.findById(submission.assignment);
    if (assignment.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to grade this submission', 403);
    }
    
    // Update submission
    submission.points = points;
    submission.feedback = feedback;
    submission.graded = true;
    submission.gradedAt = Date.now();
    submission.gradedBy = req.user.id;
    
    await submission.save();
    
    // Populate references
    await submission.populate([
      { path: 'assignment', select: 'title' },
      { path: 'student', select: 'name email' },
      { path: 'class', select: 'name' },
      { path: 'gradedBy', select: 'name email' }
    ]);
    
    successResponse(res, submission, 'Submission graded successfully');
  } catch (error) {
    errorResponse(res, 'Failed to grade submission', 500, error.message);
  }
};

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissionsForAssignment,
  gradeSubmission,
};