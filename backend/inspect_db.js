const db = require('./db');

async function inspect() {
    try {
        const tables = ['users', 'tasks', 'sessions', 'routine_blocks', 'task_history'];

        for (const table of tables) {
            console.log(`\n--- Table: ${table} ---`);
            const res = await db.query(`SELECT * FROM ${table}`);
            console.log(`Count: ${res.rows.length}`);
            if (res.rows.length > 0) {
                console.log('Data:', JSON.stringify(res.rows, null, 2));
            } else {
                console.log('No data.');
            }
        }
    } catch (err) {
        console.error('Error inspecting database:', err);
    } finally {
        // We need to close the pool, but db.js doesn't export the pool or an end method.
        // However, the script will exit anyway.
        process.exit(0);
    }
}

inspect();
