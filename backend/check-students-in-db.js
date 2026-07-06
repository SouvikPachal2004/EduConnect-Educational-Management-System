const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  try {
    console.log('🔍 Checking student data in database...\n');

    // Count all students
    const totalStudents = await User.countDocuments({ role: 'student' });
    console.log(`Total Students in Database: ${totalStudents}\n`);

    // Count CSE(AI) students
    const cseaiStudents = await User.countDocuments({ role: 'student', department: 'CSE(AI)' });
    console.log(`CSE(AI) Students: ${cseaiStudents}\n`);

    // List all CSE(AI) students
    console.log('📊 All CSE(AI) Students:\n');
    const students = await User.find({ role: 'student', department: 'CSE(AI)' })
      .select('studentId name email')
      .sort({ studentId: 1 });

    students.forEach((student, idx) => {
      console.log(`${idx + 1}. ID: ${student.studentId} | ${student.name} | ${student.email}`);
    });

    console.log(`\n✅ All ${cseaiStudents} CSE(AI) students are present in the database`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
});
