const mongoose = require('mongoose');
const User = require('./models/User');
const Class = require('./models/Class');
const { generateAuthToken } = require('./utils/auth.utils');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the teacher user
    const user = await User.findOne({email: 'teacher@educonnect.com'});
    if (!user) {
      console.error('Teacher user not found');
      process.exit(1);
    }
    
    // Find a class taught by this teacher
    const classObj = await Class.findOne({teacher: user._id});
    if (!classObj) {
      console.error('No class found for this teacher');
      process.exit(1);
    }
    
    console.log('Using class:', {id: classObj._id, name: classObj.name});
    
    // Generate a JWT token for the user
    const token = generateAuthToken(user);
    
    console.log('Generated token:', token);
    
    // Test the face recognition endpoint
    const classId = classObj._id.toString();
    
    // Import and test the face recognition controller function directly
    const { takeAttendance } = require('./controllers/faceRecognition.controller');
    
    // Mock request and response objects
    const req = {
      body: { classId },
      user: { id: user._id.toString() },
      headers: { authorization: `Bearer ${token}` }
    };
    
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log('Response status:', this.statusCode);
        console.log('Response data:', JSON.stringify(data, null, 2));
        process.exit(0);
      }
    };
    
    console.log('Calling takeAttendance function...');
    await takeAttendance(req, res);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });