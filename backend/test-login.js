const mongoose = require('mongoose');
const User = require('./models/User');
const { comparePassword } = require('./utils/auth.utils');
const { generateToken } = require('./config/jwt');
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

// Test login functionality
const testLogin = async () => {
  try {
    // Test a few sample students
    const sampleStudents = [
      { email: "abhisheksingh27493@gmail.com", password: "12345678" },
      { email: "kanup8137@gmail.com", password: "12345678" },
      { email: "huzaifaluqmani13@gmail.com", password: "12345678" }
    ];
    
    console.log('Testing login functionality...\n');
    
    for (const student of sampleStudents) {
      try {
        // Find user by email
        const user = await User.findOne({ email: student.email });
        
        if (!user) {
          console.log(`❌ User not found: ${student.email}`);
          continue;
        }
        
        // Check if password matches
        const isMatch = await comparePassword(student.password, user.password);
        
        if (isMatch) {
          // Generate token
          const token = generateToken({
            id: user._id,
            email: user.email,
            role: user.role,
          });
          console.log(`✅ Login successful for: ${user.name} (${user.email})`);
          console.log(`   Department: ${user.department}`);
          console.log(`   Student ID: ${user.studentId}`);
          console.log(`   Token: ${token.substring(0, 20)}...`);
        } else {
          console.log(`❌ Invalid password for: ${user.name} (${user.email})`);
        }
        
        console.log(''); // Empty line for readability
      } catch (error) {
        console.error(`Error testing login for ${student.email}: ${error.message}`);
      }
    }
    
    console.log('Login test completed!');
    
  } catch (error) {
    console.error(`Error testing login: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Testing student login with dataset credentials...\n');
    
    // Connect to database
    await connectDB();
    
    // Test login functionality
    await testLogin();
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();