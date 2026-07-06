const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/educonnect').then(async () => {
    const col = mongoose.connection.db.collection('users');
    try {
        await col.createIndex(
            { program: 1, studentId: 1 },
            {
                unique: true,
                partialFilterExpression: {
                    program: { $exists: true, $ne: null },
                    studentId: { $exists: true, $ne: null }
                },
                name: 'program_studentId_unique'
            }
        );
        console.log('Created compound partial unique index');
    } catch(e) {
        console.log('Error:', e.message);
    }
    const indexes = await col.indexes();
    indexes.forEach(i => console.log(JSON.stringify(i.key), 'unique:', i.unique));
    mongoose.disconnect();
}).catch(e => console.log(e.message));
