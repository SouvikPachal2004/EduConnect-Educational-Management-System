/**
 * One-time script to sync credits from Subject to linked Class documents.
 * Run: node sync-class-credits.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect';

async function syncCredits() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const Subject = require('./models/Subject');
    const Class = require('./models/Class');

    const subjects = await Subject.find({ classId: { $ne: null } }).populate('classId');
    
    let updated = 0;
    for (const sub of subjects) {
        if (!sub.classId) continue;
        
        const cls = await Class.findById(sub.classId._id || sub.classId);
        if (!cls) continue;
        
        if (cls.credits !== sub.credits) {
            console.log(`Updating "${cls.name}" credits: ${cls.credits} → ${sub.credits}`);
            cls.credits = sub.credits;
            await cls.save();
            updated++;
        }
    }

    console.log(`\n✅ Done! Updated ${updated} class(es) with correct credits from subjects.`);
    await mongoose.disconnect();
}

syncCredits().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
