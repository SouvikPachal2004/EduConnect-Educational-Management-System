const mongoose = require('mongoose');

async function addAttendanceData() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/educonnect', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Connect to MongoDB directly to access the attendances collection
    const db = mongoose.connection.db;
    
    // Clear existing attendance data
    await db.collection('attendances').deleteMany({});
    
    // Add test attendance data
    const attendanceData = [
      {
        student_id: '693d90c0cb24a9f8f2f97714', // Test Student 1
        student_name: 'Test Student 1',
        department: 'CSE',
        attendance: 65 // Lower attendance
      },
      {
        student_id: '693d90c8cb24a9f8f2f97717', // Test Student 2
        student_name: 'Test Student 2',
        department: 'CSE',
        attendance: 95 // High attendance
      }
    ];
    
    // Insert attendance data
    for (const data of attendanceData) {
      await db.collection('attendances').insertOne(data);
      console.log(`Added attendance record for ${data.student_name}`);
    }
    
    console.log('Attendance data added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding attendance data:', error);
    process.exit(1);
  }
}

addAttendanceData();