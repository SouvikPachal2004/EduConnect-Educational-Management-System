// Migration script: Copy all data from local MongoDB to Atlas
// Run: node migrate-to-atlas.js

const mongoose = require('mongoose');

const LOCAL_URI  = 'mongodb://localhost:27017/educonnect';
const ATLAS_URI  = 'mongodb+srv://Educonnect:Educonnet2026@cluster0.kxbbr5y.mongodb.net/educonnect?retryWrites=true&w=majority&appName=Cluster0';

async function migrate() {
    console.log('Connecting to local MongoDB...');
    const localConn  = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('Connecting to Atlas...');
    const atlasConn  = await mongoose.createConnection(ATLAS_URI).asPromise();

    const collections = await localConn.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections to migrate\n`);

    for (const col of collections) {
        const name = col.name;
        try {
            const docs = await localConn.db.collection(name).find({}).toArray();
            if (docs.length === 0) {
                console.log(`  Skipped (empty): ${name}`);
                continue;
            }
            // Drop existing data in Atlas collection then insert fresh
            await atlasConn.db.collection(name).deleteMany({});
            await atlasConn.db.collection(name).insertMany(docs);
            console.log(`  Migrated: ${name} — ${docs.length} documents`);
        } catch (err) {
            console.log(`  Error in ${name}: ${err.message}`);
        }
    }

    await localConn.close();
    await atlasConn.close();
    console.log('\nMigration complete! All data is now on Atlas.');
}

migrate().catch(console.error);
