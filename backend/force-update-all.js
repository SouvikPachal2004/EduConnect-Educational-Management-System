const mongoose = require('mongoose');
const Class = require('./models/Class');

mongoose.connect('mongodb://localhost:27017/educonnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected\n');
  
  // Get ALL classes
  const all = await Class.find();
  console.log(`Total classes: ${all.length}\n`);
  
  let updated = 0;
  for (const cls of all) {
    const oldCredits = cls.credits;
    // Update any class with credits < 8 to 8 (except those already 10)
    if (cls.credits < 8) {
      cls.credits = 8;
      await cls.save();
      console.log(`Updated: ${cls.name} (${cls.code || 'N/A'}): ${oldCredits} → 8`);
      updated++;
    }
  }
  
  console.log(`\n✅ Updated ${updated} classes`);
  
  // Show final state
  console.log('\n=== All Classes (Final) ===');
  const final = await Class.find().select('name code credits').sort({ name: 1 });
  final.forEach(c => {
    const emoji = c.credits >= 8 ? '✅' : '⚠️';
    console.log(`${emoji} ${c.name.padEnd(40)} (${(c.code || 'N/A').padEnd(15)}): ${c.credits} credits`);
  });
  
  await mongoose.connection.close();
  console.log('\n✅ Done! Now refresh your browser with Ctrl+Shift+R');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
