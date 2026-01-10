const mongoose = require('mongoose');
const User = require('./models/User');
const { comparePassword } = require('./utils/auth.utils');
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

// List all teachers with their credentials
const listTeachers = async () => {
  try {
    console.log('Listing all teachers in the system...\n');
    
    // Find all teachers
    const teachers = await User.find({ role: 'teacher' })
      .select('name email department teacherId')
      .sort({ department: 1 });
    
    if (teachers.length === 0) {
      console.log('❌ No teachers found in the database');
      return;
    }
    
    console.log(`✅ Found ${teachers.length} teachers:\n`);
    
    teachers.forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.name}`);
      console.log(`   Department: ${teacher.department}`);
      console.log(`   Email: ${teacher.email}`);
      console.log(`   Password: 123456 (default for all teachers)`);
      console.log('');
    });
    
    console.log('📋 Login Instructions:');
    console.log('   1. Go to the teacher login page');
    console.log('   2. Use the email and password 123456 for any teacher');
    console.log('   3. Each teacher will only see students from their own department');
    
  } catch (error) {
    console.error(`Error listing teachers: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // List all teachers
    await listTeachers();
    
    console.log('\n🎉 Teacher listing completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();