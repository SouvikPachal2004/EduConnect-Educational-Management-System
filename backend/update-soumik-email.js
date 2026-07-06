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

// Update email
const updateEmail = async () => {
  try {
    const oldEmail = 'soumik@gmail.com';
    const newEmail = 'soumikhod@gmail.com';
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         UPDATING EMAIL ADDRESS                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    const user = await User.findOne({ email: oldEmail });
    
    if (!user) {
      console.log(`❌ User with email ${oldEmail} not found!`);
      process.exit(1);
    }
    
    console.log(`Original Email: ${user.email}`);
    
    // Check if new email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      console.log(`❌ Email ${newEmail} already exists!`);
      process.exit(1);
    }
    
    // Update email
    user.email = newEmail;
    await user.save();
    
    console.log(`✓ Updated Email: ${user.email}`);
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              UPDATED HOD DETAILS                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    const updatedUser = await User.findOne({ email: newEmail });
    console.log(`Name: ${updatedUser.name}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Department: ${updatedUser.department}`);
    console.log(`Role: ${updatedUser.role}`);
    console.log(`Teacher ID: ${updatedUser.teacherId}`);
    console.log('\n✅ Email updated successfully!\n');
    
  } catch (error) {
    console.error(`Error updating email: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await updateEmail();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
