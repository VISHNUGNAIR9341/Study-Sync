const db = require('./db');

async function migrate() {
    try {
        console.log('Starting migration: Adding manual_time to tasks table...');

        // Add manual_time column
        await db.query(`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS manual_time INT;
        `);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
