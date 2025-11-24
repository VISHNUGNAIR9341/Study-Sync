const db = require('./db');

async function seed() {
    try {
        const FIXED_ID = '123e4567-e89b-12d3-a456-426614174000';
        // Check if default user exists
        const res = await db.query("SELECT * FROM users WHERE id = $1", [FIXED_ID]);
        if (res.rows.length === 0) {
            await db.query(
                "INSERT INTO users (id, name) VALUES ($1, 'Student')",
                [FIXED_ID]
            );
            console.log('Default user created:', FIXED_ID);
        } else {
            console.log('Default user already exists:', FIXED_ID);
        }
    } catch (err) {
        console.error('Error seeding database:', err);
    }
}

seed();
