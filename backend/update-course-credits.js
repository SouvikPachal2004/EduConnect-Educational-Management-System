const mongoose = require('mongoose');
const Class = require('./models/Class');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log('Updating all course credits to 10...');

Class.updateMany(
  {}, // Update all classes
  { $set: { credits: 10 } }
)
  .then(result => {
    console.log(`Successfully updated ${result.modifiedCount} courses`);
    console.log('All courses now have 10 credits');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error updating course credits:', error);
    process.exit(1);
  });
