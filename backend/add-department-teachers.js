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

// Department teachers data
const departmentTeachers = [
  {
    name: "Dr. Anil Verma",
    email: "anil.verma@educonnect.com",
    department: "CSE",
    role: "teacher",
    teacherId: "TEA001"
  },
  {
    name: "Dr. Suresh Iyer",
    email: "suresh.iyer@educonnect.com",
    department: "IT",
    role: "teacher",
    teacherId: "TEA002"
  },
  {
    name: "Dr. Priya Singh",
    email: "priya.singh@educonnect.com",
    department: "CS-DS",
    role: "teacher",
    teacherId: "TEA003"
  },
  {
    name: "Dr. Meena Reddy",
    email: "meena.reddy@educonnect.com",
    department: "CSE-AIML",
    role: "teacher",
    teacherId: "TEA004"
  }
];

// Add departmental teachers to user collection
const addDepartmentTeachers = async () => {
  try {
    let addedCount = 0;
    
    for (const teacherData of departmentTeachers) {
      try {
        // Check if teacher already exists
        const existingTeacher = await User.findOne({ email: teacherData.email });
        
        if (existingTeacher) {
          console.log(`Teacher with email ${teacherData.email} already exists. Skipping...`);
          continue;
        }
        
        // Hash default password
        const hashedPassword = await hashPassword("12345678");
        
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
        console.log(`Successfully added teacher: ${teacher.name} (${teacher.email}) - Department: ${teacher.department}`);
        addedCount++;
      } catch (error) {
        console.error(`Error adding teacher ${teacherData.name}: ${error.message}`);
      }
    }
    
    console.log(`\nAdded ${addedCount} departmental teachers to user collection`);
    
  } catch (error) {
    console.error(`Error adding departmental teachers: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Adding departmental teachers to user collection...');
    
    // Connect to database
    await connectDB();
    
    // Add departmental teachers
    await addDepartmentTeachers();
    
    console.log('\nDepartmental teachers added successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();