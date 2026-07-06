const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/educonnect').then(async () => {
    const User = require('./models/User');
    const allStudents = await User.find({ role: 'student' }).select('studentId name department program').lean();
    const taken = new Set();
    allStudents.forEach(s => {
        if (s.studentId) {
            const num = parseInt(String(s.studentId).replace(/\D/g, ''), 10);
            if (!isNaN(num)) taken.add(num);
        }
    });
    console.log('Total students:', allStudents.length);
    console.log('Taken rolls:', [...taken].sort((a,b)=>a-b).slice(0,20).join(', '), '...');
    let next = 1;
    while (taken.has(next)) next++;
    console.log('Next available roll:', next);
    mongoose.disconnect();
}).catch(e => console.log(e.message));
