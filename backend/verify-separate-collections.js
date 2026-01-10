const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const { getDepartmentGradeModel } = require('./models/DepartmentGradeCollections');

// Connect to database
const connectDB = require('./config/db');
connectDB();

// Verification function
const verifyCollections = async () => {
  try {
    console.log('Verifying separate department collections...');
    
    // Get all students grouped by department
    const students = await User.find({ role: 'student' });
    const studentsByDept = {};
    students.forEach(student => {
      const dept = student.department || 'No Department';
      if (!studentsByDept[dept]) {
        studentsByDept[dept] = [];
      }
      studentsByDept[dept].push(student);
    });
    
    console.log('Departments found in student data:');
    Object.keys(studentsByDept).forEach(dept => {
      console.log(`  ${dept}: ${studentsByDept[dept].length} students`);
    });
    
    // Check each department's separate collection
    console.log('\nChecking separate collections:');
    let totalRecords = 0;
    
    for (const dept in studentsByDept) {
      if (dept === 'No Department' || !dept) continue;
      
      try {
        // Get the department-specific model
        const DepartmentGrade = getDepartmentGradeModel(dept);
        
        // Count records in this department's collection
        const count = await DepartmentGrade.countDocuments();
        totalRecords += count;
        
        console.log(`  ${dept} collection: ${count} records`);
        
        // Show sample records
        if (count > 0) {
          const sampleRecords = await DepartmentGrade.find({})
            .populate({ path: 'student', select: 'name studentId' })
            .limit(3);
          
          sampleRecords.forEach(record => {
            console.log(`    - ${record.studentName} (${record.studentId}): CGPA ${record.cgpa || 'N/A'}`);
          });
          
          if (count > 3) {
            console.log(`    ... and ${count - 3} more`);
          }
        }
      } catch (error) {
        console.error(`  Error checking ${dept} collection:`, error.message);
      }
    }
    
    console.log(`\nTotal records across all department collections: ${totalRecords}`);
    
    // Test export functionality for one department
    console.log('\nTesting export functionality for CSE department...');
    try {
      const CSEGrade = getDepartmentGradeModel('CSE');
      const cseGrades = await CSEGrade.find({})
        .populate({ path: 'student', select: 'name email studentId' })
        .sort({ studentName: 1 });
      
      console.log(`Found ${cseGrades.length} records in CSE collection for export test`);
      
      // Create sample CSV content
      let csvContent = 'Student ID,Student Name,Email,Department,CGPA,Last Updated,Updated By\n';
      
      cseGrades.slice(0, 3).forEach(grade => {
        const studentName = grade.student ? grade.student.name : 'N/A';
        const studentEmail = grade.student ? grade.student.email : 'N/A';
        const studentId = grade.student ? grade.student.studentId : 'N/A';
        const lastUpdatedBy = grade.lastUpdatedBy ? 'Teacher' : 'N/A';
        const lastUpdatedAt = grade.lastUpdatedAt ? new Date(grade.lastUpdatedAt).toLocaleDateString() : 'N/A';
        
        // Escape commas and quotes in fields
        const escapeField = (field) => {
          if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };
        
        csvContent += `${escapeField(studentId)},${escapeField(studentName)},${escapeField(studentEmail)},CSE,${grade.cgpa || 'N/A'},${lastUpdatedAt},${escapeField(lastUpdatedBy)}\n`;
      });
      
      console.log('Sample CSV content:');
      console.log(csvContent);
      
    } catch (error) {
      console.error('Error testing export functionality:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Verification error:', error);
    process.exit(1);
  }
};

verifyCollections();