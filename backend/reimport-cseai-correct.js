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

// Reimport CSE(AI) students with correct IDs
const reimportCseaiStudents = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  DELETING & RE-IMPORTING CSE(AI) WITH CORRECT IDs             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Delete existing CSE(AI) students
    const deleteResult = await User.deleteMany({
      role: 'student',
      department: 'CSE(AI)'
    });
    console.log(`✓ Deleted ${deleteResult.deletedCount} CSE(AI) students\n`);

    // Read Excel file
    const filePath = 'd:\\EduConnect\\FYP 12\\dataset\\Student_DataSet.xlsx';
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Filter CSE(AI) students
    const cseaiData = data.filter(row => row['STREAM'] === 'CSE(AI)');

    let importedCount = 0;
    const hashedPassword = await hashPassword('student123');

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
        console.log(`✓ ${studentId} | ${name} | ${email}`);

      } catch (error) {
        console.error(`✗ Error importing row ${row['SL. NO.']}: ${error.message}`);
      }
    }

    console.log(`\n✅ Re-imported ${importedCount} CSE(AI) students with correct IDs\n`);

    // Verify
    const verifyStudents = await User.find({ 
      role: 'student',
      department: 'CSE(AI)'
    }).select('name studentId email').sort({ studentId: 1 });

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         CSE(AI) STUDENTS - VERIFIED SEQUENTIAL IDs             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    verifyStudents.forEach(student => {
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
    await reimportCseaiStudents();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
