const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Department = require('./models/Department');

// Load env vars
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGO_URI);

const departments = [
  {
    name: 'Computer Engineering',
    hod: 'Dr. Priya Singh',
    faculty: 24,
    students: 342,
    established: 2010
  },
  {
    name: 'Mechanical Engineering',
    hod: 'Dr. Anil Verma',
    faculty: 18,
    students: 285,
    established: 2005
  },
  {
    name: 'Electrical Engineering',
    hod: 'Dr. Suresh Iyer',
    faculty: 20,
    students: 310,
    established: 2008
  },
  {
    name: 'Civil Engineering',
    hod: 'Dr. Meena Reddy',
    faculty: 16,
    students: 275,
    established: 2012
  },
  {
    name: 'Chemical Engineering',
    hod: 'Dr. Rajesh Gupta',
    faculty: 14,
    students: 195,
    established: 2015
  }
];

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
