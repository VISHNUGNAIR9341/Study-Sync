const { Client } = require('pg');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'student_planner',
};

async function migrateRoutineBlocks() {
    console.log('Starting routine_blocks table migration...');

    const client = new Client(DB_CONFIG);

    try {
        await client.connect();
        console.log('Connected to database.');

        // Create routine_blocks table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS routine_blocks (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                activity_type VARCHAR(50) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await client.query(createTableQuery);
        console.log('routine_blocks table created successfully.');

        // Create index for faster queries
        await client.query('CREATE INDEX IF NOT EXISTS idx_routine_blocks_user_id ON routine_blocks(user_id);');
        console.log('Index created on user_id.');

        await client.end();
        console.log('Migration complete!');

    } catch (err) {
        console.error('Error during migration:', err);
        console.log('\nPossible fixes:');
        console.log('1. Make sure PostgreSQL is running.');
        console.log('2. Check your database credentials.');
    }
}

migrateRoutineBlocks();
