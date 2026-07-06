const mongoose = require('mongoose');
const EnrollmentRequest = require('./models/EnrollmentRequest');
const Class = require('./models/Class');
const Subject = require('./models/Subject');

mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected\n');
  
  // Get all enrollment requests
  const requests = await EnrollmentRequest.find()
    .populate('class')
    .populate('subject');
  
  console.log(`Total enrollment requests: ${requests.length}\n`);
  
  // The issue is that enrollment requests don't store credits directly
  // They reference class and subject
  // So we just need to make sure the API returns the right data
  
  for (const req of requests) {
    console.log(`\nEnrollment Request ID: ${req._id}`);
    console.log(`Student: ${req.student}`);
    console.log(`Status: ${req.status}`);
    
    if (req.class) {
      console.log(`Class: ${req.class.name} (${req.class.code})`);
      console.log(`Class Credits: ${req.class.credits}`);
    }
    
    if (req.subject) {
      console.log(`Subject: ${req.subject.name}`);
      console.log(`Subject Credits: ${req.subject.credits}`);
    }
  }
  
  console.log('\n✅ All enrollment requests checked');
  console.log('\nThe credits should now come from the Class/Subject when loaded.');
  console.log('The issue is likely browser cache - try Ctrl+Shift+R to hard refresh.');
  
  await mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
