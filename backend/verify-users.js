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

// Verify users in collection
const verifyUsers = async () => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments();
    console.log(`Total users in collection: ${totalUsers}`);
    
    // Count students
    const studentCount = await User.countDocuments({ role: 'student' });
    console.log(`Total students: ${studentCount}`);
    
    // Count teachers
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    console.log(`Total teachers: ${teacherCount}`);
    
    // Count admins
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`Total admins: ${adminCount}`);
    
    // Count HODs
    const hodCount = await User.countDocuments({ role: 'hod' });
    console.log(`Total HODs: ${hodCount}`);
    
    // Show department distribution for students
    console.log('\n=== Student Distribution by Department ===');
    const departments = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    departments.forEach(dept => {
      console.log(`${dept._id}: ${dept.count} students`);
    });
    
    // Show teachers and their departments
    console.log('\n=== Teachers ===');
    const teachers = await User.find({ role: 'teacher' })
      .select('name email department teacherId')
      .sort({ department: 1 });
    
    teachers.forEach(teacher => {
      console.log(`${teacher.name} - ${teacher.department} (${teacher.email})`);
    });
    
    // Show sample students
    console.log('\n=== Sample Students ===');
    const sampleStudents = await User.find({ role: 'student' })
      .select('name email department studentId grade')
      .limit(10);
    
    sampleStudents.forEach(student => {
      console.log(`${student.name} - ${student.department} (${student.email}) - ID: ${student.studentId}, Grade: ${student.grade || 'N/A'}`);
    });
    
  } catch (error) {
    console.error(`Error verifying users: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Verifying users in collection...');
    
    // Connect to database
    await connectDB();
    
    // Verify users
    await verifyUsers();
    
    console.log('\nUser verification completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();