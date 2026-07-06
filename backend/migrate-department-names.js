const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const EnrollmentRequest = require('./models/EnrollmentRequest');

// Database connection
mongoose.connect('mongodb://localhost:27017/educonnect_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('❌ Database connection error:', error);
  process.exit(1);
});

db.once('open', async () => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                   DEPARTMENT MIGRATION                         ║');
  console.log('║                                                                ║');
  console.log('║  CS-DS → CSE(DS)                                              ║');
  console.log('║  CSE-AIML → CSE(AIML)                                         ║');
  console.log('║  Add ECE Department                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    let totalUpdated = 0;

    // 1. Migrate Users (Students, Teachers, HODs)
    console.log('📝 Migrating Users...\n');
    
    const userUpdates = [
      { from: 'CS-DS', to: 'CSE(DS)' },
      { from: 'CSE-AIML', to: 'CSE(AIML)' }
    ];

    for (const update of userUpdates) {
      const result = await User.updateMany(
        { department: update.from },
        { department: update.to }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✓ Updated ${result.modifiedCount} users from ${update.from} to ${update.to}`);
        totalUpdated += result.modifiedCount;
      } else {
        console.log(`ℹ️  No users found with department: ${update.from}`);
      }
    }

    // 2. Migrate Department Documents
    console.log('\n📝 Migrating Department Documents...\n');
    
    for (const update of userUpdates) {
      const result = await Department.updateMany(
        { name: update.from },
        { name: update.to }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✓ Updated ${result.modifiedCount} department documents from ${update.from} to ${update.to}`);
      }
    }

    // 3. Migrate Classes
    console.log('\n📝 Migrating Classes...\n');
    
    for (const update of userUpdates) {
      const result = await Class.updateMany(
        { department: update.from },
        { department: update.to }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✓ Updated ${result.modifiedCount} classes from ${update.from} to ${update.to}`);
      }
    }

    // 4. Migrate Subjects
    console.log('\n📝 Migrating Subjects...\n');
    
    for (const update of userUpdates) {
      const result = await Subject.updateMany(
        { department: update.from },
        { department: update.to }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✓ Updated ${result.modifiedCount} subjects from ${update.from} to ${update.to}`);
      }
    }

    // 5. Create ECE Department if it doesn't exist
    console.log('\n📝 Ensuring ECE Department Exists...\n');
    
    const eceExists = await Department.findOne({ name: 'ECE' });
    if (!eceExists) {
      await Department.create({
        name: 'ECE',
        hod: 'Not assigned',
        faculty: 0,
        students: 0,
        established: 2010,
        isActive: true,
        description: 'Electronics and Communication Engineering Department'
      });
      console.log('✓ Created ECE department');
    } else {
      console.log('ℹ️  ECE department already exists');
    }

    // 6. Verify migration results
    console.log('\n📊 VERIFICATION RESULTS:\n');
    
    const departmentCounts = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('Current user distribution by department:');
    departmentCounts.forEach(dept => {
      console.log(`  ${dept._id}: ${dept.count} users`);
    });

    // Check for any remaining old department names
    console.log('\n🔍 Checking for remaining old department names...\n');
    
    const oldDeptUsers = await User.find({
      department: { $in: ['CS-DS', 'CSE-AIML'] }
    });

    if (oldDeptUsers.length > 0) {
      console.log('⚠️  WARNING: Found users still using old department names:');
      oldDeptUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}): ${user.department}`);
      });
    } else {
      console.log('✅ No users found with old department names');
    }

    // List all departments
    console.log('\n📋 All departments in system:\n');
    const allDepartments = await Department.find({ isActive: true }).sort({ name: 1 });
    
    allDepartments.forEach(dept => {
      console.log(`  📁 ${dept.name} (Established: ${dept.established})`);
    });

    if (allDepartments.length === 0) {
      console.log('ℹ️  No department documents found. Creating default departments...\n');
      
      const defaultDepartments = [
        { name: 'CSE', hod: 'Not assigned', established: 2005, description: 'Computer Science and Engineering' },
        { name: 'IT', hod: 'Not assigned', established: 2008, description: 'Information Technology' },
        { name: 'CSE(DS)', hod: 'Not assigned', established: 2015, description: 'Computer Science and Engineering - Data Science' },
        { name: 'CSE(AIML)', hod: 'Not assigned', established: 2020, description: 'Computer Science and Engineering - AI/ML' },
        { name: 'ECE', hod: 'Not assigned', established: 2010, description: 'Electronics and Communication Engineering' }
      ];

      for (const dept of defaultDepartments) {
        await Department.create({
          ...dept,
          faculty: 0,
          students: 0,
          isActive: true
        });
        console.log(`✓ Created ${dept.name} department`);
      }
    }

    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log(`📊 Total records updated: ${totalUpdated}`);
    console.log('\n🎯 SUMMARY:');
    console.log('  - CS-DS → CSE(DS)');
    console.log('  - CSE-AIML → CSE(AIML)');
    console.log('  - ECE department ensured');
    console.log('  - All system components updated');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
});