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

// Parse TSV file (grade.xlsx is actually a TSV file)
const parseTSV = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');
    const headers = lines[0].split('\t').map(h => h.trim());
    
    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split('\t');
        const student = {};
        headers.forEach((header, index) => {
          student[header] = values[index] ? values[index].trim() : '';
        });
        // Only add students with valid data
        if (student.name && student.email) {
          students.push(student);
        }
      }
    }
    
    console.log(`Parsed ${students.length} students from TSV file`);
    return students;
  } catch (error) {
    console.error(`Error parsing TSV file: ${error.message}`);
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
        const name = studentData.name;
        const email = studentData.email;
        const rollNumber = studentData.roll_number;
        const role = studentData.role;
        const department = studentData.department;
        const grade = studentData.grade;
        
        // Skip if essential data is missing
        if (!name || !email) {
          console.log(`Skipping student - Missing name or email`);
          skippedCount++;
          continue;
        }
        
        // Clean email
        const cleanEmail = email.trim();
        
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
          role: 'student', // Force role to student
          studentId: rollNumber,
          department: department,
          grade: grade ? parseFloat(grade) : undefined,
          isActive: true
        });
        
        await user.save();
        console.log(`Successfully imported: ${user.name} (${user.email}) - Department: ${user.department}, Grade: ${user.grade}`);
        importedCount++;
      } catch (error) {
        console.error(`Error importing student ${studentData.name}: ${error.message}`);
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
    console.log('Starting grade student dataset import...');
    
    // Connect to database
    await connectDB();
    
    // Parse TSV file
    const tsvFilePath = path.join(__dirname, 'grade.xlsx'); // Note: This is actually a TSV file
    const students = parseTSV(tsvFilePath);
    
    // Import students to database
    await importStudents(students);
    
    console.log('\nGrade student dataset import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();