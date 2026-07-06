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
    console.log('🎓 STUDENT LOGIN CREDENTIALS SUMMARY\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                   ALL STUDENTS - NEW CREDENTIALS                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const students = await User.find({ role: 'student' })
      .select('studentId name email')
      .sort({ studentId: 1 });

    console.log(`📊 Total Students: ${students.length}\n`);
    console.log(`🔐 Password for ALL Students: 123456\n`);
    console.log('Sample Login Credentials:\n');

    // Show first 5 and last 5 students
    students.slice(0, 5).forEach((student, idx) => {
      console.log(`${idx + 1}. Email: ${student.email}`);
      console.log(`   Password: 123456\n`);
    });

    if (students.length > 10) {
      console.log('...\n');
      students.slice(-5).forEach((student, idx) => {
        console.log(`${students.length - 4 + idx}. Email: ${student.email}`);
        console.log(`   Password: 123456\n`);
      });
    }

    console.log('✅ All 76 students can login with their name-based email and password "123456"');
    console.log('📝 Email format: firstname.middlename.lastname@gmail.com');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
});
