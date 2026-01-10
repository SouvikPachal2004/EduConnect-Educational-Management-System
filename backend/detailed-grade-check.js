const mongoose = require('mongoose');
const User = require('./models/User');
const Grade = require('./models/Grade');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function detailedGradeCheck() {
  try {
    console.log('Performing detailed grade synchronization check...');
    
    // Check all teachers
    const teachers = await User.find({ role: 'teacher' }).select('name department');
    console.log('\nTeachers:');
    teachers.forEach(teacher => {
      console.log(`- ${teacher.name}: ${teacher.department}`);
    });
    
    // For each teacher, check their department students and grades
    for (const teacher of teachers) {
      console.log(`\n=== Checking ${teacher.name} (${teacher.department}) ===`);
      
      // Get students in the same department
      const students = await User.find({
        role: 'student',
        department: teacher.department
      }).select('name studentId');
      
      console.log(`Students in ${teacher.department}: ${students.length}`);
      students.slice(0, 3).forEach(student => {
        console.log(`- ${student.name} (${student.studentId})`);
      });
      if (students.length > 3) {
        console.log(`  ... and ${students.length - 3} more`);
      }
      
      // Get student IDs
      const studentIds = students.map(student => student._id);
      
      // Get grades for these students
      const grades = await Grade.find({
        student: { $in: studentIds }
      });
      
      console.log(`Grades for ${teacher.department} students: ${grades.length}`);
      
      // Show sample grades
      for (let i = 0; i < Math.min(2, grades.length); i++) {
        const grade = grades[i];
        const student = students.find(s => s._id.toString() === grade.student.toString());
        console.log(`- Grade for ${student?.name || 'Unknown'}: ${grade.points}/${grade.maxPoints} (${grade.percentage}%)`);
      }
    }
    
    console.log('\nDetailed check completed!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error in detailed grade check:', error);
    mongoose.connection.close();
  }
}

detailedGradeCheck();