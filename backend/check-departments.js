const mongoose = require('mongoose');
const Department = require('./models/Department');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log('Checking departments in database...');

Department.find({ isActive: true })
  .sort({ name: 1 })
  .then(departments => {
    console.log(`Found ${departments.length} active departments:`);
    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} - HOD: ${dept.hod || 'Not assigned'}`);
    });
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fetching departments:', error);
    process.exit(1);
  });