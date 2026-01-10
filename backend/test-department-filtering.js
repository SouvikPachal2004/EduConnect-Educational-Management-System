const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Test departmental filtering
const testDepartmentFiltering = async () => {
  try {
    // Get all departments
    const departments = await User.distinct('department', { role: 'student' });
    console.log('Available departments:', departments);
    
    // For each department, show students in that department
    for (const dept of departments) {
      if (dept) { // Skip null/undefined departments
        console.log(`\n=== Students in ${dept} Department ===`);
        const students = await User.find({ role: 'student', department: dept })
          .select('name email studentId grade')
          .sort({ name: 1 });
        
        if (students.length > 0) {
          students.forEach(student => {
            console.log(`- ${student.name} (${student.email}) - ID: ${student.studentId}, Grade: ${student.grade || 'N/A'}`);
          });
          console.log(`Total students in ${dept}: ${students.length}`);
        } else {
          console.log('No students found in this department');
        }
      }
    }
    
    // Show teachers and their departments
    console.log('\n=== Teachers and HODs ===');
    const teachers = await User.find({ role: { $in: ['teacher', 'hod'] } })
      .select('name email role department')
      .sort({ department: 1, role: 1 });
    
    teachers.forEach(teacher => {
      console.log(`- ${teacher.name} (${teacher.email}) - Role: ${teacher.role}, Department: ${teacher.department}`);
    });
    
    console.log(`\nTotal teachers/HODs: ${teachers.length}`);
    
  } catch (error) {
    console.error(`Error testing department filtering: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Testing departmental student filtering...');
    
    // Connect to database
    await connectDB();
    
    // Test departmental filtering
    await testDepartmentFiltering();
    
    console.log('\nDepartmental filtering test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();