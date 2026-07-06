// Clear stale meeting links — only keep links for currently ACTIVE meetings
const mongoose = require('mongoose');
const Class = require('./models/Class');
const Meeting = require('./models/Meeting');

mongoose.connect('mongodb://localhost:27017/educonnect').then(async () => {
    const classes = await Class.find({ meetingLink: { $ne: '' } });

    for (const cls of classes) {
        const match = cls.meetingLink.match(/room=([^&]+)/);
        if (!match) {
            await Class.findByIdAndUpdate(cls._id, { meetingLink: '' });
            console.log('Cleared (no room code):', cls.name);
            continue;
        }
        const roomCode = decodeURIComponent(match[1]);
        const meeting = await Meeting.findOne({ roomCode });
        if (!meeting || !meeting.isActive) {
            await Class.findByIdAndUpdate(cls._id, { meetingLink: '' });
            console.log('Cleared (ended/missing):', cls.name, '|', roomCode);
        } else {
            console.log('Kept active:', cls.name, '|', roomCode);
        }
    }
    console.log('Done.');
    mongoose.disconnect();
}).catch(e => console.log(e.message));
