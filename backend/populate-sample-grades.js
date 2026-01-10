const mongoose = require('mongoose');
const User = require('./models/User');
const Grade = require('./models/Grade');
const Class = require('./models/Class');
const Assignment = require('./models/Assignment');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function populateSampleGrades() {
  try {
    // Clear existing grades
    await Grade.deleteMany({});
    console.log('Cleared existing grades');
    
    // Get some sample students and teachers
    const students = await User.find({ role: 'student' }).limit(10);
    const teachers = await User.find({ role: 'teacher' });
    
    if (students.length === 0 || teachers.length === 0) {
      console.log('No students or teachers found in database');
      return;
    }
    
    // Create sample classes
    const classes = [
      { name: 'Data Structures', code: 'CS201', teacher: teachers[0]._id },
      { name: 'Algorithms', code: 'CS301', teacher: teachers[1]._id },
      { name: 'Database Systems', code: 'CS302', teacher: teachers[2]._id },
      { name: 'Machine Learning', code: 'CS401', teacher: teachers[0]._id }
    ];
    
    // Insert classes
    const insertedClasses = [];
    for (const classData of classes) {
      const existingClass = await Class.findOne({ code: classData.code });
      if (existingClass) {
        insertedClasses.push(existingClass);
      } else {
        const newClass = new Class(classData);
        const savedClass = await newClass.save();
        insertedClasses.push(savedClass);
        console.log(`Created class: ${savedClass.name}`);
      }
    }
    
    // Create sample assignments
    const assignments = [
      { 
        title: 'Binary Trees Implementation', 
        class: insertedClasses[0]._id,
        teacher: teachers[0]._id,
        description: 'Implement binary tree data structure with insertion, deletion, and traversal operations.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
      },
      { 
        title: 'Graph Algorithms', 
        class: insertedClasses[1]._id,
        teacher: teachers[1]._id,
        description: 'Implement graph algorithms including BFS, DFS, and shortest path algorithms.',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now
      },
      { 
        title: 'SQL Queries', 
        class: insertedClasses[2]._id,
        teacher: teachers[2]._id,
        description: 'Write SQL queries to retrieve, insert, update, and delete data from a database.',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 3 weeks from now
      },
      { 
        title: 'Neural Networks', 
        class: insertedClasses[3]._id,
        teacher: teachers[0]._id,
        description: 'Implement a simple neural network using Python and TensorFlow.',
        dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000) // 4 weeks from now
      }
    ];
    
    // Insert assignments
    const insertedAssignments = [];
    for (const assignmentData of assignments) {
      const existingAssignment = await Assignment.findOne({ 
        title: assignmentData.title, 
        class: assignmentData.class 
      });
      if (existingAssignment) {
        insertedAssignments.push(existingAssignment);
      } else {
        const newAssignment = new Assignment(assignmentData);
        const savedAssignment = await newAssignment.save();
        insertedAssignments.push(savedAssignment);
        console.log(`Created assignment: ${savedAssignment.title}`);
      }
    }
    
    // Create sample grades
    const gradeTypes = ['assignment', 'exam', 'participation', 'project'];
    const gradeNames = ['Midterm Exam', 'Final Exam', 'Project Presentation', 'Lab Work'];
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const teacher = teachers[i % teachers.length];
      const classObj = insertedClasses[i % insertedClasses.length];
      const assignment = insertedAssignments[i % insertedAssignments.length];
      
      // Create 2-3 grades per student
      const numGrades = 2 + (i % 2);
      for (let j = 0; j < numGrades; j++) {
        const maxPoints = 100;
        const points = Math.floor(Math.random() * 40) + 60; // 60-99 points
        const percentage = Math.round((points / maxPoints) * 100);
        
        // Determine letter grade
        let letterGrade = 'F';
        if (percentage >= 90) letterGrade = 'A+';
        else if (percentage >= 85) letterGrade = 'A';
        else if (percentage >= 80) letterGrade = 'A-';
        else if (percentage >= 75) letterGrade = 'B+';
        else if (percentage >= 70) letterGrade = 'B';
        else if (percentage >= 65) letterGrade = 'B-';
        else if (percentage >= 60) letterGrade = 'C+';
        else if (percentage >= 55) letterGrade = 'C';
        else if (percentage >= 50) letterGrade = 'C-';
        else if (percentage >= 45) letterGrade = 'D+';
        else if (percentage >= 40) letterGrade = 'D';
        
        const gradeData = {
          student: student._id,
          class: classObj._id,
          assignment: assignment._id,
          type: gradeTypes[j % gradeTypes.length],
          name: gradeNames[j % gradeNames.length],
          points: points,
          maxPoints: maxPoints,
          percentage: percentage,
          letterGrade: letterGrade,
          gradedBy: teacher._id,
          notes: `Grade entry #${j+1} for ${student.name}`
        };
        
        const grade = new Grade(gradeData);
        await grade.save();
        console.log(`Created grade for ${student.name}: ${points}/${maxPoints} (${percentage}%)`);
      }
    }
    
    console.log('Sample grades populated successfully!');
    
    // Verify the data
    const gradeCount = await Grade.countDocuments();
    console.log(`Total grades in database: ${gradeCount}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error populating sample grades:', error);
    mongoose.connection.close();
  }
}

populateSampleGrades();