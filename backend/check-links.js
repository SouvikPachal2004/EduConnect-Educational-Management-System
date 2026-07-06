const mongoose = require('mongoose');
const Class = require('./models/Class');
mongoose.connect('mongodb://localhost:27017/educonnect').then(async () => {
    const classes = await Class.find({ mode: 'virtual' }).select('name meetingLink schedule');
    classes.forEach(c => console.log(c.name, '| date:', c.schedule?.scheduledDate || 'none', '| link:', c.meetingLink ? 'HAS LINK' : 'EMPTY'));
    mongoose.disconnect();
}).catch(e => console.log(e.message));
