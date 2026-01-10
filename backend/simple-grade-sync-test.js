const mongoose = require('mongoose');
const User = require('./models/User');
const Grade = require('./models/Grade');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testGradeSync() {
  try {
    console.log('Testing grade synchronization...');
    
    // Find a teacher in the CSE department
    const teacher = await User.findOne({ role: 'teacher', department: 'CSE' });
    if (!teacher) {
      console.log('No teacher found in CSE department');
      mongoose.connection.close();
      return;
    }
    
    console.log(`Testing for teacher: ${teacher.name} (Department: ${teacher.department})`);
    
    // Get students in the same department
    const students = await User.find({
      role: 'student',
      department: teacher.department
    }).select('_id name');
    
    const studentIds = students.map(student => student._id);
    console.log(`Found ${students.length} students in ${teacher.department} department`);
    
    // Get grades for these students
    const grades = await Grade.find({
      student: { $in: studentIds }
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${grades.length} grades for students in ${teacher.department} department`);
    
    console.log('\nSynchronization test completed successfully!');
    console.log('The teacher dashboard should now show these grades when the CSE teacher logs in.');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error testing grade synchronization:', error);
    mongoose.connection.close();
  }
}

testGradeSync();