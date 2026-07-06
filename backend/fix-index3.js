// Create a non-unique index on studentId (remove uniqueness constraint)
// Uniqueness per program will be enforced in application code
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/educonnect').then(async () => {
    const col = mongoose.connection.db.collection('users');

    // Create non-unique index on studentId (just for query performance)
    await col.createIndex({ studentId: 1 }, { sparse: true, name: 'studentId_1' });
    console.log('Created non-unique studentId index');

    const indexes = await col.indexes();
    indexes.forEach(i => console.log(JSON.stringify(i.key), '| unique:', i.unique || false));
    mongoose.disconnect();
}).catch(e => console.log(e.message));
