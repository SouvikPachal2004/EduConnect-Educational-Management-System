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
    console.log('📝 Migrating CSE-AIML students to CSE(AI)...\n');

    // Find all CSE-AIML students
    const cseaimlStudents = await User.find({ 
      role: 'student',
      department: 'CSE-AIML' 
    });

    console.log(`Found ${cseaimlStudents.length} CSE-AIML students\n`);

    if (cseaimlStudents.length > 0) {
      // Display students before migration
      console.log('📊 Students before migration:');
      cseaimlStudents.forEach((student, idx) => {
        console.log(`${idx + 1}. ${student.name} (ID: ${student.studentId}) - ${student.department}`);
      });

      // Update all CSE-AIML students to CSE(AI)
      const result = await User.updateMany(
        { role: 'student', department: 'CSE-AIML' },
        { department: 'CSE(AI)' }
      );

      console.log(`\n✅ Updated ${result.modifiedCount} students from CSE-AIML to CSE(AI)\n`);

      // Verify the migration
      const cseaiStudents = await User.find({ 
        role: 'student',
        department: 'CSE(AI)' 
      });

      console.log('📊 Students after migration (CSE(AI)):');
      cseaiStudents.forEach((student, idx) => {
        console.log(`${idx + 1}. ${student.name} (ID: ${student.studentId}) - ${student.department}`);
      });

      console.log(`\n🎉 Migration Complete!`);
      console.log(`CSE(AI) now has ${cseaiStudents.length} total students`);
      console.log(`All CSE(AI) students will have HOD: Soumen Das (soumenhod@gmail.com)`);
    } else {
      console.log('⚠️  No CSE-AIML students found');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
});
