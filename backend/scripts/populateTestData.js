const mongoose = require('mongoose');
const DepartmentGrade = require('../models/DepartmentGrade');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Test data
const testData = [
  {
    studentId: '693d90c0cb24a9f8f2f97714', // Test Student 1
    studentName: 'Test Student 1',
    studentEmail: 'student1@test.com',
    department: 'Computer Science & Engineering',
    cgpa: 2.5
  },
  {
    studentId: '693d90c8cb24a9f8f2f97717', // Test Student 2
    studentName: 'Test Student 2',
    studentEmail: 'student2@test.com',
    department: 'Computer Science & Engineering',
    cgpa: 3.8
  }
];

async function populateTestData() {
  try {
    // Clear existing data
    await DepartmentGrade.deleteMany({});
    
    // Insert test data
    for (const data of testData) {
      const departmentGrade = new DepartmentGrade({
        student: data.studentId,
        studentId: data.studentId,
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        department: data.department,
        cgpa: data.cgpa,
        history: [],
        lastUpdatedBy: '693d90b7cb24a9f8f2f97711', // Admin user
        lastUpdatedAt: new Date()
      });
      
      await departmentGrade.save();
      console.log(`Created department grade for ${data.studentName}`);
    }
    
    console.log('Test data populated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error populating test data:', error);
    process.exit(1);
  }
}

populateTestData();