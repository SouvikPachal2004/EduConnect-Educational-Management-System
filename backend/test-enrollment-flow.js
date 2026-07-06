const mongoose = require('mongoose');
const User = require('./models/User');
const Class = require('./models/Class');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log('Testing enrollment flow...\n');

async function testEnrollmentFlow() {
  try {
    // Find a teacher
    const teacher = await User.findOne({ role: 'teacher', email: 'sudipta@gmail.com' });
    
    if (!teacher) {
      console.log('❌ Teacher not found');
      process.exit(1);
    }
    
    console.log(`\n👨‍🏫 Teacher: ${teacher.name}`);
    console.log(`   Department: ${teacher.department}`);
    console.log(`   Email: ${teacher.email}`);
    
    // Find students in the same department
    const { getDepartmentAliases, normalizeDepartmentName } = require('./utils/departmentCatalog');
    const canonical = normalizeDepartmentName(teacher.department) || teacher.department;
    const aliases = getDepartmentAliases(canonical);
    
    console.log(`\n🏛️ Department aliases:`, aliases);
    
    const students = await User.find({
      role: 'student',
      department: { $in: aliases },
      isActive: true,
    }).select('_id name email studentId department');
    
    console.log(`\n👥 Found ${students.length} students in department:`);
    students.slice(0, 5).forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name} (${s.studentId || 'No ID'}) - Department: ${s.department}`);
    });
    if (students.length > 5) {
      console.log(`   ... and ${students.length - 5} more students`);
    }
    
    // Find teacher's classes
    const classes = await Class.find({ teacher: teacher._id });
    console.log(`\n📚 Teacher's classes: ${classes.length}`);
    classes.forEach((cls, i) => {
      console.log(`   ${i + 1}. ${cls.name} (${cls.code}) - ${cls.students.length} students enrolled`);
    });
    
    console.log('\n✅ Test complete!');
    console.log(`\nIf you click "Enroll Students", it should enroll ${students.length} students.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testEnrollmentFlow();
