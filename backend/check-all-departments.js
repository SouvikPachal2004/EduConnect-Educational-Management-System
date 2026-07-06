const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  try {
    console.log('📊 FULL STUDENT COUNT BY DEPARTMENT:\n');

    const departments = ['CSE', 'CSE(AI)', 'CSE(DS)', 'CSE-AIML', 'IT'];
    let totalCount = 0;

    for (const dept of departments) {
      const count = await User.countDocuments({ role: 'student', department: dept });
      console.log(`${dept}: ${count} students`);
      totalCount += count;
    }

    console.log(`\n📌 TOTAL: ${totalCount} students`);
    console.log(`⚠️  Expected: 76 students`);
    console.log(`❌ Missing: ${76 - totalCount} students`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
});
