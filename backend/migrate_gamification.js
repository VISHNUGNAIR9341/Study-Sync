const db = require('./db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Add points column
        try {
            await db.query('ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0');
            console.log('Added points column.');
        } catch (err) {
            if (err.code === '42701') console.log('points column already exists.');
            else console.error('Error adding points:', err.message);
        }

        // Add streak column
        try {
            await db.query('ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0');
            console.log('Added streak column.');
        } catch (err) {
            if (err.code === '42701') console.log('streak column already exists.');
            else console.error('Error adding streak:', err.message);
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
