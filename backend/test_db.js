const db = require('./db');

async function test() {
    try {
        const userId = '123e4567-e89b-12d3-a456-426614174000';
        console.log('Testing database connection...');
        const res = await db.query('SELECT NOW()');
        console.log('Connected at:', res.rows[0].now);

        console.log('Querying user:', userId);
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        console.log('User found:', userRes.rows.length > 0);
        if (userRes.rows.length > 0) {
            console.log('User data:', userRes.rows[0]);
        } else {
            console.log('User NOT found.');
            // List all users
            const allUsers = await db.query('SELECT * FROM users');
            console.log('All users:', allUsers.rows);
        }
    } catch (err) {
        console.error('Database error:', err);
    }
}

test();
