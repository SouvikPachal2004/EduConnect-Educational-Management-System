const mongoose = require('mongoose');
const User = require('./models/User');
const xlsx = require('xlsx');
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

// Find and remove duplicate IDs
const removeAndReiimport = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  FIXING DUPLICATE IDs (69, 70) & RE-IMPORTING                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Find who has ID 69 and 70
    const user69 = await User.findOne({ studentId: '69' });
    const user70 = await User.findOne({ studentId: '70' });

    console.log('Current owners of conflicting IDs:');
    if (user69) console.log(`  ID 69: ${user69.name} (${user69.email}) - ${user69.department}`);
    if (user70) console.log(`  ID 70: ${user70.name} (${user70.email}) - ${user70.department}`);

    // Delete them since they should be CSE(AI)
    if (user69) {
      await User.deleteOne({ studentId: '69' });
      console.log(`\n✓ Deleted conflicting ID 69: ${user69.name}`);
    }
    if (user70) {
      await User.deleteOne({ studentId: '70' });
      console.log(`✓ Deleted conflicting ID 70: ${user70.name}`);
    }

    // Now re-import CSE(AI) students with correct IDs
    console.log('\nRe-importing CSE(AI) students...\n');

    const filePath = 'd:\\EduConnect\\FYP 12\\dataset\\Student_DataSet.xlsx';
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const cseaiData = data.filter(row => row['STREAM'] === 'CSE(AI)');
    const hashedPassword = await hashPassword('student123');

    let importedCount = 0;

    for (const row of cseaiData) {
      try {
        const studentId = String(row['SL. NO.']);
        const name = row["STUDENT'S FULL NAME"];
        const email = row['EMAIL ADDRESS - GMAIL'];
        const department = row['STREAM'];
        const cgpa = row['B.TECH  AVERAGE CGPA'];

        const student = new User({
          name,
          email,
          password: hashedPassword,
          role: 'student',
          department,
          studentId,
          grade: cgpa,
          isActive: true
        });

        await student.save();
        importedCount++;
        console.log(`✓ ${studentId} | ${name}`);

      } catch (error) {
        console.error(`✗ Error: ${error.message}`);
      }
    }

    console.log(`\n✅ Total CSE(AI) students imported: ${importedCount}\n`);

    // Verify all
    const allCsai = await User.find({ 
      role: 'student',
      department: 'CSE(AI)'
    }).select('name studentId email').sort({ studentId: 1 });

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         CSE(AI) STUDENTS - FINAL VERIFIED LIST                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    allCsai.forEach(student => {
      console.log(`ID: ${student.studentId} | ${student.name}`);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await removeAndReiimport();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
