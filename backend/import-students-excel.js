const mongoose = require('mongoose');
const xlsx = require('xlsx');
const User = require('./models/User');
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

// Import students from Excel
const importStudentsFromExcel = async () => {
  try {
    const filePath = 'd:\\EduConnect\\FYP 12\\dataset\\Student_DataSet.xlsx';
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║     IMPORTING STUDENTS FROM EXCEL TO DATABASE                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        const studentId = row['SL. NO.'];
        const name = row["STUDENT'S FULL NAME"];
        const email = row['EMAIL ADDRESS - GMAIL'];
        const department = row['STREAM'];
        const cgpa = row['B.TECH  AVERAGE CGPA'];

        if (!email || !name) {
          console.log(`⚠ Skipping row ${studentId}: Missing email or name`);
          skippedCount++;
          continue;
        }

        // Check if student already exists
        const existingStudent = await User.findOne({ email });
        
        if (existingStudent) {
          skippedCount++;
          continue;
        }

        // Hash password (default: student123)
        const hashedPassword = await hashPassword('student123');

        // Create student
        const student = new User({
          name,
          email,
          password: hashedPassword,
          role: 'student',
          department,
          studentId: `STU${studentId}`,
          grade: cgpa,
          isActive: true
        });

        await student.save();
        importedCount++;

        if (importedCount % 10 === 0) {
          console.log(`✓ Imported ${importedCount} students...`);
        }

      } catch (error) {
        errors.push(`Row ${row['SL. NO.']}: ${error.message}`);
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`  ✓ Imported: ${importedCount} students`);
    console.log(`  ⏭ Skipped: ${skippedCount} (already exist)`);
    
    if (errors.length > 0) {
      console.log(`\n⚠ Errors:`, errors);
    }

    // Show department distribution
    const departments = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         STUDENT DISTRIBUTION BY DEPARTMENT                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    departments.forEach(dept => {
      console.log(`  ${dept._id}: ${dept.count} students`);
    });

    const totalStudents = await User.countDocuments({ role: 'student' });
    console.log(`\n  Total Students: ${totalStudents}`);

  } catch (error) {
    console.error(`Error importing students: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await importStudentsFromExcel();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
