const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log('Updating all teacher passwords to 123456...\n');

async function updateTeacherPasswords() {
  try {
    // Find all teachers
    const teachers = await User.find({ role: 'teacher' });
    
    if (teachers.length === 0) {
      console.log('No teachers found in the database.');
      process.exit(0);
    }

    console.log(`Found ${teachers.length} teachers:\n`);
    
    // Hash the new password
    const newPassword = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update each teacher's password
    let updatedCount = 0;
    for (const teacher of teachers) {
      console.log(`Updating password for: ${teacher.name} (${teacher.email || teacher.teacherId})`);
      teacher.password = hashedPassword;
      await teacher.save();
      updatedCount++;
    }
    
    console.log(`\n✅ Successfully updated passwords for ${updatedCount} teachers!`);
    console.log(`\nAll teachers can now login with password: 123456`);
    console.log('\nTeacher list:');
    teachers.forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.name} - Email: ${teacher.email || 'N/A'} - Teacher ID: ${teacher.teacherId || 'N/A'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating teacher passwords:', error);
    process.exit(1);
  }
}

updateTeacherPasswords();
