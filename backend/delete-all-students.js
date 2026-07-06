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
    console.log('🗑️  Deleting all student records...\n');

    const result = await User.deleteMany({ role: 'student' });
    
    console.log(`✅ Deleted ${result.deletedCount} student records`);
    console.log('Ready to reimport with new credentials');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
});
