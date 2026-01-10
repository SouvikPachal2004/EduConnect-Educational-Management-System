const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DepartmentGrade = require('./models/DepartmentGrade');
const User = require('./models/User');

// Connect to database
const connectDB = require('./config/db');
connectDB();

// Check department collections
const checkDepartments = async () => {
  try {
    console.log('Checking department grade collections...');
    
    // Get all department grades
    const allGrades = await DepartmentGrade.find({})
      .populate({ path: 'student', select: 'name email studentId department' })
      .populate({ path: 'lastUpdatedBy', select: 'name email' });
    
    console.log(`Total department grades: ${allGrades.length}`);
    
    // Group by department
    const gradesByDepartment = {};
    allGrades.forEach(grade => {
      const dept = grade.department;
      if (!gradesByDepartment[dept]) {
        gradesByDepartment[dept] = [];
      }
      gradesByDepartment[dept].push(grade);
    });
    
    // Display results
    Object.keys(gradesByDepartment).forEach(dept => {
      console.log(`\n${dept} Department (${gradesByDepartment[dept].length} students):`);
      gradesByDepartment[dept].forEach(grade => {
        console.log(`  - ${grade.studentName} (${grade.studentId}): CGPA ${grade.cgpa}`);
      });
    });
    
    // Check if we have the expected departments
    const departments = Object.keys(gradesByDepartment);
    console.log('\nDepartments found:', departments);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking departments:', error);
    process.exit(1);
  }
};

checkDepartments();