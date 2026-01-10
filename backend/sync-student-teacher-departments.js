const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

async function syncStudentTeacherDepartments() {
  try {
    console.log('Starting student-teacher department synchronization...\n');
    
    // Get all teachers
    const teachers = await User.find({ role: 'teacher' });
    console.log(`Found ${teachers.length} teachers\n`);
    
    // Process each teacher
    for (const teacher of teachers) {
      console.log(`Processing teacher: ${teacher.name} (${teacher.email})`);
      console.log(`  Department: ${teacher.department}`);
      
      // Find students in the same department
      const students = await User.find({
        role: 'student',
        department: teacher.department
      });
      
      console.log(`  Students in department: ${students.length}`);
      
      // For demo purposes, let's also show students in different departments
      const studentsInOtherDepts = await User.find({
        role: 'student',
        department: { $ne: teacher.department }
      });
      
      console.log(`  Students in other departments: ${studentsInOtherDepts.length}\n`);
      
      // If we want to move students to match teacher's department, we would do it here
      // But for now, we'll just report the current state
    }
    
    // Get a summary of departments
    const departments = await User.distinct('department', { department: { $ne: null } });
    console.log('Current departments in the system:');
    departments.forEach(dept => console.log(`  - ${dept}`));
    
    // Show department-wise user counts
    console.log('\nDepartment-wise user distribution:');
    for (const dept of departments) {
      const studentCount = await User.countDocuments({ role: 'student', department: dept });
      const teacherCount = await User.countDocuments({ role: 'teacher', department: dept });
      console.log(`  ${dept}: ${studentCount} students, ${teacherCount} teachers`);
    }
    
    // Identify mismatches
    console.log('\nChecking for mismatches...');
    let mismatchCount = 0;
    
    for (const teacher of teachers) {
      const studentsInDept = await User.countDocuments({
        role: 'student',
        department: teacher.department
      });
      
      if (studentsInDept === 0) {
        console.log(`  ⚠️  Warning: Teacher ${teacher.name} in "${teacher.department}" has no students in the same department`);
        mismatchCount++;
      }
    }
    
    if (mismatchCount === 0) {
      console.log('  ✅ All teachers have students in their department');
    }
    
    console.log('\n✅ Department synchronization check completed!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error during synchronization:', error);
    mongoose.connection.close();
  }
}

// Function to actually sync departments (move students to match teachers)
async function performDepartmentSync() {
  try {
    console.log('Performing actual department synchronization...\n');
    
    // For demonstration, we'll create a mapping of what departments should be synced
    // In a real scenario, this would be based on institutional policies
    
    // Example: Move all students to match their assigned teachers
    // This is a simplified example - in reality, you'd have more complex business rules
    
    const teacherDeptMapping = {
      // This would be populated based on institutional structure
    };
    
    console.log('⚠️  Note: Actual department synchronization would modify the database.');
    console.log('   This script is for reporting purposes only.\n');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error during synchronization:', error);
    mongoose.connection.close();
  }
}

// Run the synchronization check
syncStudentTeacherDepartments();