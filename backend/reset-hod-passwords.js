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

// Reset HOD passwords
const resetHODPasswords = async () => {
  try {
    const newPassword = 'hod123';
    const hashedPassword = await hashPassword(newPassword);
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         RESETTING ALL HOD PASSWORDS                           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    // Update all HODs
    const result = await User.updateMany(
      { role: 'hod' },
      { password: hashedPassword }
    );
    
    console.log(`✓ Updated ${result.modifiedCount} HOD passwords\n`);
    
    // Display all HODs with new password
    const hods = await User.find({ role: 'hod' })
      .select('name email department')
      .sort({ department: 1 });
    
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║              ALL HODs WITH NEW PASSWORD                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    hods.forEach((hod, index) => {
      console.log(`${index + 1}. Name: ${hod.name}`);
      console.log(`   Email: ${hod.email}`);
      console.log(`   Department: ${hod.department}`);
      console.log(`   Password: ${newPassword}`);
      console.log('');
    });
    
    console.log(`✅ All HOD passwords have been set to: ${newPassword}\n`);
    
  } catch (error) {
    console.error(`Error resetting passwords: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await resetHODPasswords();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
