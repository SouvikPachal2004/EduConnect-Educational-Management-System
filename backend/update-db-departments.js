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

// Update department names
const updateDepartments = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║     UPDATING DATABASE DEPARTMENTS TO SHORT FORMS               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Update CS-DS to CSE(DS) in database
    const result1 = await User.updateMany(
      { department: 'CS-DS' },
      { department: 'CSE(DS)' }
    );
    
    if (result1.modifiedCount > 0) {
      console.log(`✓ Updated ${result1.modifiedCount} users from CS-DS to CSE(DS)`);
    }

    // Get all unique departments
    const departments = await User.distinct('department');
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         CURRENT DEPARTMENTS IN DATABASE                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    departments.sort().forEach(dept => {
      const count = User.countDocuments({ department: dept });
      console.log(`  ${dept}`);
    });

    console.log(`\n✅ Database updated successfully!`);
    console.log('\n📋 STANDARD DEPARTMENT SHORT FORMS:');
    console.log('  - CSE (Computer Science & Engineering)');
    console.log('  - CSE(AI) (CSE - AI)');
    console.log('  - CSE(DS) (CSE - Data Science)');
    console.log('  - CSE-AIML (CSE - AI/ML)');
    console.log('  - IT (Information Technology)');
    
  } catch (error) {
    console.error(`Error updating departments: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await updateDepartments();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
