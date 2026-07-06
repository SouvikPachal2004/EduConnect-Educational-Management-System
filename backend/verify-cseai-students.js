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

// Verify CSE(AI) students
const verifyCsaiStudents = async () => {
  try {
    const cseaiStudents = await User.find({ 
      role: 'student',
      department: 'CSE(AI)' 
    }).select('name email department grade studentId').sort({ name: 1 });

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         CSE(AI) DEPARTMENT - ALL STUDENTS                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    if (cseaiStudents.length === 0) {
      console.log('❌ No students found for CSE(AI) department!');
    } else {
      console.log(`Total CSE(AI) Students: ${cseaiStudents.length}\n`);
      cseaiStudents.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name}`);
        console.log(`   Email: ${student.email}`);
        console.log(`   ID: ${student.studentId}`);
        console.log(`   CGPA: ${student.grade || 'N/A'}`);
        console.log('');
      });
    }

    // Show all departments
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         ALL DEPARTMENTS - STUDENT COUNT                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const departments = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    departments.forEach(dept => {
      console.log(`  ${dept._id}: ${dept.count} students`);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await verifyCsaiStudents();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
