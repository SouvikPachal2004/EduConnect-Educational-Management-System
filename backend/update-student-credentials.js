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
    console.log('📊 Reading Excel file and updating emails...\n');

    // Read Excel file
    const excelPath = '../../dataset/Student_DataSet.xlsx';
    const wb = XLSX.readFile(excelPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(ws);

    console.log(`Found ${excelData.length} students in Excel\n`);

    // Process each student
    const updatedRows = [];
    const password = '123456';
    const hashedPassword = await bcryptjs.hash(password, 10);

    for (const row of excelData) {
      const studentName = row["STUDENT'S FULL NAME"];
      const slNo = row['SL. NO.'];
      
      // Skip if no student name
      if (!studentName) {
        console.log(`SL.NO ${slNo}: ⚠️  No student name found, skipping\n`);
        continue;
      }
      
      // Generate email: firstname.lastname@gmail.com (handle spaces and special chars)
      const nameParts = studentName.trim().toLowerCase().split(/\s+/);
      const generatedEmail = nameParts.join('.') + '@gmail.com';

      console.log(`SL.NO ${slNo}: ${studentName}`);
      console.log(`  New Email: ${generatedEmail}`);
      console.log(`  Password: ${password}`);

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
    console.log(`   Password: ${password}`);
    console.log(`   Email: firstname.lastname@gmail.com (from their names)`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    mongoose.connection.close();
  }
});
