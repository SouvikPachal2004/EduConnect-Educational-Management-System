const mongoose = require('mongoose');
const User = require('./models/User');
const Grade = require('./models/Grade');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function finalGradeVerification() {
  try {
    console.log('=== Final Grade Synchronization Verification ===\n');
    
    // Get all teachers
    const teachers = await User.find({ role: 'teacher' }).select('name department');
    
    for (const teacher of teachers) {
      console.log(`Teacher: ${teacher.name}`);
      console.log(`Department: ${teacher.department}`);
      
      // Get students in the same department
      const studentsInDepartment = await User.find({
        role: 'student',
        department: teacher.department
      }).select('name studentId');
      
      console.log(`Students in department: ${studentsInDepartment.length}`);
      
      // Get student IDs
      const studentIds = studentsInDepartment.map(student => student._id);
      
      // Get grades for these students
      const grades = await Grade.find({
        student: { $in: studentIds }
      }).populate('student', 'name studentId department');
      
      console.log(`Grades found: ${grades.length}`);
      
      // Verify all grades belong to students in the same department
      const mismatchedGrades = grades.filter(grade => 
        !grade.student || grade.student.department !== teacher.department
      );
      
      if (mismatchedGrades.length > 0) {
        console.log(`❌ ISSUE: Found ${mismatchedGrades.length} grades for students NOT in ${teacher.department} department`);
        mismatchedGrades.forEach(grade => {
          console.log(`  - Student: ${grade.student?.name} (${grade.student?.department})`);
        });
      } else {
        console.log(`✅ All grades correctly belong to students in ${teacher.department} department`);
      }
      
      console.log('---');
    }
    
    console.log('\n=== Verification Complete ===');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error in final verification:', error);
    mongoose.connection.close();
  }
}

finalGradeVerification();