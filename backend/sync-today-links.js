// Sync today's active meeting links to their classes
const mongoose = require('mongoose');
const Class = require('./models/Class');
const Meeting = require('./models/Meeting');

mongoose.connect('mongodb://localhost:27017/educonnect').then(async () => {
    const today = new Date().toISOString().split('T')[0];
    // Find all meetings created today that are active
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const meetings = await Meeting.find({
        isActive: true,
        classId: { $ne: null },
        createdAt: { $gte: todayStart }
    });

    for (const m of meetings) {
        const cls = await Class.findById(m.classId);
        if (cls) {
            await Class.findByIdAndUpdate(m.classId, { meetingLink: m.meetingLink });
            console.log('Synced:', cls.name, '->', m.roomCode);
        }
    }
    console.log('Done. Total synced:', meetings.length);
    mongoose.disconnect();
}).catch(e => console.log(e.message));
