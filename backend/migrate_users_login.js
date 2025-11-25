const db = require('./db');

async function migrate() {
    try {
        console.log('Starting user login migration...');

        // Add student_id column
        try {
            await db.query('ALTER TABLE users ADD COLUMN student_id TEXT UNIQUE');
            console.log('Added student_id column.');
        } catch (err) {
            if (err.code === '42701') console.log('student_id column already exists.');
            else console.error('Error adding student_id:', err.message);
        }

        // Add password column
        try {
            await db.query('ALTER TABLE users ADD COLUMN password TEXT');
            console.log('Added password column.');
        } catch (err) {
            if (err.code === '42701') console.log('password column already exists.');
            else console.error('Error adding password:', err.message);
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
