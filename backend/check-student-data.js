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

// Check student data structure
const checkStudentData = async () => {
  try {
    // Find a few sample students to check their data structure
    const sampleStudents = await User.find({ role: 'student' })
      .limit(5);
    
    console.log('Sample Student Data Structures:');
    console.log('================================');
    
    sampleStudents.forEach((student, index) => {
      console.log(`\nStudent ${index + 1}:`);
      console.log(`  Name: ${student.name}`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Student ID: ${student.studentId}`);
      console.log(`  Department: ${student.department}`);
      
      // Check for CGPA or grade fields
      if (student.cgpa !== undefined) {
        console.log(`  CGPA: ${student.cgpa}`);
      } else if (student.grade !== undefined) {
        console.log(`  Grade: ${student.grade}`);
      } else {
        console.log(`  CGPA/Grade: Not found`);
      }
      
      // Show all fields that might contain grade information
      Object.keys(student.toObject()).forEach(key => {
        if (key.toLowerCase().includes('grade') || key.toLowerCase().includes('cgpa') || key.toLowerCase().includes('gpa')) {
          console.log(`  ${key}: ${student[key]}`);
        }
      });
    });
    
  } catch (error) {
    console.error(`Error checking student data: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Checking student data structure...\n');
    
    // Connect to database
    await connectDB();
    
    // Check student data
    await checkStudentData();
    
    console.log('\nStudent data check completed!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();