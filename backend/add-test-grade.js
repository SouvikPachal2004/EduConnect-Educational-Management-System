const mongoose = require('mongoose');
const User = require('./models/User');
const Grade = require('./models/Grade');
const Class = require('./models/Class');
const Assignment = require('./models/Assignment');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addTestGrade() {
  try {
    // Find a student in the CSE department
    const student = await User.findOne({ role: 'student', department: 'CSE' });
    if (!student) {
      console.log('No student found in CSE department');
      mongoose.connection.close();
      return;
    }
    
    // Find a teacher in the CSE department
    const teacher = await User.findOne({ role: 'teacher', department: 'CSE' });
    if (!teacher) {
      console.log('No teacher found in CSE department');
      mongoose.connection.close();
      return;
    }
    
    // Find a class taught by this teacher
    const classObj = await Class.findOne({ teacher: teacher._id });
    if (!classObj) {
      console.log('No class found for this teacher');
      mongoose.connection.close();
      return;
    }
    
    // Find an assignment for this class
    const assignment = await Assignment.findOne({ class: classObj._id });
    if (!assignment) {
      console.log('No assignment found for this class');
      mongoose.connection.close();
      return;
    }
    
    // Create a new grade
    const newGrade = new Grade({
      student: student._id,
      class: classObj._id,
      assignment: assignment._id,
      type: 'assignment',
      name: 'Test Assignment Grade',
      points: 85,
      maxPoints: 100,
      percentage: 85,
      letterGrade: 'B',
      gradedBy: teacher._id,
      notes: 'This is a test grade added for synchronization verification'
    });
    
    const savedGrade = await newGrade.save();
    console.log('New grade added successfully:');
    console.log(`- Student: ${student.name}`);
    console.log(`- Class: ${classObj.name}`);
    console.log(`- Assignment: ${assignment.title}`);
    console.log(`- Score: ${savedGrade.points}/${savedGrade.maxPoints} (${savedGrade.percentage}%)`);
    console.log(`- Letter Grade: ${savedGrade.letterGrade}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error adding test grade:', error);
    mongoose.connection.close();
  }
}

addTestGrade();