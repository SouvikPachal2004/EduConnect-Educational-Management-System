const mongoose = require('mongoose');
const User = require('./models/User');
const bcryptjs = require('bcryptjs');
const XLSX = require('xlsx');

mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  try {
    console.log('🔄 RESTORING ALL STUDENTS FROM EXCEL...\n');

    // Step 1: Delete all existing students
    console.log('Step 1: Deleting all existing students...');
    const deleteResult = await User.deleteMany({ role: 'student' });
    console.log(`✅ Deleted ${deleteResult.deletedCount} students\n`);

    // Step 2: Read Excel file
    console.log('Step 2: Reading Excel file...');
    const excelPath = '../../dataset/Student_DataSet.xlsx';
    const wb = XLSX.readFile(excelPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(ws);
    console.log(`✅ Found ${excelData.length} students in Excel\n`);

    // Step 3: Import all students with new credentials
    console.log('Step 3: Importing students with new credentials...\n');
    let importedCount = 0;

    for (const row of excelData) {
      const studentName = row["STUDENT'S FULL NAME"];
      const slNo = row['SL. NO.'];
      const department = row['STREAM'];
      const cgpa = row['B.TECH  AVERAGE CGPA'];
      const email = row['EMAIL ADDRESS - GMAIL'];

      if (!studentName) {
        console.log(`⚠️  Row skipped: no student name`);
        continue;
      }

      // Generate email: firstname.lastname@gmail.com
      const nameParts = studentName.trim().toLowerCase().split(/\s+/).filter(p => p.length > 0);
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      const generatedEmail = firstName + (lastName && firstName !== lastName ? '.' + lastName : '') + '@gmail.com';

      // Generate password: Name@2026 (First letter capital, rest lowercase)
      const passwordName = studentName.trim().split(/\s+/)[0]; // First name
      const generatedPassword = passwordName.charAt(0).toUpperCase() + passwordName.slice(1).toLowerCase() + '@2026';

      const hashedPassword = await bcryptjs.hash(generatedPassword, 10);

      const newStudent = new User({
        name: studentName,
        email: generatedEmail,
        password: hashedPassword,
        role: 'student',
        department: department,
        studentId: String(slNo),
        grade: cgpa,
        isActive: true
      });

      await newStudent.save();
      importedCount++;

      console.log(`${importedCount}. ${studentName} (ID: ${slNo})`);
      console.log(`   Email: ${generatedEmail}`);
      console.log(`   Password: ${generatedPassword}\n`);
    }

    console.log(`\n✅ Successfully imported ${importedCount} students!\n`);

    // Step 4: Verify import
    console.log('Step 4: Verifying import...\n');
    const totalStudents = await User.countDocuments({ role: 'student' });
    console.log(`Total students in database: ${totalStudents}`);

    const deptCounts = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\nDepartment breakdown:');
    deptCounts.forEach(dept => {
      console.log(`  ${dept._id}: ${dept.count} students`);
    });

    console.log(`\n🎉 RESTORATION COMPLETE!`);
    console.log(`All students can now login with:`);
    console.log(`  Email: firstname@gmail.com`);
    console.log(`  Password: FirstName@2026`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    mongoose.connection.close();
  }
});
