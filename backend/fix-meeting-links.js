// One-time script to sync active meeting links back to their class records
const mongoose = require('mongoose');
const Class = require('./models/Class');
const Meeting = require('./models/Meeting');

mongoose.connect('mongodb://localhost:27017/educonnect').then(async () => {
    const meetings = await Meeting.find({ isActive: true })
        .sort({ createdAt: -1 });

    for (const m of meetings) {
        if (!m.meetingLink || !m.classId) continue;
        const cls = await Class.findById(m.classId);
        if (cls) {
            await Class.findByIdAndUpdate(m.classId, { meetingLink: m.meetingLink });
            console.log('Linked:', cls.name, '->', m.roomCode);
        }
    }
    console.log('Done. Restart server for changes to take effect.');
    mongoose.disconnect();
}).catch(e => console.log(e.message));
