const mongoose = require('mongoose');
const ActivityLog = require('./models/ActivityLog');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log('Checking activity logs in database...');

ActivityLog.find({})
  .sort({ timestamp: -1 })
  .limit(10)
  .then(logs => {
    console.log(`Found ${logs.length} activity logs:`);
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.timestamp} - ${log.userName} - ${log.actionLabel} - ${log.description}`);
    });
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fetching activity logs:', error);
    process.exit(1);
  });