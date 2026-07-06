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

// Delete default HODs
const deleteDefaultHODs = async () => {
  try {
    const defaultHODEmails = [
      'hod.cse@educonnect.com',
      'hod.cs-ds@educonnect.com',
      'hod.cse-aiml@educonnect.com',
      'hod.it@educonnect.com',
      'hod@educonnect.com',
      'teacher.cse@educonnect.com',
      'teacher.cs-ds@educonnect.com',
      'teacher.cse-aiml@educonnect.com',
      'teacher.it@educonnect.com'
    ];
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         DELETING DEFAULT HODs & TEACHERS                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    for (const email of defaultHODEmails) {
      const user = await User.findOne({ email });
      if (user) {
        await User.deleteOne({ email });
        console.log(`✓ Deleted: ${user.name} (${email}) - Role: ${user.role}`);
      }
    }
    
    console.log('\n✅ All default HODs and teachers deleted successfully!\n');
    
    // Show remaining HODs
    const remainingHODs = await User.find({ role: 'hod' })
      .select('name email department')
      .sort({ department: 1 });
    
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           REMAINING HODs (gmail.com only)                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    remainingHODs.forEach((hod, index) => {
      console.log(`${index + 1}. ${hod.name}`);
      console.log(`   Email: ${hod.email}`);
      console.log(`   Department: ${hod.department}`);
      console.log('');
    });
    
  } catch (error) {
    console.error(`Error deleting HODs: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await deleteDefaultHODs();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
