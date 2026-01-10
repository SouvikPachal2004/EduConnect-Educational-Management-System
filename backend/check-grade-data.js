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

// Check student grade data
const checkGradeData = async () => {
  try {
    // Find students with grade information
    const studentsWithGrades = await User.find({ 
      role: 'student',
      grade: { $exists: true, $ne: null }
    }).limit(10);
    
    console.log('Students with Grade Information:');
    console.log('===============================');
    
    if (studentsWithGrades.length === 0) {
      console.log('No students with grade information found.');
      return;
    }
    
    studentsWithGrades.forEach((student, index) => {
      console.log(`\nStudent ${index + 1}:`);
      console.log(`  Name: ${student.name}`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Student ID: ${student.studentId}`);
      console.log(`  Department: ${student.department}`);
      console.log(`  Grade/CGPA: ${student.grade}`);
    });
    
    console.log(`\nTotal students with grades: ${studentsWithGrades.length}`);
    
  } catch (error) {
    console.error(`Error checking grade data: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Checking student grade data...\n');
    
    // Connect to database
    await connectDB();
    
    // Check grade data
    await checkGradeData();
    
    console.log('\nGrade data check completed!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();