const mongoose = require('mongoose');
const User = require('./models/User');
const Grade = require('./models/Grade');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyGradeDepartments() {
  try {
    // Get all grades with student info
    const grades = await Grade.find().populate('student', 'name department');
    
    console.log('Verifying grade departments:');
    console.log('==========================');
    
    // Group grades by teacher department
    const departmentGrades = {};
    
    for (const grade of grades) {
      const student = grade.student;
      if (!student) continue;
      
      const studentDept = student.department;
      
      if (!departmentGrades[studentDept]) {
        departmentGrades[studentDept] = [];
      }
      
      departmentGrades[studentDept].push({
        studentName: student.name,
        studentDept: studentDept,
        points: grade.points,
        maxPoints: grade.maxPoints,
        percentage: grade.percentage
      });
    }
    
    // Display results by department
    for (const [dept, gradesList] of Object.entries(departmentGrades)) {
      console.log(`\n${dept} Department:`);
      console.log(`  Total grades: ${gradesList.length}`);
      console.log(`  Students with grades:`);
      
      // Group by student
      const studentGrades = {};
      gradesList.forEach(grade => {
        if (!studentGrades[grade.studentName]) {
          studentGrades[grade.studentName] = [];
        }
        studentGrades[grade.studentName].push(grade);
      });
      
      Object.keys(studentGrades).slice(0, 3).forEach(studentName => {
        console.log(`    - ${studentName}: ${studentGrades[studentName].length} grades`);
      });
      
      if (Object.keys(studentGrades).length > 3) {
        console.log(`    ... and ${Object.keys(studentGrades).length - 3} more students`);
      }
    }
    
    console.log('\nDepartment Summary:');
    console.log('===================');
    Object.keys(departmentGrades).forEach(dept => {
      console.log(`${dept}: ${departmentGrades[dept].length} grades`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

verifyGradeDepartments();