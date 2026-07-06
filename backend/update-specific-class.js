const mongoose = require('mongoose');
const Class = require('./models/Class');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected');
  
  // Update the specific Machine Learning class with code 6196A443
  const mlClass = await Class.findOne({ code: '6196A443' });
  
  if (mlClass) {
    console.log('\n=== Before Update ===');
    console.log('Name:', mlClass.name);
    console.log('Code:', mlClass.code);
    console.log('Credits:', mlClass.credits);
    
    // Update to 10 credits (maximum)
    mlClass.credits = 10;
    await mlClass.save();
    
    console.log('\n=== After Update ===');
    console.log('Credits:', mlClass.credits);
    console.log('✅ Updated successfully!');
  } else {
    console.log('Class with code 6196A443 not found');
  }
  
  // Also update ALL classes that still have 3 credits to 8 credits
  console.log('\n=== Updating all 3-credit classes to 8 ===');
  const result = await Class.updateMany(
    { credits: 3 },
    { $set: { credits: 8 } }
  );
  console.log(`✅ Updated ${result.modifiedCount} classes from 3 to 8 credits`);
  
  // Show all classes again
  console.log('\n=== All Classes (Updated) ===');
  const allClasses = await Class.find().select('name code credits').sort({ name: 1 });
  allClasses.forEach(cls => {
    console.log(`${cls.name.padEnd(40)} (${(cls.code || 'N/A').padEnd(15)}): ${cls.credits} credits`);
  });
  
  mongoose.connection.close();
  console.log('\n✅ All done! Refresh your browser now.');
  process.exit(0);
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
