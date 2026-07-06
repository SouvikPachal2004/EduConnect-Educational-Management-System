// End all meetings that are older than today and have no recent activity
const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');
const Class = require('./models/Class');

mongoose.connect('mongodb://localhost:27017/educonnect').then(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oldMeetings = await Meeting.find({ isActive: true });
    let ended = 0;

    for (const m of oldMeetings) {
        const meetingDay = new Date(m.createdAt);
        meetingDay.setHours(0, 0, 0, 0);

        // End if: meeting was created before today OR has a scheduledDate before today
        const isOld = meetingDay < today;
        const schedPast = m.scheduledDate && new Date(m.scheduledDate) < today;

        if (isOld || schedPast) {
            m.isActive = false;
            m.endedAt = new Date();
            await m.save();

            // Clear meeting link from class
            if (m.classId) {
                await Class.findByIdAndUpdate(m.classId, { meetingLink: '' });
            }
            console.log('Ended:', m.roomCode, m.scheduledDate || meetingDay.toDateString());
            ended++;
        }
    }

    console.log(`\nEnded ${ended} old meetings. Active meetings remaining:`);
    const remaining = await Meeting.find({ isActive: true }).select('roomCode title scheduledDate');
    remaining.forEach(m => console.log(' -', m.roomCode, m.scheduledDate || '(today)'));

    mongoose.disconnect();
}).catch(e => console.log(e.message));
