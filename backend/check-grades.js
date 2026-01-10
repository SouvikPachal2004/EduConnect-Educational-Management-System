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

async function checkGrades() {
  try {
    const grades = await Grade.find().limit(5);
    
    console.log('Sample grades:');
    for (const grade of grades) {
      // Populate references
      const student = await User.findById(grade.student);
      const classObj = await Class.findById(grade.class);
      const assignment = await Assignment.findById(grade.assignment);
      
      console.log(`- Student: ${student?.name} (${student?.department})`);
      console.log(`  Class: ${classObj?.name}`);
      console.log(`  Assignment: ${assignment?.title}`);
      console.log(`  Score: ${grade.points}/${grade.maxPoints} (${grade.percentage}%)`);
      console.log(`  Letter Grade: ${grade.letterGrade}`);
      console.log('---');
    }
    
    const gradeCount = await Grade.countDocuments();
    console.log(`Total grades in database: ${gradeCount}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

checkGrades();