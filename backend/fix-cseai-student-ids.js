const mongoose = require('mongoose');
const User = require('./models/User');
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

// Fix CSE(AI) student IDs
const fixCseaiStudentIds = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║     FIXING CSE(AI) STUDENT IDs TO MATCH EXCEL SL. NO.          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Map of email to correct SL. NO. from Excel
    const correctIds = {
      'aditya.sharma@gmail.com': '69',
      'priya.verma@gmail.com': '70',
      'rohan.gupta@gmail.com': '71',
      'neha.singh@gmail.com': '72',
      'arjun.patel@gmail.com': '73',
      'divya.nair@gmail.com': '74',
      'vikram.kumar@gmail.com': '75',
      'sneha.iyer@gmail.com': '76'
    };

    let updateCount = 0;

    for (const [email, correctId] of Object.entries(correctIds)) {
      const student = await User.findOne({ email, role: 'student' });
      
      if (student) {
        console.log(`Updating: ${student.name}`);
        console.log(`  Old ID: ${student.studentId}`);
        student.studentId = correctId;
        await student.save();
        console.log(`  New ID: ${student.studentId}`);
        console.log('');
        updateCount++;
      }
    }

    console.log(`✅ Updated ${updateCount} student IDs\n`);

    // Show updated students
    const updatedStudents = await User.find({ 
      role: 'student',
      department: 'CSE(AI)'
    }).select('name studentId email').sort({ studentId: 1 });

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         CSE(AI) STUDENTS - CORRECT IDs                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    updatedStudents.forEach((student, index) => {
      console.log(`${index + 1}. ID: ${student.studentId} | ${student.name} | ${student.email}`);
    });

  } catch (error) {
    console.error(`Error fixing student IDs: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await fixCseaiStudentIds();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
