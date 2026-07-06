// Assign B.Tech program to all students that have no program set
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/educonnect').then(async () => {
    const BTECH_ID = '6a2bbbee3ebb3b2a7c94c6dd';
    
    const result = await User.updateMany(
        { role: 'student', program: null },
        { $set: { program: new mongoose.Types.ObjectId(BTECH_ID) } }
    );
    
    console.log('Updated', result.modifiedCount, 'students to B.Tech program');
    
    // Verify
    const btech = await User.countDocuments({ role: 'student', program: new mongoose.Types.ObjectId(BTECH_ID) });
    const noProgram = await User.countDocuments({ role: 'student', program: null });
    console.log('B.Tech students now:', btech, '| No program:', noProgram);
    
    // Check max roll for B.Tech
    const students = await User.find({ role: 'student', program: new mongoose.Types.ObjectId(BTECH_ID) }).select('studentId').lean();
    const maxRoll = Math.max(...students.map(s => parseInt(String(s.studentId).replace(/\D/g,''),10)).filter(n=>!isNaN(n)));
    console.log('Max B.Tech roll:', maxRoll, '-> Next roll will be:', maxRoll + 1);
    
    mongoose.disconnect();
}).catch(e => console.log(e.message));
