/**
 * Script to fix and update all student roll numbers to be sequential
 * This will reassign roll numbers starting from 1 in ascending order
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
const User = require('../models/User');

const fixStudentRollNumbers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all students sorted by creation date (oldest first)
    console.log('\nFetching all students...');
    const students = await User.find({ role: 'student' })
      .sort({ createdAt: 1 })
      .select('_id name email studentId createdAt');

    console.log(`Found ${students.length} students`);

    if (students.length === 0) {
      console.log('No students found. Exiting...');
      process.exit(0);
    }

    console.log('\nCurrent student roll numbers:');
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} - Current Roll: ${student.studentId || 'N/A'}`);
    });

    console.log('\n--- Starting roll number update ---\n');

    // Update each student with sequential roll numbers
    let rollNumber = 1;
    for (const student of students) {
      const oldRollNumber = student.studentId;
      student.studentId = rollNumber.toString();
      await student.save();
      
      console.log(`✓ Updated: ${student.name}`);
      console.log(`  Old Roll: ${oldRollNumber || 'N/A'} → New Roll: ${rollNumber}`);
      
      rollNumber++;
    }

    console.log('\n--- Update Complete ---\n');
    console.log('Updated student roll numbers:');
    
    // Fetch and display updated students
    const updatedStudents = await User.find({ role: 'student' })
      .sort({ studentId: 1 })
      .select('name studentId department');

    updatedStudents.forEach(student => {
      console.log(`Roll ${student.studentId}: ${student.name} (${student.department || 'N/A'})`);
    });

    console.log(`\n✓ Successfully updated ${students.length} student roll numbers!`);
    
  } catch (error) {
    console.error('Error fixing student roll numbers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run the script
fixStudentRollNumbers();
