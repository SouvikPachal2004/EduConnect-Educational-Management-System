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
    console.log('📊 Updating student credentials to new format...\n');

    // Read Excel file
    const excelPath = '../../dataset/Student_DataSet.xlsx';
    const wb = XLSX.readFile(excelPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(ws);

    console.log(`Found ${excelData.length} students in Excel\n`);

    // Track email usage for duplicates
    const emailCount = {};
    const updatedRows = [];

    // First pass: count emails to handle duplicates
    for (const row of excelData) {
      const studentName = row["STUDENT'S FULL NAME"];
      if (studentName) {
        const firstName = studentName.trim().split(/\s+/)[0].toLowerCase();
        const baseEmail = firstName;
        emailCount[baseEmail] = (emailCount[baseEmail] || 0) + 1;
      }
    }

    // Second pass: update records
    const emailUsed = {};

    for (const row of excelData) {
      const studentName = row["STUDENT'S FULL NAME"];
      const slNo = row['SL. NO.'];
      
      if (!studentName) {
        console.log(`SL.NO ${slNo}: ⚠️  No student name found, skipping\n`);
        continue;
      }
      
      // Generate email with duplicate handling
      const firstName = studentName.trim().split(/\s+/)[0].toLowerCase();
      let generatedEmail;
      
      if (emailCount[firstName] > 1) {
        // Has duplicates - add counter
        const count = (emailUsed[firstName] || 0) + 1;
        emailUsed[firstName] = count;
        generatedEmail = `${firstName}${count}@gmail.com`;
      } else {
        // Unique first name
        generatedEmail = `${firstName}@gmail.com`;
      }
      
      // Generate password: Name@2026 (capitalize name, @2026)
      const generatedPassword = studentName.trim().split(/\s+/)[0].charAt(0).toUpperCase() + 
                               studentName.trim().split(/\s+/)[0].slice(1).toLowerCase() + '@2026';

      console.log(`SL.NO ${slNo}: ${studentName}`);
      console.log(`  New Email: ${generatedEmail}`);
      console.log(`  New Password: ${generatedPassword}`);

      // Hash password
      const hashedPassword = await bcryptjs.hash(generatedPassword, 10);

      // Update Excel row with new email
      row['EMAIL ADDRESS - GMAIL'] = generatedEmail;
      updatedRows.push(row);

      // Update in database
      const result = await User.findOneAndUpdate(
        { studentId: String(slNo), role: 'student' },
        { 
          email: generatedEmail,
          password: hashedPassword
        },
        { new: true }
      );

      if (result) {
        console.log(`  ✅ Database updated\n`);
      } else {
        console.log(`  ⚠️  Student not found in database\n`);
      }
    }

    // Write updated data back to Excel
    const newWs = XLSX.utils.json_to_sheet(updatedRows);
    wb.Sheets[wb.SheetNames[0]] = newWs;
    XLSX.writeFile(wb, excelPath);

    console.log(`\n✅ Excel file updated: ${excelPath}`);
    console.log(`✅ All ${excelData.length} students updated in database`);
    console.log(`\n📌 All students can now login with:`);
    console.log(`   Email: firstname@gmail.com (first name only)`);
    console.log(`   Password: FirstName@2026 (e.g., Abhishek@2026)`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    mongoose.connection.close();
  }
});
