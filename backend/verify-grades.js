const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Verify grades were added
const verifyGrades = async () => {
  try {
    const conn = await connectDB();
    
    // Count students with grades
    const studentsWithGradesCount = await User.countDocuments({ 
      role: 'student', 
      grade: { $exists: true } 
    });
    
    console.log(`Students with grades: ${studentsWithGradesCount}`);
    
    // Show a few examples
    const sampleStudents = await User.find({ 
      role: 'student', 
      grade: { $exists: true } 
    }).select('name email grade').limit(5);
    
    console.log('\nSample students with grades:');
    sampleStudents.forEach(student => {
      console.log(`- ${student.name}: ${student.grade}`);
    });
    
    // Close connection
    await conn.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

verifyGrades();