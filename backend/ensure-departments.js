/**
 * Ensure all 5 departments exist with correct names in the database.
 * Renames old CS-DS → CSE(DS) and CSE-AIML → CSE(AIML), creates ECE if missing.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Department = require('./models/Department');
const User       = require('./models/User');
const Class      = require('./models/Class');
const Subject    = require('./models/Subject');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect_db';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', err => { console.error('DB error:', err); process.exit(1); });

mongoose.connection.once('open', async () => {
  console.log('\n=== EduConnect Department Fix ===\n');

  try {
    /* ─── 1. Rename old department docs if they still exist ─── */
    const renames = [
      { from: 'CS-DS',    to: 'CSE(DS)' },
      { from: 'CSE-AIML', to: 'CSE(AI)' },
      { from: 'CSE(AIML)',to: 'CSE(AI)' },
      { from: 'CSE-AI',   to: 'CSE(AI)' },
      { from: 'CSE AI',   to: 'CSE(AI)' },
      { from: 'AIML',     to: 'CSE(AI)' },
      { from: 'CSE-DS',   to: 'CSE(DS)' },
      { from: 'CSE DS',   to: 'CSE(DS)' },
      { from: 'Data Science', to: 'CSE(DS)' },
    ];

    for (const { from, to } of renames) {
      const old = await Department.findOne({ name: from });
      if (old) {
        old.name = to;
        await old.save();
        console.log(`✓ Renamed Department doc: ${from} → ${to}`);
      }

      // Update users, classes, subjects
      const uRes = await User.updateMany({ department: from }, { department: to });
      if (uRes.modifiedCount) console.log(`  ✓ Updated ${uRes.modifiedCount} users: ${from} → ${to}`);

      const cRes = await Class.updateMany({ department: from }, { department: to });
      if (cRes.modifiedCount) console.log(`  ✓ Updated ${cRes.modifiedCount} classes: ${from} → ${to}`);

      const sRes = await Subject.updateMany({ department: from }, { department: to });
      if (sRes.modifiedCount) console.log(`  ✓ Updated ${sRes.modifiedCount} subjects: ${from} → ${to}`);
    }

    /* ─── 2. Ensure all 5 canonical departments exist ─── */
    const defaults = [
      { name: 'CSE',     hod: 'Not assigned', faculty: 0, students: 0, established: 2005 },
      { name: 'IT',      hod: 'Not assigned', faculty: 0, students: 0, established: 2008 },
      { name: 'CSE(DS)', hod: 'Not assigned', faculty: 0, students: 0, established: 2015 },
      { name: 'CSE(AI)', hod: 'Not assigned', faculty: 0, students: 0, established: 2020 },
      { name: 'ECE',     hod: 'Not assigned', faculty: 0, students: 0, established: 2010 },
    ];

    for (const dept of defaults) {
      const exists = await Department.findOne({ name: dept.name });
      if (!exists) {
        await Department.create({ ...dept, isActive: true });
        console.log(`✓ Created department: ${dept.name}`);
      } else {
        console.log(`ℹ  Department already exists: ${dept.name}`);
      }
    }

    /* ─── 3. Verification ─── */
    console.log('\n=== Current Departments in DB ===');
    const all = await Department.find({ isActive: true }).sort({ name: 1 });
    all.forEach(d => console.log(`  📁 ${d.name}`));

    console.log('\n=== User distribution ===');
    const dist = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    dist.forEach(r => console.log(`  ${r._id || '(none)'}: ${r.count}`));

    console.log('\n✅ Done!\n');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
});
