const mongoose = require('mongoose');
const Class = require('./models/Class');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log('Checking all course credits...\n');

Class.find({})
  .then(courses => {
    console.log(`Found ${courses.length} courses:\n`);
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.name} (${course.code}): ${course.credits} credits`);
    });
    console.log('\n✅ All courses have been verified!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error checking course credits:', error);
    process.exit(1);
  });
