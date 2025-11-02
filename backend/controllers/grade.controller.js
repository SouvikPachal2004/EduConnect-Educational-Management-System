const Grade = require('../models/Grade');
const Class = require('../models/Class');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Create grade
const createGrade = async (req, res) => {
  try {
    const { studentId, classId, assignmentId, type, name, points, maxPoints, notes } = req.body;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to create grades for this class', 403);
    }
    
    // Check if student exists and is enrolled in the class
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student' || !classItem.students.includes(studentId)) {
      return errorResponse(res, 'Invalid student or student not enrolled in class', 400);
    }
    
    // Validate points
    if (points > maxPoints) {
      return errorResponse(res, 'Points cannot be greater than maximum points', 400);
    }
    
    // Calculate percentage
    const percentage = Math.round((points / maxPoints) * 100);
    
    // Determine letter grade
    let letterGrade;
    if (percentage >= 97) letterGrade = 'A+';
    else if (percentage >= 93) letterGrade = 'A';
    else if (percentage >= 90) letterGrade = 'A-';
    else if (percentage >= 87) letterGrade = 'B+';
    else if (percentage >= 83) letterGrade = 'B';
    else if (percentage >= 80) letterGrade = 'B-';
    else if (percentage >= 77) letterGrade = 'C+';
    else if (percentage >= 73) letterGrade = 'C';
    else if (percentage >= 70) letterGrade = 'C-';
    else if (percentage >= 67) letterGrade = 'D+';
    else if (percentage >= 65) letterGrade = 'D';
    else letterGrade = 'F';
    
    const grade = new Grade({
      student: studentId,
      class: classId,
      assignment: assignmentId || null,
      type,
      name,
      points,
      maxPoints,
      percentage,
      letterGrade,
      gradedBy: req.user.id,
      notes,
    });
    
    await grade.save();
    
    // Populate references
    await grade.populate([
      { path: 'student', select: 'name email studentId' },
      { path: 'class', select: 'name' },
      { path: 'gradedBy', select: 'name email' }
    ]);
    
    successResponse(res, grade, 'Grade created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create grade', 500, error.message);
  }
};

// Get grades for student
const getGradesForStudent = async (req, res) => {
  try {
    const { studentId, classId } = req.query;
    
    // If studentId is not provided, use current user (student)
    const targetStudentId = studentId || req.user.id;
    
    // Check if user is authorized (student themselves or teacher/admin)
    if (req.user.role === 'student' && targetStudentId !== req.user.id) {
      return errorResponse(res, 'Not authorized to view other students\' grades', 403);
    }
    
    // Build filter
    const filter = { student: targetStudentId };
    if (classId) {
      filter.class = classId;
    }
    
    const grades = await Grade.find(filter)
      .populate([
        { path: 'class', select: 'name' },
        { path: 'gradedBy', select: 'name email' }
      ])
      .sort({ createdAt: -1 });
    
    successResponse(res, grades, 'Grades fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch grades', 500, error.message);
  }
};

// Get grades for class
const getGradesForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to view grades for this class', 403);
    }
    
    const grades = await Grade.find({ class: classId })
      .populate([
        { path: 'student', select: 'name email studentId' },
        { path: 'gradedBy', select: 'name email' }
      ])
      .sort({ createdAt: -1 });
    
    successResponse(res, grades, 'Class grades fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch class grades', 500, error.message);
  }
};

// Update grade
const updateGrade = async (req, res) => {
  try {
    const { points, maxPoints, notes } = req.body;
    
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return errorResponse(res, 'Grade not found', 404);
    }
    
    // Check if user is the teacher who created this grade
    if (grade.gradedBy.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to update this grade', 403);
    }
    
    // Validate points
    if (points > maxPoints) {
      return errorResponse(res, 'Points cannot be greater than maximum points', 400);
    }
    
    // Update fields
    if (points !== undefined) grade.points = points;
    if (maxPoints !== undefined) grade.maxPoints = maxPoints;
    if (notes !== undefined) grade.notes = notes;
    
    // Recalculate percentage and letter grade
    if (points !== undefined || maxPoints !== undefined) {
      grade.percentage = Math.round((grade.points / grade.maxPoints) * 100);
      
      // Determine letter grade
      const percentage = grade.percentage;
      if (percentage >= 97) grade.letterGrade = 'A+';
      else if (percentage >= 93) grade.letterGrade = 'A';
      else if (percentage >= 90) grade.letterGrade = 'A-';
      else if (percentage >= 87) grade.letterGrade = 'B+';
      else if (percentage >= 83) grade.letterGrade = 'B';
      else if (percentage >= 80) grade.letterGrade = 'B-';
      else if (percentage >= 77) grade.letterGrade = 'C+';
      else if (percentage >= 73) grade.letterGrade = 'C';
      else if (percentage >= 70) grade.letterGrade = 'C-';
      else if (percentage >= 67) grade.letterGrade = 'D+';
      else if (percentage >= 65) grade.letterGrade = 'D';
      else grade.letterGrade = 'F';
    }
    
    await grade.save();
    
    // Populate references
    await grade.populate([
      { path: 'student', select: 'name email studentId' },
      { path: 'class', select: 'name' },
      { path: 'gradedBy', select: 'name email' }
    ]);
    
    successResponse(res, grade, 'Grade updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update grade', 500, error.message);
  }
};

// Delete grade
const deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return errorResponse(res, 'Grade not found', 404);
    }
    
    // Check if user is the teacher who created this grade
    if (grade.gradedBy.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to delete this grade', 403);
    }
    
    await Grade.findByIdAndDelete(req.params.id);
    
    successResponse(res, null, 'Grade deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete grade', 500, error.message);
  }
};

// Get grade summary for student
const getGradeSummaryForStudent = async (req, res) => {
  try {
    const { studentId, classId } = req.query;
    
    // If studentId is not provided, use current user (student)
    const targetStudentId = studentId || req.user.id;
    
    // Check if user is authorized (student themselves or teacher/admin)
    if (req.user.role === 'student' && targetStudentId !== req.user.id) {
      return errorResponse(res, 'Not authorized to view other students\' grade summary', 403);
    }
    
    // Build filter
    const filter = { student: targetStudentId };
    if (classId) {
      filter.class = classId;
    }
    
    // Get all grades
    const grades = await Grade.find(filter);
    
    // Calculate summary
    const totalGrades = grades.length;
    const totalPoints = grades.reduce((sum, grade) => sum + grade.points, 0);
    const totalMaxPoints = grades.reduce((sum, grade) => sum + grade.maxPoints, 0);
    
    const averagePercentage = totalMaxPoints > 0 ? Math.round((totalPoints / totalMaxPoints) * 100) : 0;
    
    // Count letter grades
    const letterGradeCounts = {
      'A+': 0, 'A': 0, 'A-': 0,
      'B+': 0, 'B': 0, 'B-': 0,
      'C+': 0, 'C': 0, 'C-': 0,
      'D+': 0, 'D': 0, 'F': 0
    };
    
    grades.forEach(grade => {
      if (letterGradeCounts.hasOwnProperty(grade.letterGrade)) {
        letterGradeCounts[grade.letterGrade]++;
      }
    });
    
    const summary = {
      totalGrades,
      totalPoints,
      totalMaxPoints,
      averagePercentage,
      letterGradeCounts,
    };
    
    successResponse(res, summary, 'Grade summary fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch grade summary', 500, error.message);
  }
};

module.exports = {
  createGrade,
  getGradesForStudent,
  getGradesForClass,
  updateGrade,
  deleteGrade,
  getGradeSummaryForStudent,
};