// Fix: Replace global unique studentId index with per-program unique index
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/educonnect').then(async () => {
    const db = mongoose.connection.db;
    const col = db.collection('users');

    // Drop the old global unique index
    try {
        await col.dropIndex('studentId_1');
        console.log('Dropped old global studentId index');
    } catch (e) {
        console.log('Index not found or already dropped:', e.message);
    }

    // Create compound unique index: unique per program
    try {
        await col.createIndex(
            { program: 1, studentId: 1 },
            { unique: true, sparse: true, name: 'program_studentId_1' }
        );
        console.log('Created compound unique index: {program, studentId}');
    } catch (e) {
        console.log('Compound index error:', e.message);
    }

    // Verify
    const indexes = await col.indexes();
    indexes.forEach(i => console.log('Index:', JSON.stringify(i.key), '| unique:', i.unique));

    mongoose.disconnect();
}).catch(e => console.log(e.message));
