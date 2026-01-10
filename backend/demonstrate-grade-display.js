const mongoose = require('mongoose');
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

// Demonstrate grade display with sample data
const demonstrateGradeDisplay = async () => {
  try {
    console.log('Demonstrating grade display functionality...\n');
    
    // Find students with grade data to show the display
    const studentsWithGrades = await User.find({ 
      role: 'student',
      grade: { $exists: true, $ne: null }
    }).limit(5);
    
    if (studentsWithGrades.length === 0) {
      console.log('No students with grade data found. Showing example of what would be displayed:\n');
      
      console.log('Sample Grade Section Display:');
      console.log('==========================');
      console.log('Student ID     | Name              | Email                   | CGPA | Actions');
      console.log('---------------|-------------------|-------------------------|------|--------');
      console.log('STU0001        | John Smith        | john@educonnect.com     | 8.5  | [Edit]');
      console.log('STU0002        | Jane Doe          | jane@educonnect.com     | 9.2  | [Edit]');
      console.log('STU0003        | Robert Johnson    | robert@educonnect.com   | 7.8  | [Edit]');
      console.log('STU0004        | Emily Wilson      | emily@educonnect.com    | N/A  | [Edit]');
      console.log('STU0005        | Michael Brown     | michael@educonnect.com  | 8.9  | [Edit]');
      
    } else {
      console.log(`Found ${studentsWithGrades.length} students with grade data:`);
      console.log('\nActual Grade Section Display:');
      console.log('============================');
      console.log('Student ID     | Name              | Email                   | CGPA | Actions');
      console.log('---------------|-------------------|-------------------------|------|--------');
      
      studentsWithGrades.forEach(student => {
        const studentId = student.studentId || 'N/A';
        const name = student.name || 'Unknown Student';
        const email = student.email || 'N/A';
        const cgpa = student.grade || 'N/A';
        
        // Format the output to align columns
        console.log(`${studentId.padEnd(15)}| ${name.padEnd(18)}| ${email.padEnd(24)}| ${cgpa.toString().padEnd(5)}| [Edit]`);
      });
    }
    
    console.log('\n✅ This is how the grade section will appear in the teacher dashboard');
    console.log('   - All students from the teacher\'s department are shown');
    console.log('   - Students with grade data show their CGPA');
    console.log('   - Students without grade data show "N/A"');
    console.log('   - Each student has an [Edit] button to modify their grade');
    
  } catch (error) {
    console.error(`Error demonstrating grade display: ${error.message}`);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Demonstrate grade display
    await demonstrateGradeDisplay();
    
    console.log('\n🎉 Grade display demonstration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();