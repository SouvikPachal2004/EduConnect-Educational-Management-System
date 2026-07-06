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
    console.log('📋 Current HOD Departments in Database:\n');

    const hods = await User.find({ role: 'hod' })
      .select('name email department')
      .sort({ name: 1 });

    hods.forEach(hod => {
      console.log(`Name: ${hod.name}`);
      console.log(`Email: ${hod.email}`);
      console.log(`Department: "${hod.department}"`);
      console.log('---');
    });

    console.log(`\nTotal HODs: ${hods.length}`);
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
});
