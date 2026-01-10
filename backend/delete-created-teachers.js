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

// Delete the teachers I created
const deleteCreatedTeachers = async () => {
  try {
    const teachersToDelete = [
      "anil.verma@educonnect.com",
      "suresh.iyer@educonnect.com",
      "priya.singh@educonnect.com",
      "meena.reddy@educonnect.com"
    ];
    
    let deletedCount = 0;
    
    for (const email of teachersToDelete) {
      try {
        const result = await User.deleteOne({ email: email, role: 'teacher' });
        
        if (result.deletedCount > 0) {
          console.log(`Deleted teacher: ${email}`);
          deletedCount++;
        } else {
          console.log(`Teacher not found or not deleted: ${email}`);
        }
      } catch (error) {
        console.error(`Error deleting teacher ${email}: ${error.message}`);
      }
    }
    
    console.log(`\nDeleted ${deletedCount} teachers`);
    
  } catch (error) {
    console.error(`Error deleting teachers: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Deleting teachers created by the system...');
    
    // Connect to database
    await connectDB();
    
    // Delete the teachers
    await deleteCreatedTeachers();
    
    console.log('\nTeacher deletion completed!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();