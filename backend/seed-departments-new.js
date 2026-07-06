const mongoose = require('mongoose');
const Department = require('./models/Department');
const { SUPPORTED_DEPARTMENTS, DEPARTMENT_DEFAULTS } = require('./utils/departmentCatalog');
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
const departments = SUPPORTED_DEPARTMENTS.map(name => ({
  ...DEPARTMENT_DEFAULTS[name],
  hod: {
    CSE: 'Dr. Anil Verma',
    IT: 'Dr. Suresh Iyer',
    'CS-DS': 'Dr. Priya Singh',
    'CSE-AIML': 'Dr. Meena Reddy',
  }[name],
}));

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
