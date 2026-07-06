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

// Fix department mapping
const fixDepartmentMapping = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║     FIXING DEPARTMENT MAPPING - CSE CONSOLIDATION              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Update all "Computer Science and Engineering" to "CSE"
    const result1 = await User.updateMany(
      { department: 'Computer Science and Engineering' },
      { department: 'CSE' }
    );

    console.log(`✓ Updated ${result1.modifiedCount} users from "Computer Science and Engineering" to "CSE"`);

    // Update all "Computer Science & Engineering" to "CSE"
    const result2 = await User.updateMany(
      { department: 'Computer Science & Engineering' },
      { department: 'CSE' }
    );

    console.log(`✓ Updated ${result2.modifiedCount} users from "Computer Science & Engineering" to "CSE"\n`);

    // Verify HODs
    const hods = await User.find({ role: 'hod' })
      .select('name email department')
      .sort({ department: 1 });

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║              ALL HODs - UPDATED DEPARTMENTS                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    hods.forEach(hod => {
      console.log(`${hod.name} (${hod.email})`);
      console.log(`  Department: ${hod.department}`);
    });

    // Verify department distribution
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         FINAL DEPARTMENT DISTRIBUTION - STUDENTS              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const depts = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    depts.forEach(dept => {
      console.log(`  ${dept._id}: ${dept.count} students`);
    });

    console.log('\n✅ All departments consolidated to SHORT FORMS!');
    console.log('✅ HODs and students now share matching department names!');

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await fixDepartmentMapping();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
