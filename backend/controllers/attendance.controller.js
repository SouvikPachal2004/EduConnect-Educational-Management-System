const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Mark attendance
const markAttendance = async (req, res) => {
  try {
    const { classId, date, attendance } = req.body;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to mark attendance for this class', 403);
    }
    
    // Process attendance records
    const attendanceRecords = [];
    
    for (const record of attendance) {
      const { studentId, status, notes } = record;
      
      // Check if student exists and is enrolled in the class
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student' || !classItem.students.includes(studentId)) {
        continue; // Skip invalid students
      }
      
      // Create or update attendance record
      const attendanceRecord = await Attendance.findOneAndUpdate(
        { class: classId, student: studentId, date: new Date(date) },
        {
          class: classId,
          student: studentId,
          date: new Date(date),
          status,
          notes,
          markedBy: req.user.id,
        },
        { upsert: true, new: true }
      );
      
      attendanceRecords.push(attendanceRecord);
    }
    
    successResponse(res, attendanceRecords, 'Attendance marked successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to mark attendance', 500, error.message);
  }
};

// Get attendance for class
const getAttendanceForClass = async (req, res) => {
  try {
    const { classId, date } = req.query;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is authorized (teacher of class or student in class)
    const isTeacher = classItem.teacher.toString() === req.user.id;
    const isStudent = classItem.students.includes(req.user.id);
    
    if (!isTeacher && !isStudent) {
      return errorResponse(res, 'Not authorized to view attendance for this class', 403);
    }
    
    // Build filter
    const filter = { class: classId };
    if (date) {
      filter.date = new Date(date);
    }
    
    // If student, only get their own attendance
    if (isStudent) {
      filter.student = req.user.id;
    }
    
    const attendanceRecords = await Attendance.find(filter)
      .populate([
        { path: 'student', select: 'name email studentId' },
        { path: 'markedBy', select: 'name email' }
      ])
      .sort({ date: -1, student: 1 });
    
    successResponse(res, attendanceRecords, 'Attendance records fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch attendance records', 500, error.message);
  }
};

// Get attendance summary for student
const getAttendanceSummaryForStudent = async (req, res) => {
  try {
    const { studentId, classId } = req.query;
    
    // If studentId is not provided, use current user (student)
    const targetStudentId = studentId || req.user.id;
    
    // Check if user is authorized (student themselves or teacher/admin)
    if (req.user.role === 'student' && targetStudentId !== req.user.id) {
      return errorResponse(res, 'Not authorized to view other students\' attendance', 403);
    }
    
    // Build filter
    const filter = { student: targetStudentId };
    if (classId) {
      filter.class = classId;
    }
    
    // Get all attendance records
    const attendanceRecords = await Attendance.find(filter);
    
    // Calculate summary
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
    const lateCount = attendanceRecords.filter(record => record.status === 'late').length;
    
    const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
    
    const summary = {
      totalClasses,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      attendanceRate,
    };
    
    successResponse(res, summary, 'Attendance summary fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch attendance summary', 500, error.message);
  }
};

// Get attendance summary for class
const getAttendanceSummaryForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to view attendance summary for this class', 403);
    }
    
    // Get all attendance records for this class
    const attendanceRecords = await Attendance.find({ class: classId });
    
    // Get all students in the class
    const students = await User.find({ _id: { $in: classItem.students } })
      .select('name email studentId');
    
    // Calculate summary for each student
    const summaries = students.map(student => {
      const studentRecords = attendanceRecords.filter(record => 
        record.student.toString() === student._id.toString()
      );
      
      const totalClasses = studentRecords.length;
      const presentCount = studentRecords.filter(record => record.status === 'present').length;
      const absentCount = studentRecords.filter(record => record.status === 'absent').length;
      const lateCount = studentRecords.filter(record => record.status === 'late').length;
      
      const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
      
      return {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
        },
        totalClasses,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        attendanceRate,
      };
    });
    
    successResponse(res, summaries, 'Class attendance summary fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch class attendance summary', 500, error.message);
  }
};

module.exports = {
  markAttendance,
  getAttendanceForClass,
  getAttendanceSummaryForStudent,
  getAttendanceSummaryForClass,
};