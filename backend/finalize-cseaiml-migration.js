const mongoose = require('mongoose');
const User = require('./models/User');
const XLSX = require('xlsx');

mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  try {
    console.log('🔄 MIGRATING CSE-AIML STUDENTS TO CSE(AI) IN DATABASE...\n');

    // Find all CSE-AIML students
    const cseaimlCount = await User.countDocuments({ role: 'student', department: 'CSE-AIML' });
    console.log(`Found ${cseaimlCount} CSE-AIML students\n`);

    if (cseaimlCount > 0) {
      // Update all CSE-AIML to CSE(AI)
      const result = await User.updateMany(
        { role: 'student', department: 'CSE-AIML' },
        { department: 'CSE(AI)' }
      );

      console.log(`✅ Migrated ${result.modifiedCount} students\n`);

      // Update Excel file
      console.log('📝 Updating Excel file...\n');
      const excelPath = '../../dataset/Student_DataSet.xlsx';
      const wb = XLSX.readFile(excelPath);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const excelData = XLSX.utils.sheet_to_json(ws);

      // Update CSE-AIML to CSE(AI) in Excel
      excelData.forEach(row => {
        if (row['STREAM'] === 'CSE-AIML') {
          row['STREAM'] = 'CSE(AI)';
        }
      });

      // Write back to Excel
      const newWs = XLSX.utils.json_to_sheet(excelData);
      wb.Sheets[wb.SheetNames[0]] = newWs;
      XLSX.writeFile(wb, excelPath);

      console.log(`✅ Excel file updated\n`);

      // Verify final state
      console.log('📊 Final department distribution:\n');
      const deptCounts = await User.aggregate([
        { $match: { role: 'student' } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      deptCounts.forEach(dept => {
        console.log(`  ${dept._id}: ${dept.count} students`);
      });

      const totalStudents = await User.countDocuments({ role: 'student' });
      console.log(`\n✅ TOTAL: ${totalStudents} students`);
      console.log('\n🎉 All CSE-AIML students migrated to CSE(AI)!');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    mongoose.connection.close();
  }
});
