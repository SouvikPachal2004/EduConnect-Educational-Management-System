const mongoose = require('mongoose');
const fs = require('fs');
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

// Parse CSV file
const parseCSV = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(',');
        const student = {};
        headers.forEach((header, index) => {
          student[header] = values[index] ? values[index].trim() : '';
        });
        students.push(student);
      }
    }
    
    console.log(`Parsed ${students.length} students from CSV file`);
    return students;
  } catch (error) {
    console.error(`Error parsing CSV file: ${error.message}`);
    process.exit(1);
  }
};

// Import students to database
const importStudents = async (students) => {
  try {
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const studentData of students) {
      try {
        // Generate email based on student_id if not present
        const email = studentData.email || `${studentData.student_id}@educonnect.com`;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
          console.log(`User with email ${email} already exists. Skipping...`);
          skippedCount++;
          continue;
        }
        
        // Hash default password
        const hashedPassword = await hashPassword("12345678");
        
        // Create user object with performance data
        const user = new User({
          name: `Student ${studentData.student_id}`,
          email: email,
          password: hashedPassword,
          role: 'student',
          studentId: studentData.student_id,
          department: 'General Studies',
          grade: Math.round(parseFloat(studentData.final_grade) / 10) // Convert to 0-10 scale
        });
        
        await user.save();
        console.log(`Successfully imported: ${user.name} (${user.email}) with grade ${user.grade}`);
        importedCount++;
      } catch (error) {
        console.error(`Error importing student ${studentData.student_id}: ${error.message}`);
      }
    }
    
    console.log('\nImport summary:');
    console.log(`- Imported: ${importedCount} students`);
    console.log(`- Skipped: ${skippedCount} students`);
    
  } catch (error) {
    console.error(`Error importing students: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('Starting student dataset import...');
    
    // Connect to database
    await connectDB();
    
    // Parse CSV file
    const csvFilePath = path.join(__dirname, 'student_performance_dataset.csv');
    const students = parseCSV(csvFilePath);
    
    // Import students to database
    await importStudents(students);
    
    console.log('\nStudent dataset import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();