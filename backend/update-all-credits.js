const mongoose = require('mongoose');
const Class = require('./models/Class');

mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected\n');
  
  // Update all classes with 3 credits to 8
  const classes = await Class.find({ credits: 3 });
  console.log(`Found ${classes.length} classes with 3 credits\n`);
  
  for (const cls of classes) {
    console.log(`Updating: ${cls.name} (${cls.code || 'N/A'})`);
    cls.credits = 8;
    await cls.save();
  }
  
  console.log(`\n✅ Updated ${classes.length} classes to 8 credits`);
  
  // Show final state
  console.log('\n=== All Classes (Final) ===');
  const all = await Class.find().select('name code credits').sort({ name: 1 });
  all.forEach(c => {
    console.log(`${c.name.padEnd(40)} (${(c.code || 'N/A').padEnd(15)}): ${c.credits} credits`);
  });
  
  await mongoose.connection.close();
  console.log('\n✅ Done! Refresh your browser (Ctrl+Shift+R for hard refresh)');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
