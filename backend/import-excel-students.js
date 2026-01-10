const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
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

// Parse Excel file
const parseExcel = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Get first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    
    // Filter out empty rows and header rows
    const students = data.filter(row => {
      // Check if row has student data (not empty and not header)
      return row['SL. NO.'] && typeof row['SL. NO.'] === 'number' && row['STUDENT\'S FULL NAME'];
    });
    
    console.log(`Parsed ${students.length} students from Excel file`);
    return students;
  } catch (error) {
    console.error(`Error parsing Excel file: ${error.message}`);
    process.exit(1);
  }
};

// Import students to database
const importStudents = async (students) => {
  try {
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const studentData of students) {
      try {
        // Extract student information
        const slNo = studentData['SL. NO.'];
        const name = studentData['STUDENT\'S FULL NAME'];
        const stream = studentData['STREAM'] || 'General';
        const email = studentData['EMAIL ADDRESS - GMAIL'];
        
        // Skip if essential data is missing
        if (!name || !email) {
          console.log(`Skipping student at SL.NO ${slNo} - Missing name or email`);
          skippedCount++;
          continue;
        }
        
        // Clean email (remove mailto: if present)
        const cleanEmail = email.replace('mailto:', '').trim();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
          console.log(`User with email ${cleanEmail} already exists. Skipping...`);
          skippedCount++;
          continue;
        }
        
        // Hash default password
        const hashedPassword = await hashPassword("12345678");
        
        // Create user object
        const user = new User({
          name: name,
          email: cleanEmail,
          password: hashedPassword,
          role: 'student',
          studentId: `STU${String(slNo).padStart(5, '0')}`, // Format as STU00001, STU00002, etc.
          department: stream,
          isActive: true
        });
        
        await user.save();
        console.log(`Successfully imported: ${user.name} (${user.email}) - Department: ${user.department}`);
        importedCount++;
      } catch (error) {
        console.error(`Error importing student: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\nImport summary:');
    console.log(`- Imported: ${importedCount} students`);
    console.log(`- Skipped: ${skippedCount} students`);
    console.log(`- Errors: ${errorCount} students`);
    
  } catch (error) {
    console.error(`Error importing students: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Starting Excel student dataset import...');
    
    // Connect to database
    await connectDB();
    
    // Parse Excel file
    const excelFilePath = path.join(__dirname, 'Student_DataSet.xlsx');
    const students = parseExcel(excelFilePath);
    
    // Import students to database
    await importStudents(students);
    
    console.log('\nExcel student dataset import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();