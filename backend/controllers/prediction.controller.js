const { successResponse, errorResponse } = require('../utils/response.utils');
const path = require('path');
const fs = require('fs');
const { PythonShell } = require('python-shell');
const { calculateAttendanceRate, calculateAverageScore, extractFeatures, calculateRiskLevel, convertToLetterGrade, analyzeContributingFactors } = require('../utils/prediction.utils');

// Load the trained model
let predictionModel = null;
try {
  const modelPath = path.join(__dirname, '..', 'models', 'student_performance_model.pkl');
  if (fs.existsSync(modelPath)) {
    // Model file exists, we'll use it through Python script
    console.log('Model file found, will use Python-based prediction');
  } else {
    console.log('Model file not found, using heuristic-based prediction');
  }
} catch (error) {
  console.log('Error checking model, using heuristic-based prediction:', error.message);
}

// Mock student performance prediction model (in a real implementation, this would be a trained ML model)
class StudentPerformancePredictor {
  constructor() {
    // In a real implementation, this would load a trained model from disk
    this.isModelLoaded = true;
  }

  /**
   * Predict student performance based on input features
   * @param {Object} features - Student features for prediction
   * @returns {Object} Prediction results
   */
  async predict(features) {
    // Check if we should use the Python model
    const modelPath = path.join(__dirname, '..', 'models', 'student_performance_model.pkl');
    
    if (fs.existsSync(modelPath)) {
      // Use Python-based prediction
      try {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'predict_student_performance.py');
        
        // Prepare data for Python script using only the two required attributes
        const inputData = {
          attendance_rate: features.attendanceRate,
          total_attendance: features.totalAttendance || 100, // Default to 100 if not provided
          grade: features.grade || 3.2 // Use the grade metric (GPA or percentage)
        };
        
        // Configure PythonShell
        const options = {
          mode: 'text',
          pythonPath: 'python3',
          pythonOptions: ['-u'],
          scriptPath: path.dirname(scriptPath),
          args: []
        };
        
        // Run Python script and get prediction
        const predictionResult = await new Promise((resolve, reject) => {
          const pyshell = new PythonShell('predict_student_performance.py', options);
          
          // Send data to Python script
          pyshell.send(JSON.stringify(inputData));
          
          // Listen for results
          pyshell.on('message', function (message) {
            try {
              const result = JSON.parse(message);
              resolve(result);
            } catch (parseError) {
              reject(new Error(`Error parsing Python output: ${message}`));
            }
          });
          
          // End the shell and handle errors
          pyshell.end(function (err, code, signal) {
            if (err) reject(err);
          });
        });
        
        // Handle errors from Python script
        if (predictionResult.error) {
          throw new Error(predictionResult.error);
        }
        
        // Process the prediction result
        const performanceScore = Math.min(100, Math.max(0, predictionResult.predicted_score));
        
        // Determine risk level
        let riskLevel = 'low';
        if (performanceScore < 60) {
          riskLevel = 'high';
        } else if (performanceScore < 80) {
          riskLevel = 'medium';
        }
        
        // Determine letter grade prediction
        let predictedGrade = 'F';
        if (performanceScore >= 97) predictedGrade = 'A+';
        else if (performanceScore >= 93) predictedGrade = 'A';
        else if (performanceScore >= 90) predictedGrade = 'A-';
        else if (performanceScore >= 87) predictedGrade = 'B+';
        else if (performanceScore >= 83) predictedGrade = 'B';
        else if (performanceScore >= 80) predictedGrade = 'B-';
        else if (performanceScore >= 77) predictedGrade = 'C+';
        else if (performanceScore >= 73) predictedGrade = 'C';
        else if (performanceScore >= 70) predictedGrade = 'C-';
        else if (performanceScore >= 67) predictedGrade = 'D+';
        else if (performanceScore >= 65) predictedGrade = 'D';
        
        return {
          predictedScore: Math.round(performanceScore),
          predictedGrade,
          riskLevel,
          confidence: predictionResult.probability ? Math.round(predictionResult.probability * 100) : Math.min(95, Math.max(70, performanceScore))
        };
      } catch (error) {
        console.error('Python prediction failed, falling back to heuristic:', error.message);
        // Fall back to heuristic-based prediction if Python fails
        return this.heuristicPredict(features);
      }
    } else {
      // Use heuristic-based prediction
      return this.heuristicPredict(features);
    }
  }
  
  /**
   * Heuristic-based prediction (fallback method)
   * @param {Object} features - Student features for prediction
   * @returns {Object} Prediction results
   */
  heuristicPredict(features) {
    // Heuristic-based prediction that uses only the two required attributes:
    // 1. Grade (academic performance)
    // 2. Total attendance
    
    const { attendanceRate, totalAttendance, grade } = features;
    
    // Normalize the values to a 0-1 scale for consistent weighting
    // Attendance rate is already a percentage (0-100)
    const normalizedAttendance = attendanceRate / 100;
    
    // Grade normalization depends on the scale:
    // If grade is on a 4.0 scale (GPA), normalize to 0-1 by dividing by 4.0
    // If grade is on a 100 scale (percentage), normalize to 0-1 by dividing by 100
    const normalizedGrade = grade <= 4.0 ? grade / 4.0 : grade / 100;
    
    // Calculate a weighted score based on attendance and grade
    // Weight distribution: 40% attendance, 60% grade
    const attendanceWeight = 0.4;
    const gradeWeight = 0.6;
    
    const performanceScore = Math.min(100, Math.max(0, (normalizedAttendance * attendanceWeight + normalizedGrade * gradeWeight) * 100));
    
    // Determine risk level
    let riskLevel = 'low';
    if (performanceScore < 60) {
      riskLevel = 'high';
    } else if (performanceScore < 80) {
      riskLevel = 'medium';
    }
    
    // Determine letter grade prediction
    let predictedGrade = 'F';
    if (performanceScore >= 97) predictedGrade = 'A+';
    else if (performanceScore >= 93) predictedGrade = 'A';
    else if (performanceScore >= 90) predictedGrade = 'A-';
    else if (performanceScore >= 87) predictedGrade = 'B+';
    else if (performanceScore >= 83) predictedGrade = 'B';
    else if (performanceScore >= 80) predictedGrade = 'B-';
    else if (performanceScore >= 77) predictedGrade = 'C+';
    else if (performanceScore >= 73) predictedGrade = 'C';
    else if (performanceScore >= 70) predictedGrade = 'C-';
    else if (performanceScore >= 67) predictedGrade = 'D+';
    else if (performanceScore >= 65) predictedGrade = 'D';
    
    return {
      predictedScore: Math.round(performanceScore),
      predictedGrade,
      riskLevel,
      confidence: Math.min(95, Math.max(70, performanceScore)) // Confidence based on performance
    };
  }

  /**
   * Get contributing factors for the prediction
   * @param {Object} features - Student features
   * @returns {Array} Contributing factors
   */
  getContributingFactors(features) {
    const factors = [];
    
    if (features.attendanceRate < 75) {
      factors.push({
        factor: 'Attendance',
        impact: 'High',
        recommendation: 'Improve attendance to at least 80%'
      });
    }
    
    if (features.assignmentScore < 70) {
      factors.push({
        factor: 'Assignments',
        impact: 'High',
        recommendation: 'Focus on completing assignments with higher scores'
      });
    }
    
    if (features.examScore < 70) {
      factors.push({
        factor: 'Exams',
        impact: 'Critical',
        recommendation: 'Seek additional help for exam preparation'
      });
    }
    
    if (features.courseLoad > 5) {
      factors.push({
        factor: 'Course Load',
        impact: 'Medium',
        recommendation: 'Consider reducing course load if possible'
      });
    }
    
    return factors;
  }
}

// Initialize predictor
const predictor = new StudentPerformancePredictor();

/**
 * Get student performance prediction
 * @route GET /api/prediction/students/:studentId
 * @access Private (Teacher, HOD, Admin)
 */
exports.getStudentPrediction = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Import required models
    const User = require('../models/User');
    const DepartmentGrade = require('../models/DepartmentGrade');
    
    // Get student data
    const student = await User.findById(studentId).select('_id name studentId department');
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }
    
    // Get attendance data for the student
    // Note: This is a simplified approach. In a production environment, 
    // you would want to get more detailed attendance records.
    const db = require('mongoose').connection.db;
    const attendanceRecords = await db.collection('attendances').find({}).toArray();
    
    // Get grade data for the student
    const studentGrade = await DepartmentGrade.findOne({ student: studentId });
    
    // Extract attendance rate
    let attendanceRate = 85; // Default value
    let totalAttendance = 100; // Default value
    
    // Find attendance record for this student
    const studentAttendance = attendanceRecords.find(record => 
      record.student_id === student.studentId || 
      record.student_id === student._id.toString()
    );
    
    if (studentAttendance && studentAttendance.attendance) {
      attendanceRate = studentAttendance.attendance;
    }
    
    // Extract grade information
    let grade = 3.2; // Default GPA value
    
    if (studentGrade && studentGrade.cgpa !== undefined) {
      grade = studentGrade.cgpa;
    }
    
    // Create features for prediction using only the two required attributes
    const features = {
      attendanceRate: attendanceRate,
      totalAttendance: totalAttendance,
      grade: grade // This represents the student's academic performance
    };
    
    // Make prediction using the actual ML model
    const prediction = await predictor.predict(features);
    const contributingFactors = predictor.getContributingFactors(features);
    
    successResponse(res, {
      studentId,
      ...prediction,
      contributingFactors
    }, 'Prediction generated successfully');
  } catch (error) {
    console.error('Error in getStudentPrediction:', error);
    errorResponse(res, 'Failed to generate prediction', 500, error.message);
  }
};

/**
 * Get class performance predictions
 * @route GET /api/prediction/classes/:classId
 * @access Private (Teacher, HOD, Admin)
 */
exports.getClassPredictions = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Mock class predictions
    const mockPredictions = [
      {
        studentId: 'STU001',
        studentName: 'Anurag Ray',
        predictedScore: 88,
        predictedGrade: 'B+',
        riskLevel: 'low'
      },
      {
        studentId: 'STU002',
        studentName: 'Priya Sharma',
        predictedScore: 92,
        predictedGrade: 'A-',
        riskLevel: 'low'
      },
      {
        studentId: 'STU003',
        studentName: 'Rahul Verma',
        predictedScore: 76,
        predictedGrade: 'C',
        riskLevel: 'medium'
      }
    ];
    
    successResponse(res, {
      classId,
      predictions: mockPredictions
    }, 'Class predictions generated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to generate class predictions', 500, error.message);
  }
};

/**
 * Get at-risk students
 * @route GET /api/prediction/at-risk
 * @access Private (Teacher, HOD, Admin)
 */
exports.getAtRiskStudents = async (req, res) => {
  try {
    // Import required models
    const User = require('../models/User');
    const DepartmentGrade = require('../models/DepartmentGrade');
    
    // Get the teacher's department if requester is a teacher
    let departmentFilter = {};
    if (req.user.role === 'teacher') {
      departmentFilter = { department: req.user.department };
    }
    
    // Get all students in the department
    const students = await User.find({
      role: 'student',
      ...departmentFilter
    }).select('_id name studentId department');
    
    console.log('Found students:', students);
    
    // Get attendance data for all students
    // Note: This is a simplified approach. In a production environment, 
    // you would want to get more detailed attendance records.
    const db = require('mongoose').connection.db;
    const attendanceRecords = await db.collection('attendances').find({}).toArray();
    
    console.log('Found attendance records:', attendanceRecords);
    
    // Get grade data for all students
    const gradeRecords = await DepartmentGrade.find({});
    
    console.log('Found grade records:', gradeRecords);
    
    // Process students to extract features for prediction
    const studentsWithFeatures = students.map(student => {
      // Extract attendance rate
      let attendanceRate = 85; // Default value
      let totalAttendance = 100; // Default value
      
      // Find attendance record for this student
      const studentAttendance = attendanceRecords.find(record => 
        record.student_id === student.studentId || 
        record.student_id === student._id.toString()
      );
      
      if (studentAttendance && studentAttendance.attendance) {
        attendanceRate = studentAttendance.attendance;
      }
      
      // Extract grade information
      let grade = 3.2; // Default GPA value
      
      // Find grade record for this student
      const studentGrade = gradeRecords.find(g => 
        g.studentId === student.studentId || 
        g.student.toString() === student._id.toString()
      );
      
      if (studentGrade && studentGrade.cgpa !== undefined) {
        grade = studentGrade.cgpa;
      }
      
      // Create features for prediction using only the two required attributes
      const features = {
        attendanceRate: attendanceRate,
        totalAttendance: totalAttendance,
        grade: grade // This represents the student's academic performance
      };
      
      return {
        studentId: student.studentId || student._id,
        studentName: student.name,
        features: features,
        department: student.department
      };
    });
    
    // Generate predictions for each student
    const atRiskStudents = [];
    
    for (const student of studentsWithFeatures) {
      // Make prediction using the actual ML model
      const prediction = await predictor.predict(student.features);
      
      // Only include students with medium or high risk
      if (prediction.riskLevel === 'medium' || prediction.riskLevel === 'high') {
        atRiskStudents.push({
          studentId: student.studentId,
          studentName: student.studentName,
          currentScore: Math.round((student.features.attendanceRate + student.features.grade * 10) / 2), // Simplified calculation
          predictedScore: prediction.predictedScore,
          riskLevel: prediction.riskLevel,
          department: student.department
        });
      }
    }
    
    successResponse(res, atRiskStudents, 'At-risk students retrieved successfully');
  } catch (error) {
    console.error('Error in getAtRiskStudents:', error);
    errorResponse(res, 'Failed to retrieve at-risk students', 500, error.message);
  }
};