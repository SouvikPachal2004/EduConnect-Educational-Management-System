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
    console.log('🗑️  Cleaning up and recreating indexes...\n');

    // Delete all students
    await User.deleteMany({ role: 'student' });
    console.log('✅ Deleted all student records');

    // Drop email index to allow reimport
    try {
      await User.collection.dropIndex('email_1');
      console.log('✅ Dropped email index');
    } catch (e) {
      console.log('ℹ️  Email index already dropped or doesn\'t exist');
    }

    // Recreate email index (will be created automatically on next insert)
    console.log('✅ Index will be recreated automatically');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
  }
});
