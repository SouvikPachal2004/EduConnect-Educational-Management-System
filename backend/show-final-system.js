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

// Final summary
const finalSummary = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║        EDUCONNECT - FINAL CONSOLIDATED SYSTEM                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Get all HODs
    const hods = await User.find({ role: 'hod' })
      .select('name email department teacherId')
      .sort({ department: 1 });

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ALL HODs                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    for (const hod of hods) {
      const studentCount = await User.countDocuments({ 
        role: 'student',
        department: hod.department
      });

      console.log(`🏫 ${hod.department}`);
      console.log(`   HOD: ${hod.name}`);
      console.log(`   Email: ${hod.email}`);
      console.log(`   Password: hod123`);
      console.log(`   Students: ${studentCount}`);
      console.log('');
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║            FINAL DEPARTMENT DISTRIBUTION                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const depts = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    depts.forEach(dept => {
      console.log(`  ${dept._id}: ${dept.count} students`);
    });

    const totalStudents = await User.countDocuments({ role: 'student' });
    console.log(`\n  TOTAL: ${totalStudents} students`);

    console.log('\n✅ System ready! All HODs will see their respective students.');
    console.log('📄 Now refresh your browser to see the updates!\n');

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await finalSummary();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
