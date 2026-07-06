const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { launchFaceRecognition } = require('../scripts/launch_face_recognition');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Launch face recognition system
const launchFaceRecognitionSystem = async (req, res) => {
  try {
    const { date } = req.body;
    
    console.log('Launching face recognition GUI application');
    
    // Path to the face recognition folder
    const faceRecognitionPath = path.join(__dirname, '../../face');
    const guiLauncherPath = path.join(faceRecognitionPath, 'gui_launcher.py');
    
    // Check if Python script exists
    if (!fs.existsSync(guiLauncherPath)) {
      console.error('GUI launcher script not found at:', guiLauncherPath);
      return errorResponse(res, 'Face recognition GUI launcher not found', 500);
    }
    
    // Check for virtual environment Python (preferred)
    const venvPythonWin = path.join(faceRecognitionPath, '.venv', 'Scripts', 'python.exe');
    const venvPythonUnix = path.join(faceRecognitionPath, '.venv', 'bin', 'python');
    
    let pythonExecutable = 'python'; // Default fallback
    
    // Use virtual environment Python if available
    if (fs.existsSync(venvPythonWin)) {
      pythonExecutable = venvPythonWin;
      console.log('Using virtual environment Python (Windows):', pythonExecutable);
    } else if (fs.existsSync(venvPythonUnix)) {
      pythonExecutable = venvPythonUnix;
      console.log('Using virtual environment Python (Unix):', pythonExecutable);
    } else {
      console.log('Virtual environment not found, using system Python');
      // Try different Python executables (Windows compatibility)
      const pythonExecutables = ['python', 'py', 'python3'];
      
      for (const pyExe of pythonExecutables) {
        try {
          const testResult = require('child_process').spawnSync(pyExe, ['--version']);
          if (testResult.status === 0) {
            pythonExecutable = pyExe;
            console.log(`Found Python executable: ${pyExe}`);
            break;
          }
        } catch (e) {
          // Continue to next executable
        }
      }
    }
    
    // Arguments to pass to the GUI launcher
    const args = [guiLauncherPath];
    
    // Add authentication token if available
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      args.push('--auth-token', token);
    }
    
    console.log('Launching GUI with Python executable:', pythonExecutable);
    console.log('Launching GUI with args:', args);
    console.log('Working directory:', faceRecognitionPath);
    
    // Spawn the Python process to launch the GUI
    // Use detached mode on Windows to prevent blocking
    const pythonProcess = spawn(pythonExecutable, args, {
      cwd: faceRecognitionPath,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true // Use shell on Windows for better compatibility
    });
    
    // Unreference the process so parent doesn't wait
    pythonProcess.unref();
    
    // Handle stdout
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Face recognition GUI stdout: ${data}`);
    });
    
    // Handle stderr
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Face recognition GUI stderr: ${data}`);
    });
    
    // Handle process close
    pythonProcess.on('close', (code) => {
      console.log(`Face recognition GUI process exited with code ${code}`);
    });
    
    // Handle process error
    pythonProcess.on('error', (error) => {
      console.error('Failed to start face recognition GUI process:', error);
    });
    
    // Return success response immediately
    successResponse(res, { 
      date: date || new Date().toISOString().split('T')[0],
      message: 'Face recognition GUI application launched successfully. Please check for the camera window.' 
    }, 'Face recognition GUI launched');
    
  } catch (error) {
    console.error('Error in launchFaceRecognitionSystem:', error);
    errorResponse(res, 'Failed to launch face recognition GUI', 500, error.message);
  }
};

// Get department-wise attendance
const getDepartmentAttendance = async (req, res) => {
  try {
    // Get teacher's department
    const teacherDepartment = req.user.department;
    
    // Connect to MongoDB directly to access the attendances collection
    const db = require('mongoose').connection.db;
    
    // Map department names to match the format in the attendances collection
    const departmentMapping = {
      'Computer Science & Engineering': 'CSE',
      'Computer Science and Engineering': 'CSE',
      'CS-DS': 'CS-DS',
      'IT': 'IT',
      'CSE-AIML': 'CSE-AIML',
      'CSE-DS': 'CSE-DS'
    };
    
    const mappedDepartment = departmentMapping[teacherDepartment] || teacherDepartment;
    
    // Get attendance records for the teacher's department
    const attendanceRecords = await db.collection('attendances').find({
      department: mappedDepartment
    }).toArray();
    
    // Transform the data to match frontend expectations
    const transformedRecords = attendanceRecords.map(record => ({
      student: {
        name: record.student_name,
        studentId: record.student_id
      },
      attendance: record.attendance,
      todaysAttendance: record.todays_attendance || 'Not Marked'
    }));
    
    successResponse(res, transformedRecords, 'Department attendance records fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch department attendance records', 500, error.message);
  }
};

// Store date-wise attendance for calendar view
const storeDateWiseAttendance = async (req, res) => {
  try {
    const { date, attendanceData } = req.body;
    
    // Connect to MongoDB directly to access the attendances collection
    const db = require('mongoose').connection.db;
    
    // Process each attendance record
    const results = [];
    
    for (const record of attendanceData) {
      const { studentId, status } = record;
      
      // Update or insert the date-wise attendance record
      const result = await db.collection('attendances').updateOne(
        { 
          student_id: studentId,
          date: new Date(date)
        },
        { 
          $set: {
            student_id: studentId,
            date: new Date(date),
            status: status,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      
      results.push({
        studentId,
        date,
        status,
        modifiedCount: result.modifiedCount,
        upserted: result.upsertedCount > 0
      });
    }
    
    successResponse(res, results, 'Date-wise attendance stored successfully');
  } catch (error) {
    errorResponse(res, 'Failed to store date-wise attendance', 500, error.message);
  }
};

// Get date-wise attendance for calendar view
const getDateWiseAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Connect to MongoDB directly to access the attendances collection
    const db = require('mongoose').connection.db;
    
    // Get attendance records for the date range
    // Only get records that have a date field (new format)
    const attendanceRecords = await db.collection('attendances').find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).toArray();
    
    // Group by date for calendar display
    const attendanceByDate = {};
    
    attendanceRecords.forEach(record => {
      // Format the date as YYYY-MM-DD
      const dateStr = record.date.toISOString().split('T')[0];
      
      if (!attendanceByDate[dateStr]) {
        attendanceByDate[dateStr] = [];
      }
      
      attendanceByDate[dateStr].push({
        studentId: record.student_id,
        status: record.status || 'unknown'
      });
    });
    
    successResponse(res, attendanceByDate, 'Date-wise attendance records fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch date-wise attendance records', 500, error.message);
  }
};

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

// Mark attendance via face recognition
const markAttendanceViaFaceRecognition = async (req, res) => {
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
    
    successResponse(res, attendanceRecords, 'Attendance marked successfully via face recognition', 201);
  } catch (error) {
    errorResponse(res, 'Failed to mark attendance via face recognition', 500, error.message);
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
  getDepartmentAttendance,
  storeDateWiseAttendance,
  getDateWiseAttendance,
  markAttendance,
  markAttendanceViaFaceRecognition,
  launchFaceRecognitionSystem,
  getAttendanceForClass,
  getAttendanceSummaryForStudent,
  getAttendanceSummaryForClass
};