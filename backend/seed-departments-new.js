const mongoose = require('mongoose');
const Department = require('./models/Department');
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

// Department data
const departments = [
  { name: 'CSE', hod: 'Dr. Anil Verma', faculty: 15, students: 120, established: 2005 },
  { name: 'IT', hod: 'Dr. Suresh Iyer', faculty: 12, students: 100, established: 2008 },
  { name: 'CS-DS', hod: 'Dr. Priya Singh', faculty: 10, students: 80, established: 2015 },
  { name: 'CSE-AIML', hod: 'Dr. Meena Reddy', faculty: 8, students: 60, established: 2020 }
];

// Create departments
const createDepartments = async () => {
  try {
    let createdCount = 0;
    
    for (const dept of departments) {
      try {
        // Check if department already exists
        const existingDept = await Department.findOne({ name: dept.name });
        
        if (!existingDept) {
          const newDept = new Department({
            name: dept.name,
            hod: dept.hod,
            faculty: dept.faculty,
            students: dept.students,
            established: dept.established,
            isActive: true
          });
          
          await newDept.save();
          console.log(`Created Department: ${newDept.name} with HOD ${newDept.hod}`);
          createdCount++;
        } else {
          console.log(`Department ${dept.name} already exists`);
        }
        
      } catch (error) {
        console.error(`Error creating department ${dept.name}: ${error.message}`);
      }
    }
    
    console.log(`\nCreated ${createdCount} departments`);
    
  } catch (error) {
    console.error(`Error creating departments: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Creating departments...');
    
    // Connect to database
    await connectDB();
    
    // Create departments
    await createDepartments();
    
    console.log('\nDepartment creation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();