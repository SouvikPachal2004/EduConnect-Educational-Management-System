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

// Update HOD department
const updateHODDepartment = async () => {
  try {
    const email = 'amit@gmail.com';
    const newDepartment = 'IT';
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         UPDATING HOD DEPARTMENT                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found!`);
      process.exit(1);
    }
    
    console.log(`Original Department: ${user.department}`);
    
    // Update department
    user.department = newDepartment;
    await user.save();
    
    console.log(`✓ Updated Department: ${user.department}`);
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              UPDATED HOD DETAILS                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    const updatedUser = await User.findOne({ email });
    console.log(`Name: ${updatedUser.name}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Department: ${updatedUser.department}`);
    console.log(`Role: ${updatedUser.role}`);
    console.log(`Teacher ID: ${updatedUser.teacherId}`);
    console.log('\n✅ Department updated successfully!\n');
    
  } catch (error) {
    console.error(`Error updating HOD: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await updateHODDepartment();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
