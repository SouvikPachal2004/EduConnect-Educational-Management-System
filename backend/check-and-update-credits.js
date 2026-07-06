const mongoose = require('mongoose');
const Class = require('./models/Class');
const Subject = require('./models/Subject');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected');
  
  // Check Machine Learning class
  const mlClass = await Class.findOne({ name: /Machine Learning/i });
  if (mlClass) {
    console.log('\n=== Machine Learning Class ===');
    console.log('Name:', mlClass.name);
    console.log('Code:', mlClass.code);
    console.log('Credits:', mlClass.credits);
    console.log('Subject ID:', mlClass.subject);
    
    // If it has a subject, check subject credits
    if (mlClass.subject) {
      const subject = await Subject.findById(mlClass.subject);
      if (subject) {
        console.log('\n=== Related Subject ===');
        console.log('Subject Name:', subject.name);
        console.log('Subject Credits:', subject.credits);
      }
    }
    
    // Update to 8 credits (or any value you want, max 10)
    console.log('\n=== Updating Credits ===');
    mlClass.credits = 8; // Change this to whatever you want (max 10)
    await mlClass.save();
    console.log('✅ Updated Machine Learning class credits to:', mlClass.credits);
  } else {
    console.log('Machine Learning class not found');
  }
  
  // List all classes and their credits
  console.log('\n=== All Classes ===');
  const allClasses = await Class.find().select('name code credits');
  allClasses.forEach(cls => {
    console.log(`${cls.name} (${cls.code || 'N/A'}): ${cls.credits} credits`);
  });
  
  mongoose.connection.close();
  console.log('\n✅ Done!');
  process.exit(0);
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
