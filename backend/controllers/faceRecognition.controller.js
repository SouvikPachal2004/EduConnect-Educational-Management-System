const { successResponse, errorResponse } = require('../utils/response.utils');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const { runFaceRecognitionAttendance, clearFaceRecognitionData, launchFaceRecognitionGUI } = require('../utils/faceRecognition.utils');

// Student mapping storage (in production, this should be in a database)
const studentMappings = new Map();

/**
 * Create a mapping between face recognition ID and EduConnect student ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createStudentMapping = async (req, res) => {
  try {
    const { faceId, studentId } = req.body;
    
    // Validate input
    if (!faceId || !studentId) {
      return errorResponse(res, 'Both faceId and studentId are required', 400);
    }
    
    // Check if student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return errorResponse(res, 'Invalid student ID or student not found', 404);
    }
    
    // Store mapping
    studentMappings.set(faceId.toString(), studentId);
    
    successResponse(res, { faceId, studentId }, 'Student mapping created successfully');
  } catch (error) {
    errorResponse(res, 'Failed to create student mapping', 500, error.message);
  }
};

/**
 * Get EduConnect student ID for a face recognition ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentByFaceId = async (req, res) => {
  try {
    const { faceId } = req.params;
    
    if (!faceId) {
      return errorResponse(res, 'Face ID is required', 400);
    }
    
    const studentId = studentMappings.get(faceId.toString());
    
    if (!studentId) {
      return errorResponse(res, 'No mapping found for this face ID', 404);
    }
    
    // Get student details
    const student = await User.findById(studentId).select('name email studentId');
    
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }
    
    successResponse(res, { 
      faceId, 
      studentId: student._id,
      name: student.name,
      email: student.email,
      studentId: student.studentId
    }, 'Student found successfully');
  } catch (error) {
    errorResponse(res, 'Failed to get student by face ID', 500, error.message);
  }
};

/**
 * Mark attendance using face recognition
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAttendanceByFace = async (req, res) => {
  try {
    const { classId, faceId, confidence } = req.body;
    
    // Validate input
    if (!classId || !faceId || confidence === undefined) {
      return errorResponse(res, 'classId, faceId, and confidence are required', 400);
    }
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to mark attendance for this class', 403);
    }
    
    // Get student ID from mapping
    const studentId = studentMappings.get(faceId.toString());
    if (!studentId) {
      return errorResponse(res, 'No student mapping found for this face ID', 404);
    }
    
    // Check if student exists and is enrolled in the class
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student' || !classItem.students.includes(studentId)) {
      return errorResponse(res, 'Student not found or not enrolled in this class', 404);
    }
    
    // Check confidence threshold (only mark attendance if confidence > 50)
    if (confidence <= 50) {
      return errorResponse(res, 'Face recognition confidence too low', 400);
    }
    
    // Create or update attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    
    const attendanceRecord = await Attendance.findOneAndUpdate(
      { class: classId, student: studentId, date: today },
      {
        class: classId,
        student: studentId,
        date: today,
        status: 'present',
        notes: `Marked by face recognition (confidence: ${confidence}%)`,
        markedBy: req.user.id,
      },
      { upsert: true, new: true }
    );
    
    successResponse(res, attendanceRecord, 'Attendance marked successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to mark attendance', 500, error.message);
  }
};

/**
 * Get all student mappings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentMappings = async (req, res) => {
  try {
    const mappings = [];
    for (let [faceId, studentId] of studentMappings) {
      const student = await User.findById(studentId).select('name email studentId');
      if (student) {
        mappings.push({
          faceId,
          studentId: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId
        });
      }
    }
    
    successResponse(res, mappings, 'Student mappings retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Failed to retrieve student mappings', 500, error.message);
  }
};

/**
 * Delete a student mapping
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteStudentMapping = async (req, res) => {
  try {
    const { faceId } = req.params;
    
    if (!faceId) {
      return errorResponse(res, 'Face ID is required', 400);
    }
    
    if (!studentMappings.has(faceId.toString())) {
      return errorResponse(res, 'No mapping found for this face ID', 404);
    }
    
    studentMappings.delete(faceId.toString());
    
    successResponse(res, { faceId }, 'Student mapping deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete student mapping', 500, error.message);
  }
};

/**
 * Take attendance using face recognition system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const takeAttendance = async (req, res) => {
  try {
    console.log('Take attendance request received:', req.body);
    const { classId } = req.body;
    
    // Validate input
    if (!classId) {
      return errorResponse(res, 'Class ID is required', 400);
    }
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to take attendance for this class', 403);
    }
    
    // Get auth token for EduConnect API
    const authToken = req.headers.authorization?.split(' ')[1];
    
    console.log(`Launching face recognition GUI for class ${classId}`);
    
    // Launch the face recognition GUI application
    const result = await launchFaceRecognitionGUI(classId, authToken);
    
    console.log('Face recognition GUI launch result:', result);
    
    // Return success response
    successResponse(res, { 
      classId, 
      message: 'Face recognition GUI launched successfully. Please check the desktop application.' 
    }, 'Face recognition GUI launched successfully');
  } catch (error) {
    console.error('Error in takeAttendance:', error);
    errorResponse(res, 'Failed to launch face recognition GUI', 500, error.message);
  }
};

module.exports = {
  createStudentMapping,
  getStudentByFaceId,
  markAttendanceByFace,
  getStudentMappings,
  deleteStudentMapping,
  takeAttendance
};