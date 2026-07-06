const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Department = require('./models/Department');
const { SUPPORTED_DEPARTMENTS, DEPARTMENT_DEFAULTS } = require('./utils/departmentCatalog');

// Load env vars
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGO_URI);

const departments = SUPPORTED_DEPARTMENTS.map(name => ({
  ...DEPARTMENT_DEFAULTS[name],
  hod: {
    CSE: 'Dr. Anil Verma',
    IT: 'Dr. Suresh Iyer',
    'CS-DS': 'Dr. Priya Singh',
    'CSE-AIML': 'Dr. Meena Reddy',
  }[name],
}));

const seedDepartments = async () => {
  try {
    // Clear existing departments
    await Department.deleteMany({});
    console.log('Cleared existing departments');

    // Insert new departments
    const createdDepartments = await Department.insertMany(departments);
    console.log(`${createdDepartments.length} departments created successfully`);
    
    console.log('\nDepartments:');
    createdDepartments.forEach(dept => {
      console.log(`- ${dept.name} (HOD: ${dept.hod})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding departments:', error);
    process.exit(1);
  }
};

seedDepartments();
