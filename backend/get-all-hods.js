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

// Get all HODs
const getAllHODs = async () => {
  try {
    const hods = await User.find({ role: 'hod' })
      .select('name email department teacherId password')
      .sort({ department: 1 });
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         ALL HODs (HEAD OF DEPARTMENTS) IN SYSTEM              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    if (hods.length === 0) {
      console.log('❌ No HODs found in the system.');
      console.log('Please run: node create-department-teachers.js\n');
    } else {
      console.log(`Total HODs: ${hods.length}\n`);
      
      hods.forEach((hod, index) => {
        console.log(`${index + 1}. Department: ${hod.department || 'N/A'}`);
        console.log(`   Name: ${hod.name}`);
        console.log(`   Email: ${hod.email}`);
        console.log(`   Teacher ID: ${hod.teacherId}`);
        console.log(`   Password: 12345678`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error(`Error fetching HODs: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await getAllHODs();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
