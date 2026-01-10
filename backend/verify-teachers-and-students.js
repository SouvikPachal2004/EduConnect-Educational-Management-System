const mongoose = require('mongoose');
const User = require('./models/User');
const { comparePassword } = require('./utils/auth.utils');
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

// Verify teachers and students
const verifyTeachersAndStudents = async () => {
  try {
    // Display created teachers
    console.log('=== Departmental Teachers ===');
    const teachers = await User.find({ role: 'teacher' })
      .select('name email department teacherId')
      .sort({ department: 1 });
    
    teachers.forEach(teacher => {
      console.log(`${teacher.name} - ${teacher.department} (${teacher.email})`);
    });
    
    console.log(`\nTotal teachers: ${teachers.length}`);
    
    // Test login for one teacher
    console.log('\n=== Testing Teacher Login ===');
    const testTeacher = await User.findOne({ email: "anil@gmail.com" });
    if (testTeacher) {
      const isMatch = await comparePassword("123456", testTeacher.password);
      if (isMatch) {
        console.log(`✅ Login successful for: ${testTeacher.name} (${testTeacher.email})`);
      } else {
        console.log(`❌ Login failed for: ${testTeacher.name} (${testTeacher.email})`);
      }
    }
    
    // Display students by department
    console.log('\n=== Students by Department ===');
    const departments = ['CSE', 'IT', 'CS-DS', 'CSE-AIML'];
    
    for (const dept of departments) {
      console.log(`\n${dept} Department:`);
      const students = await User.find({ role: 'student', department: dept })
        .select('name email studentId')
        .limit(3); // Show only first 3 students for brevity
      
      students.forEach(student => {
        console.log(`  - ${student.name} (${student.email})`);
      });
      
      const totalCount = await User.countDocuments({ role: 'student', department: dept });
      console.log(`  Total students in ${dept}: ${totalCount}`);
    }
    
    // Test login for one student from each department
    console.log('\n=== Testing Student Logins ===');
    const testStudents = [
      { email: "abhisheksingh27493@gmail.com", department: "CS-DS" }, // CS-DS student
      { email: "kanup8137@gmail.com", department: "CSE" }, // CSE student
      { email: "huzaifaluqmani13@gmail.com", department: "IT" }, // IT student
      { email: "arkadeep.pathak@gmail.com", department: "CSE-AIML" } // CSE-AIML student
    ];
    
    for (const studentData of testStudents) {
      const student = await User.findOne({ email: studentData.email });
      if (student) {
        const isMatch = await comparePassword("12345678", student.password);
        if (isMatch) {
          console.log(`✅ Login successful for ${studentData.department} student: ${student.name}`);
        } else {
          console.log(`❌ Login failed for ${studentData.department} student: ${student.name}`);
        }
      }
    }
    
  } catch (error) {
    console.error(`Error verifying teachers and students: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Verifying teachers and students...\n');
    
    // Connect to database
    await connectDB();
    
    // Verify teachers and students
    await verifyTeachersAndStudents();
    
    console.log('\nVerification completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();