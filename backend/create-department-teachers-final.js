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

// Department teachers data with required format
const departmentTeachers = [
  {
    name: "Dr. Anil Verma",
    email: "anil@gmail.com",
    department: "CSE",
    role: "teacher",
    teacherId: "TEA_CSE_001"
  },
  {
    name: "Dr. Suresh Iyer",
    email: "suresh@gmail.com",
    department: "IT",
    role: "teacher",
    teacherId: "TEA_IT_001"
  },
  {
    name: "Dr. Priya Singh",
    email: "priya@gmail.com",
    department: "CS-DS",
    role: "teacher",
    teacherId: "TEA_CS_DS_001"
  },
  {
    name: "Dr. Meena Reddy",
    email: "meena@gmail.com",
    department: "CSE-AIML",
    role: "teacher",
    teacherId: "TEA_CSE_AIML_001"
  }
];

// Create departmental teachers
const createDepartmentTeachers = async () => {
  try {
    let createdCount = 0;
    
    for (const teacherData of departmentTeachers) {
      try {
        // Check if teacher already exists
        const existingTeacher = await User.findOne({ email: teacherData.email });
        
        if (existingTeacher) {
          console.log(`Teacher with email ${teacherData.email} already exists. Skipping...`);
          continue;
        }
        
        // Hash password (123456)
        const hashedPassword = await hashPassword("123456");
        
        // Create teacher object
        const teacher = new User({
          name: teacherData.name,
          email: teacherData.email,
          password: hashedPassword,
          role: teacherData.role,
          department: teacherData.department,
          teacherId: teacherData.teacherId,
          isActive: true
        });
        
        await teacher.save();
        console.log(`Successfully created teacher: ${teacher.name} (${teacher.email}) - Department: ${teacher.department}`);
        createdCount++;
      } catch (error) {
        console.error(`Error creating teacher ${teacherData.name}: ${error.message}`);
      }
    }
    
    console.log(`\nCreated ${createdCount} departmental teachers`);
    
  } catch (error) {
    console.error(`Error creating departmental teachers: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Creating departmental teachers with required format...');
    
    // Connect to database
    await connectDB();
    
    // Create departmental teachers
    await createDepartmentTeachers();
    
    console.log('\nDepartmental teachers created successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();