const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DepartmentGrade = require('./models/DepartmentGrade');
const User = require('./models/User');

// Import controller functions
const { initializeDepartmentGrades } = require('./controllers/departmentGrade.controller');

// Mock request object for initialization
const mockReq = {
  user: {
    id: 'mock-teacher-id',
    department: 'CSE' // This would normally be determined by the logged-in teacher
  }
};

// Mock response object
const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('Response:', data);
  }
};

// Connect to database
const connectDB = require('./config/db');
connectDB();

// Initialize department grades
const initGrades = async () => {
  try {
    console.log('Initializing department grades...');
    
    // First, let's check what departments we have
    const users = await User.find({ role: 'student' });
    const departments = [...new Set(users.map(user => user.department))];
    console.log('Departments found in student data:', departments);
    
    // For each department, initialize grades
    for (const dept of departments) {
      console.log(`\nInitializing grades for ${dept} department...`);
      
      // Update mock request with current department
      mockReq.user.department = dept;
      
      // Call the controller function
      // Note: This is a simplified version - in reality, this would be called by an actual teacher
      await initializeDepartmentGrades(mockReq, mockRes);
    }
    
    console.log('\nDepartment grade initialization complete.');
    
    // Check the results
    const allGrades = await DepartmentGrade.find({})
      .populate({ path: 'student', select: 'name email studentId department' });
    
    console.log(`\nTotal department grades created: ${allGrades.length}`);
    
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
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing department grades:', error);
    process.exit(1);
  }
};

initGrades();