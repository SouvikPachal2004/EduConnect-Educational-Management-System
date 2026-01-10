const mongoose = require('mongoose');
const Class = require('./models/Class');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Test the query
async function testQuery() {
  try {
    console.log('Testing class query...');
    
    // Try different ways to find the class
    const classId = '693a5a6758e6c949c28f86e1';
    
    console.log('Trying Class.findOne({ _id: classId })');
    const result1 = await Class.findOne({ _id: classId });
    console.log('Result 1:', result1);
    
    console.log('Trying Class.findById(classId)');
    const result2 = await Class.findById(classId);
    console.log('Result 2:', result2);
    
    console.log('Trying direct MongoDB query');
    const db = mongoose.connection.db;
    const result3 = await db.collection('classes').findOne({ _id: classId });
    console.log('Result 3:', result3);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testQuery();