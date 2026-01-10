const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./models/User');
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

// Read TSV file and extract student grade data
const readStudentGrades = () => {
  try {
    // Read the TSV file
    const tsvData = fs.readFileSync('grade.xlsx', 'utf8');
    
    // Parse TSV data
    const lines = tsvData.split('\n');
    const headers = lines[0].split('\t').map(h => h.trim()); // Trim headers to remove any whitespace
    
    // Find the indices of the relevant columns
    const emailIndex = headers.indexOf('email');
    // Find grade column by checking for 'grade' in headers (accounting for possible carriage return)
    let gradeIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].includes('grade')) {
        gradeIndex = i;
        break;
      }
    }
    
    console.log(`Email column index: ${emailIndex}, Grade column index: ${gradeIndex}`);
    
    // Process the data to create a map of email to grade
    const studentGrades = {};
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split('\t');
        const email = values[emailIndex]?.toLowerCase().trim();
        const grade = values[gradeIndex]?.trim();
        
        if (email && grade) {
          // Remove any trailing carriage return from grade
          const cleanGrade = grade.replace(/\r$/, '');
          studentGrades[email] = parseFloat(cleanGrade);
        }
      }
    }
    
    console.log(`Loaded grades for ${Object.keys(studentGrades).length} students from TSV file`);
    return studentGrades;
  } catch (error) {
    console.error(`Error reading TSV file: ${error.message}`);
    process.exit(1);
  }
};

// Update student grades in the database
const updateStudentGrades = async (studentGrades) => {
  try {
    let updatedCount = 0;
    let notFoundCount = 0;
    
    // Get all students from the database
    const students = await User.find({ role: 'student' }).select('name email studentId');
    
    console.log(`Found ${students.length} students in the database`);
    
    // Update each student's grade
    for (const student of students) {
      const email = student.email.toLowerCase().trim();
      
      if (studentGrades[email]) {
        // Add or update the grade field for the student
        await User.updateOne(
          { _id: student._id },
          { $set: { grade: studentGrades[email] } }
        );
        console.log(`Updated grade for ${student.name}: ${studentGrades[email]}`);
        updatedCount++;
      } else {
        console.log(`No grade found for ${student.name} (${email})`);
        notFoundCount++;
      }
    }
    
    console.log(`\nGrade update summary:`);
    console.log(`- Updated: ${updatedCount} students`);
    console.log(`- Not found in TSV: ${notFoundCount} students`);
    console.log(`- Total students processed: ${students.length}`);
    
  } catch (error) {
    console.error(`Error updating student grades: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Read student grades from TSV
    const studentGrades = readStudentGrades();
    
    // Update student grades in database
    await updateStudentGrades(studentGrades);
    
    console.log('\nStudent grades update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();