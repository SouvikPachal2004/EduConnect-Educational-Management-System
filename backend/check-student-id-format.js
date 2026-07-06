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

// Check existing student ID format
const checkStudentFormat = async () => {
  try {
    const existingStudents = await User.find({ role: 'student' })
      .select('name studentId email department')
      .limit(10);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         EXISTING STUDENT ID FORMAT                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    existingStudents.forEach(student => {
      console.log(`Name: ${student.name}`);
      console.log(`Student ID: ${student.studentId}`);
      console.log(`Department: ${student.department}`);
      console.log('');
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await checkStudentFormat();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
