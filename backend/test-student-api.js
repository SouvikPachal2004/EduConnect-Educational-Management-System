const express = require('express');
const connectDB = require('./config/db');
const User = require('./models/User');
const Class = require('./models/Class');
const Assignment = require('./models/Assignment');
const Resource = require('./models/Resource');

// Connect to database
connectDB();

// Create sample data for testing
async function createTestData() {
  try {
    // Check if student already exists
    let student = await User.findOne({ email: 'anurag@student.com' });
    if (!student) {
      // Create a sample student
      student = new User({
        name: 'Anurag Ray',
        email: 'anurag@student.com',
        password: 'password123',
        role: 'student',
        department: 'Computer Science & Engineering',
        studentId: 'STU12345'
      });
      
      await student.save();
      console.log('Created student:', student.name);
    } else {
      console.log('Student already exists:', student.name);
    }
    
    // Check if teacher already exists
    let teacher = await User.findOne({ email: 'sudip@teacher.com' });
    if (!teacher) {
      // Create a sample teacher
      teacher = new User({
        name: 'Prof. Sudip Mondal',
        email: 'sudip@teacher.com',
        password: 'password123',
        role: 'teacher',
        department: 'Computer Science & Engineering',
        teacherId: 'TEA12345'
      });
      
      await teacher.save();
      console.log('Created teacher:', teacher.name);
    } else {
      console.log('Teacher already exists:', teacher.name);
    }
    
    // Check if class already exists
    let classItem = await Class.findOne({ name: 'Data Structures' });
    if (!classItem) {
      // Create a sample class
      classItem = new Class({
        name: 'Data Structures',
        description: 'Fundamental concepts of data structures',
        teacher: teacher._id,
        students: [student._id],
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          startTime: '09:00',
          endTime: '10:00',
          location: 'Room 205'
        }
      });
      
      await classItem.save();
      console.log('Created class:', classItem.name);
    } else {
      console.log('Class already exists:', classItem.name);
      // Add student to class if not already added
      if (!classItem.students.includes(student._id)) {
        classItem.students.push(student._id);
        await classItem.save();
        console.log('Added student to class');
      }
    }
    
    // Check if assignment already exists
    let assignment = await Assignment.findOne({ title: 'Data Structures Implementation' });
    if (!assignment) {
      // Create a sample assignment
      assignment = new Assignment({
        title: 'Data Structures Implementation',
        description: 'Implement various data structures including arrays, linked lists, stacks, and queues',
        class: classItem._id,
        teacher: teacher._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 1 week
        maxPoints: 100
      });
      
      await assignment.save();
      console.log('Created assignment:', assignment.title);
    } else {
      console.log('Assignment already exists:', assignment.title);
    }
    
    // Check if resource already exists
    let resource = await Resource.findOne({ title: 'Data Structures Textbook' });
    if (!resource) {
      // Create a sample resource
      resource = new Resource({
        title: 'Data Structures Textbook',
        description: 'Complete textbook for Data Structures course',
        class: classItem._id,
        teacher: teacher._id,
        fileType: 'document', // Valid enum value
        fileUrl: '/resources/ds-textbook.pdf',
        isPublic: true
      });
      
      await resource.save();
      console.log('Created resource:', resource.title);
    } else {
      console.log('Resource already exists:', resource.title);
    }
    
    console.log('Test data creation/check completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

// Run the test data creation
createTestData();