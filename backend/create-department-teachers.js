const mongoose = require('mongoose');
const User = require('./models/User');
const { hashPassword } = require('./utils/auth.utils');
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

// Department data with HOD information
const departments = [
  { name: 'CSE', hod: 'Dr. Anil Verma' },
  { name: 'IT', hod: 'Dr. Suresh Iyer' },
  { name: 'CS-DS', hod: 'Dr. Priya Singh' },
  { name: 'CSE-AIML', hod: 'Dr. Meena Reddy' }
];

// Create departmental teachers
const createDepartmentTeachers = async () => {
  try {
    let createdCount = 0;
    
    for (const dept of departments) {
      try {
        // Create HOD
        const hodEmail = `hod.${dept.name.toLowerCase()}@educonnect.com`;
        const existingHOD = await User.findOne({ email: hodEmail });
        
        if (!existingHOD) {
          const hashedPassword = await hashPassword("12345678");
          const hod = new User({
            name: dept.hod,
            email: hodEmail,
            password: hashedPassword,
            role: 'hod',
            department: dept.name,
            teacherId: `HOD-${dept.name}`,
            isActive: true
          });
          
          await hod.save();
          console.log(`Created HOD: ${hod.name} (${hod.email}) for department ${dept.name}`);
          createdCount++;
        } else {
          console.log(`HOD for ${dept.name} already exists: ${existingHOD.name}`);
        }
        
        // Create a teacher for the department
        const teacherEmail = `teacher.${dept.name.toLowerCase()}@educonnect.com`;
        const existingTeacher = await User.findOne({ email: teacherEmail });
        
        if (!existingTeacher) {
          const hashedPassword = await hashPassword("12345678");
          const teacher = new User({
            name: `Prof. ${dept.name} Teacher`,
            email: teacherEmail,
            password: hashedPassword,
            role: 'teacher',
            department: dept.name,
            teacherId: `TEA-${dept.name}`,
            isActive: true
          });
          
          await teacher.save();
          console.log(`Created Teacher: ${teacher.name} (${teacher.email}) for department ${dept.name}`);
          createdCount++;
        } else {
          console.log(`Teacher for ${dept.name} already exists: ${existingTeacher.name}`);
        }
        
      } catch (error) {
        console.error(`Error creating users for department ${dept.name}: ${error.message}`);
      }
    }
    
    console.log(`\nCreated ${createdCount} departmental teachers/HODs`);
    
  } catch (error) {
    console.error(`Error creating departmental teachers: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Creating departmental teachers and HODs...');
    
    // Connect to database
    await connectDB();
    
    // Create departmental teachers
    await createDepartmentTeachers();
    
    console.log('\nDepartmental teachers and HODs creation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();