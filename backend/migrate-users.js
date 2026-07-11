// Migrate users collection - handle duplicate studentId index
const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/educonnect';
const ATLAS_URI = 'mongodb+srv://Educonnect:Educonnet2026@cluster0.kxbbr5y.mongodb.net/educonnect?retryWrites=true&w=majority&appName=Cluster0';

async function migrateUsers() {
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();

    // Drop the old unique index on studentId in Atlas if it exists
    try {
        await atlasConn.db.collection('users').dropIndex('studentId_1');
        console.log('Dropped old unique studentId index in Atlas');
    } catch(e) {
        console.log('No studentId_1 index to drop (or already dropped)');
    }

    // Create the correct non-unique index
    await atlasConn.db.collection('users').createIndex({ studentId: 1 }, { sparse: true });
    console.log('Created non-unique studentId index');

    // Clear and re-insert all users
    const users = await localConn.db.collection('users').find({}).toArray();
    console.log(`Migrating ${users.length} users...`);
    
    await atlasConn.db.collection('users').deleteMany({});
    
    // Insert in batches to handle any remaining issues
    let success = 0, failed = 0;
    for (const user of users) {
        try {
            await atlasConn.db.collection('users').insertOne(user);
            success++;
        } catch(e) {
            failed++;
            console.log(`  Failed: ${user.name} (${user.email}) - ${e.message}`);
        }
    }
    
    console.log(`\nUsers migrated: ${success} success, ${failed} failed`);
    await localConn.close();
    await atlasConn.close();
}

migrateUsers().catch(console.error);
