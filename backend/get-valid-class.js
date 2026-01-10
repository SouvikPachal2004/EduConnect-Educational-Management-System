const mongoose = require('mongoose');
const User = require('./models/User');
const Class = require('./models/Class');

mongoose.connect('mongodb://localhost:27017/educonnect')
  .then(async () => {
    const teacher = await User.findOne({email: 'teacher@educonnect.com'});
    console.log('Teacher found:', teacher.email);
    
    const classObj = await Class.findOne({teacher: teacher._id});
    console.log('Valid class ID:', classObj._id);
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });