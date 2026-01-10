const DepartmentGrade = require('../models/DepartmentGrade');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response.utils');
const mongoose = require('mongoose');

// Create or update department grade for a student
const updateDepartmentGrade = async (req, res) => {
  try {
    const { studentId, cgpa, notes } = req.body;
    const teacherId = req.user.id;
    const teacherDepartment = req.user.department;

    // Validate input
    if (!studentId || cgpa === undefined) {
      return errorResponse(res, 'Student ID and CGPA are required', 400);
    }

    if (cgpa < 0 || cgpa > 10) {
      return errorResponse(res, 'CGPA must be between 0 and 10', 400);
    }

    // Find the student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return errorResponse(res, 'Student not found', 404);
    }

    // Verify that student belongs to teacher's department
    if (student.department !== teacherDepartment) {
      return errorResponse(res, 'Not authorized to update grades for this student', 403);
    }

    // Find existing department grade record or create new one
    let departmentGrade = await DepartmentGrade.findOne({
      student: studentId,
      department: teacherDepartment
    });

    if (departmentGrade) {
      // Add to history
      departmentGrade.history.push({
        cgpa: departmentGrade.cgpa,
        updatedBy: teacherId,
        notes: notes || 'Grade updated'
      });

      // Update current CGPA
      departmentGrade.cgpa = cgpa;
      departmentGrade.lastUpdatedBy = teacherId;
      departmentGrade.lastUpdatedAt = new Date();
    } else {
      // Create new department grade record
      departmentGrade = new DepartmentGrade({
        student: studentId,
        studentId: student.studentId,
        studentName: student.name,
        studentEmail: student.email,
        department: teacherDepartment,
        cgpa: cgpa,
        history: [],
        lastUpdatedBy: teacherId,
        lastUpdatedAt: new Date()
      });
    }

    await departmentGrade.save();

    // Also update the student's grade field in User model
    student.grade = cgpa;
    await student.save();

    // Populate student reference
    await departmentGrade.populate({ path: 'student', select: 'name email studentId' });

    successResponse(res, departmentGrade, 'Department grade updated successfully', 200);
  } catch (error) {
    errorResponse(res, 'Failed to update department grade', 500, error.message);
  }
};

// Get all department grades for a teacher's department
const getDepartmentGrades = async (req, res) => {
  try {
    const teacherDepartment = req.user.department;

    const departmentGrades = await DepartmentGrade.find({ department: teacherDepartment })
      .populate({ path: 'student', select: 'name email studentId' })
      .populate({ path: 'lastUpdatedBy', select: 'name email' })
      .sort({ studentName: 1 });

    successResponse(res, { grades: departmentGrades }, 'Department grades fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch department grades', 500, error.message);
  }
};

// Get department grade for a specific student
const getStudentDepartmentGrade = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherDepartment = req.user.department;

    const departmentGrade = await DepartmentGrade.findOne({
      student: studentId,
      department: teacherDepartment
    })
      .populate({ path: 'student', select: 'name email studentId' })
      .populate({ path: 'lastUpdatedBy', select: 'name email' });

    if (!departmentGrade) {
      return errorResponse(res, 'Department grade not found for this student', 404);
    }

    successResponse(res, departmentGrade, 'Department grade fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch department grade', 500, error.message);
  }
};

// Export department grades to CSV/XLSX
const exportDepartmentGrades = async (req, res) => {
  try {
    const teacherDepartment = req.user.department;
    
    // Get all department grades for this department
    const departmentGrades = await DepartmentGrade.find({ department: teacherDepartment })
      .populate({ path: 'student', select: 'name email studentId' })
      .sort({ studentName: 1 });

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${teacherDepartment}-Grade.csv"`);

    // Create CSV content
    let csvContent = 'Student ID,Student Name,Email,Department,CGPA,Last Updated,Updated By\n';
    
    departmentGrades.forEach(grade => {
      const studentName = grade.student ? grade.student.name : 'N/A';
      const studentEmail = grade.student ? grade.student.email : 'N/A';
      const studentId = grade.student ? grade.student.studentId : 'N/A';
      const lastUpdatedBy = grade.lastUpdatedBy ? grade.lastUpdatedBy.name : 'N/A';
      const lastUpdatedAt = grade.lastUpdatedAt ? new Date(grade.lastUpdatedAt).toLocaleDateString() : 'N/A';
      
      // Escape commas and quotes in fields
      const escapeField = (field) => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      csvContent += `${escapeField(studentId)},${escapeField(studentName)},${escapeField(studentEmail)},${escapeField(grade.department)},${grade.cgpa},${lastUpdatedAt},${escapeField(lastUpdatedBy)}\n`;
    });

    res.send(csvContent);
  } catch (error) {
    errorResponse(res, 'Failed to export department grades', 500, error.message);
  }
};

// Initialize department grades for all students in a department
const initializeDepartmentGrades = async (req, res) => {
  try {
    const teacherDepartment = req.user.department;
    
    // Find all students in this department
    const students = await User.find({ 
      role: 'student', 
      department: teacherDepartment 
    });

    let initializedCount = 0;
    
    // Create department grade records for students who don't have them
    for (const student of students) {
      const existingGrade = await DepartmentGrade.findOne({
        student: student._id,
        department: teacherDepartment
      });
      
      if (!existingGrade) {
        // Create new department grade record
        const departmentGrade = new DepartmentGrade({
          student: student._id,
          studentId: student.studentId,
          studentName: student.name,
          studentEmail: student.email,
          department: teacherDepartment,
          cgpa: student.grade || null, // Use existing grade if available
          history: [],
          lastUpdatedBy: req.user.id,
          lastUpdatedAt: new Date()
        });
        
        await departmentGrade.save();
        initializedCount++;
      }
    }

    successResponse(res, { initializedCount }, `Initialized ${initializedCount} department grade records`);
  } catch (error) {
    errorResponse(res, 'Failed to initialize department grades', 500, error.message);
  }
};

module.exports = {
  updateDepartmentGrade,
  getDepartmentGrades,
  getStudentDepartmentGrade,
  exportDepartmentGrades,
  initializeDepartmentGrades
};