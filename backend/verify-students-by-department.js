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

// Verify students by department
const verifyStudentsByDepartment = async () => {
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
    
    // Count total students
    const totalStudents = await User.countDocuments({ role: 'student' });
    console.log(`\nTotal students in database: ${totalStudents}`);
    
  } catch (error) {
    console.error(`Error verifying students: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Verifying students by department...\n');
    
    // Connect to database
    await connectDB();
    
    // Verify students by department
    await verifyStudentsByDepartment();
    
    console.log('\nStudent verification completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();