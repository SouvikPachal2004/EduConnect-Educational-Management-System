const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DepartmentGrade = require('./models/DepartmentGrade');
const User = require('./models/User');

// Import controller functions
const { initializeDepartmentGrades } = require('./controllers/departmentGrade.controller');

// Connect to database
const connectDB = require('./config/db');
connectDB();

// Check teachers and initialize department grades
const checkAndInit = async () => {
  try {
    console.log('Checking teachers and initializing department grades...');
    
    // First, let's check what teachers we have
    const teachers = await User.find({ role: 'teacher' });
    console.log('Teachers found:', teachers.length);
    teachers.forEach(teacher => {
      console.log(`  - ${teacher.name} (${teacher.email}) - Department: ${teacher.department}`);
    });
    
    // Check students
    const students = await User.find({ role: 'student' });
    console.log('\nStudents found:', students.length);
    
    // Group students by department
    const studentsByDept = {};
    students.forEach(student => {
      const dept = student.department || 'No Department';
      if (!studentsByDept[dept]) {
        studentsByDept[dept] = [];
      }
      studentsByDept[dept].push(student);
    });
    
    console.log('\nStudents by department:');
    Object.keys(studentsByDept).forEach(dept => {
      console.log(`  ${dept}: ${studentsByDept[dept].length} students`);
    });
    
    // If we have teachers, initialize grades for each department
    if (teachers.length > 0) {
      // Get unique departments from teachers
      const teacherDepartments = [...new Set(teachers.map(teacher => teacher.department))];
      console.log('\nTeacher departments:', teacherDepartments);
      
      // For each teacher department, initialize grades using the first teacher from that department
      for (const dept of teacherDepartments) {
        if (!dept) continue; // Skip undefined departments
        
        const teacher = teachers.find(t => t.department === dept);
        if (!teacher) continue;
        
        console.log(`\nInitializing grades for ${dept} department using teacher ${teacher.name}...`);
        
        // Mock request object for initialization
        const mockReq = {
          user: {
            id: teacher._id,
            department: dept
          }
        };

        // Mock response object
        let responseData = null;
        const mockRes = {
          status: function(code) {
            this.statusCode = code;
            return this;
          },
          json: function(data) {
            responseData = data;
          }
        };
        
        try {
          // Call the controller function
          await initializeDepartmentGrades(mockReq, mockRes);
          console.log('  Response:', responseData);
        } catch (error) {
          console.error('  Error initializing grades:', error.message);
        }
      }
    }
    
    console.log('\nDepartment grade initialization process complete.');
    
    // Check the results
    const allGrades = await DepartmentGrade.find({})
      .populate({ path: 'student', select: 'name email studentId department' })
      .populate({ path: 'lastUpdatedBy', select: 'name email' });
    
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
      gradesByDepartment[dept].slice(0, 5).forEach(grade => { // Show first 5
        console.log(`  - ${grade.studentName} (${grade.studentId}): CGPA ${grade.cgpa || 'N/A'}`);
      });
      if (gradesByDepartment[dept].length > 5) {
        console.log(`  ... and ${gradesByDepartment[dept].length - 5} more`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error in check and init process:', error);
    process.exit(1);
  }
};

checkAndInit();