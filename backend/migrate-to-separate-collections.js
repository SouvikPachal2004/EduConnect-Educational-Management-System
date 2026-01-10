const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const OldDepartmentGrade = require('./models/DepartmentGrade');
const User = require('./models/User');
const { getDepartmentGradeModel } = require('./models/DepartmentGradeCollections');

// Connect to database
const connectDB = require('./config/db');
connectDB();

// Migration function
const migrateData = async () => {
  try {
    console.log('Starting migration to separate collections...');
    
    // Get all existing department grades
    const allOldGrades = await OldDepartmentGrade.find({})
      .populate({ path: 'student', select: 'name email studentId department' })
      .populate({ path: 'lastUpdatedBy', select: 'name email' });
    
    console.log(`Found ${allOldGrades.length} records to migrate`);
    
    // Group by department
    const gradesByDepartment = {};
    allOldGrades.forEach(grade => {
      const dept = grade.department;
      if (!gradesByDepartment[dept]) {
        gradesByDepartment[dept] = [];
      }
      gradesByDepartment[dept].push(grade);
    });
    
    let totalMigrated = 0;
    
    // For each department, create records in separate collection
    for (const dept in gradesByDepartment) {
      console.log(`\nMigrating ${gradesByDepartment[dept].length} records for ${dept} department...`);
      
      // Get the department-specific model
      const DepartmentGrade = getDepartmentGradeModel(dept);
      
      // Migrate each grade record
      for (const oldGrade of gradesByDepartment[dept]) {
        try {
          // Check if record already exists in new collection
          const existing = await DepartmentGrade.findOne({
            student: oldGrade.student._id
          });
          
          if (!existing) {
            // Create new record in department-specific collection
            const newGrade = new DepartmentGrade({
              student: oldGrade.student._id,
              studentId: oldGrade.studentId,
              studentName: oldGrade.studentName,
              studentEmail: oldGrade.studentEmail,
              cgpa: oldGrade.cgpa,
              history: oldGrade.history,
              lastUpdatedBy: oldGrade.lastUpdatedBy ? oldGrade.lastUpdatedBy._id : null,
              lastUpdatedAt: oldGrade.lastUpdatedAt,
              createdAt: oldGrade.createdAt,
              updatedAt: oldGrade.updatedAt
            });
            
            await newGrade.save();
            totalMigrated++;
            console.log(`  Migrated: ${oldGrade.studentName} (${oldGrade.studentId})`);
          } else {
            console.log(`  Skipped (already exists): ${oldGrade.studentName} (${oldGrade.studentId})`);
          }
        } catch (error) {
          console.error(`  Error migrating ${oldGrade.studentName}:`, error.message);
        }
      }
    }
    
    console.log(`\nMigration complete! Total records migrated: ${totalMigrated}`);
    
    // Verify migration
    console.log('\nVerifying migration...');
    for (const dept in gradesByDepartment) {
      const DepartmentGrade = getDepartmentGradeModel(dept);
      const count = await DepartmentGrade.countDocuments();
      console.log(`  ${dept} collection: ${count} records`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateData();