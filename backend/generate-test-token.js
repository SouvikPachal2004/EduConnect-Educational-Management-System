const connectDB = require('./config/db');
const User = require('./models/User');
const { comparePassword } = require('./utils/auth.utils');
const { generateAuthToken } = require('./utils/auth.utils');

// Connect to database
connectDB();

// Generate a test token for the student
async function generateTestToken() {
  try {
    // Find the student user
    const student = await User.findOne({ email: 'anurag@student.com', role: 'student' });
    
    if (!student) {
      console.log('Student user not found');
      process.exit(1);
    }
    
    // Generate auth token
    const token = generateAuthToken(student);
    
    console.log('Student user found:', student.name);
    console.log('Student ID:', student.studentId);
    console.log('Auth token:', token);
    console.log('\nYou can use this token to test the API endpoints.');
    console.log('Add it to your request headers as:');
    console.log('Authorization: Bearer ' + token);
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating test token:', error);
    process.exit(1);
  }
}

// Run the token generation
generateTestToken();