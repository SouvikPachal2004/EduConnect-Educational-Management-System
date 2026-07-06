const mongoose = require('mongoose');
const Class = require('./models/Class');
const EnrollmentRequest = require('./models/EnrollmentRequest');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log('Checking class enrollment data...\n');

async function checkEnrollment() {
  try {
    const classes = await Class.find({}).limit(5);
    
    console.log(`Checking first ${classes.length} classes:\n`);
    
    for (const cls of classes) {
      console.log(`\n📚 Class: ${cls.name} (${cls.code})`);
      console.log(`   Students in class.students array: ${cls.students.length}`);
      
      // Get enrollment requests
      const enrollmentReqs = await EnrollmentRequest.find({ class: cls._id });
      const accepted = enrollmentReqs.filter(r => r.status === 'accepted').length;
      const pending = enrollmentReqs.filter(r => r.status === 'pending').length;
      
      console.log(`   Enrollment requests (accepted): ${accepted}`);
      console.log(`   Enrollment requests (pending): ${pending}`);
      console.log(`   Enrollment requests (total): ${enrollmentReqs.length}`);
    }
    
    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEnrollment();
