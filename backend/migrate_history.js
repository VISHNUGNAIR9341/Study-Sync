const db = require('./db');

async function migrate() {
    try {
        console.log('Adding actual_time column to task_history...');
        await db.query(`
            ALTER TABLE task_history 
            ADD COLUMN IF NOT EXISTS actual_time INT;
        `);
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
