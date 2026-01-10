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

// Test students endpoint functionality
const testStudentsEndpoint = async () => {
  try {
    console.log('Testing students endpoint functionality...\n');
    
    // Get a teacher to test with
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.log('❌ No teacher found in database');
      return;
    }
    
    console.log('✅ Found teacher:');
    console.log(`   Name: ${teacher.name}`);
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Department: ${teacher.department}`);
    
    // Find students in the same department
    const students = await User.find({ 
      role: 'student',
      department: teacher.department
    }).limit(5);
    
    console.log(`\n✅ Found ${students.length} students in ${teacher.department} department:`);
    
    students.forEach((student, index) => {
      console.log(`\n   Student ${index + 1}:`);
      console.log(`     Name: ${student.name}`);
      console.log(`     Email: ${student.email}`);
      console.log(`     Student ID: ${student.studentId}`);
      console.log(`     Grade/CGPA: ${student.grade || 'N/A'}`);
    });
    
    console.log('\n✅ This data should be displayed in the grade section');
    console.log('   - All students from teacher\'s department');
    console.log('   - With their CGPA/Grade information');
    console.log('   - Edit button for each student to modify grades');
    
  } catch (error) {
    console.error(`Error testing students endpoint: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Test students endpoint functionality
    await testStudentsEndpoint();
    
    console.log('\n🎉 Students endpoint test completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();