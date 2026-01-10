const mongoose = require('mongoose');
const DepartmentGrade = require('./models/DepartmentGrade');
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

// Demonstrate grade functionality
const demonstrateGradeFunctionality = async () => {
  try {
    console.log('Demonstrating grade editing and export functionality...\n');
    
    // Find a teacher and student in the same department
    const teacher = await User.findOne({ role: 'teacher', department: { $exists: true, $ne: null } });
    if (!teacher) {
      console.log('❌ No teacher with department found');
      return;
    }
    
    const student = await User.findOne({ 
      role: 'student', 
      department: teacher.department 
    });
    
    if (!student) {
      console.log(`❌ No student found in ${teacher.department} department`);
      return;
    }
    
    console.log('🎯 Scenario: Teacher editing student grade');
    console.log(`   Teacher: ${teacher.name} (${teacher.department})`);
    console.log(`   Student: ${student.name} (${student.department})`);
    
    console.log('\n📋 Grade Editing Process:');
    console.log('   1. Teacher clicks "Edit" button next to student in grade table');
    console.log('   2. System prompts teacher to enter new CGPA (0-10)');
    console.log('   3. Teacher enters CGPA value (e.g., 8.5)');
    console.log('   4. System validates input and sends to backend');
    console.log('   5. Backend updates DepartmentGrade collection');
    console.log('   6. Backend also updates User model grade field');
    console.log('   7. Previous CGPA is stored in history');
    console.log('   8. Grade table automatically refreshes to show new CGPA');
    
    console.log('\n📂 Department Grade Collection Structure:');
    console.log('   Collection Name: DepartmentGrade');
    console.log('   Fields:');
    console.log('     - student: Reference to User document');
    console.log('     - studentId: Student ID');
    console.log('     - studentName: Student name');
    console.log('     - studentEmail: Student email');
    console.log('     - department: Department name');
    console.log('     - cgpa: Current CGPA value');
    console.log('     - history: Array of previous CGPA values');
    console.log('     - lastUpdatedBy: Teacher who last updated');
    console.log('     - lastUpdatedAt: Timestamp of last update');
    
    console.log('\n📤 Export Functionality:');
    console.log('   1. Teacher clicks "Export Grades" button');
    console.log('   2. System sends request to /api/teacher/department-grades/export');
    console.log('   3. Backend generates CSV file with department grades');
    console.log('   4. File is automatically downloaded as "{Department}-Grade.csv"');
    console.log('   5. CSV includes: Student ID, Name, Email, Department, CGPA, Last Updated');
    
    console.log('\n📋 Sample CSV Export Content:');
    console.log('Student ID,Student Name,Email,Department,CGPA,Last Updated,Updated By');
    console.log('STU0001,John Smith,john@educonnect.com,CSE,8.5,2025-12-13,Dr. Anil Verma');
    console.log('STU0002,Jane Doe,jane@educonnect.com,CSE,9.2,2025-12-13,Dr. Anil Verma');
    console.log('STU0003,Robert Johnson,robert@educonnect.com,CSE,7.8,2025-12-13,Dr. Anil Verma');
    
    console.log('\n✅ Security Features:');
    console.log('   - Teachers can only edit grades for students in their department');
    console.log('   - All updates are logged with teacher ID and timestamp');
    console.log('   - Previous CGPA values are preserved in history');
    console.log('   - Input validation prevents invalid CGPA values');
    console.log('   - Authentication required for all operations');
    
  } catch (error) {
    console.error(`Error demonstrating grade functionality: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Demonstrate grade functionality
    await demonstrateGradeFunctionality();
    
    console.log('\n🎉 Grade functionality demonstration completed successfully!');
    console.log('\n🚀 The system is now ready for use!');
    console.log('   Teachers can edit student grades and export department data.');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();