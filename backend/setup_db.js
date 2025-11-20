const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
};

async function setupDatabase() {
    console.log('Starting Database Setup...');

    // 1. Connect to default 'postgres' database to create our DB
    const client = new Client({ ...DB_CONFIG, database: 'postgres' });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL server.');

        // 2. Create database if not exists
        const dbName = process.env.DB_NAME || 'student_planner';
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);

        if (res.rows.length === 0) {
            console.log(`Creating database '${dbName}'...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log('Database created.');
        } else {
            console.log(`Database '${dbName}' already exists.`);
        }

        await client.end();

        // 3. Connect to the new database
        const dbClient = new Client({ ...DB_CONFIG, database: dbName });
        await dbClient.connect();
        console.log(`Connected to '${dbName}'.`);

        // 4. Run Schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('Running schema...');
        await dbClient.query(schemaSql);
        console.log('Schema applied.');

        // 5. Seed Data
        console.log('Seeding initial data...');
        // We can just import the seed function or run the query here
        // Let's just run the seed logic here to be self-contained or call the file
        const seedPath = path.join(__dirname, 'seed.js');
        if (fs.existsSync(seedPath)) {
            // We can't easily require it if it runs immediately, so let's just replicate the seed logic or run it via child_process
            // Or better, just run the seed SQL directly if possible.
            // The seed.js uses the db module which uses the pool.
            // Let's just run the seed logic manually here.

            const FIXED_ID = '123e4567-e89b-12d3-a456-426614174000';
            const userRes = await dbClient.query("SELECT * FROM users WHERE id = $1", [FIXED_ID]);
            if (userRes.rows.length === 0) {
                await dbClient.query(
                    "INSERT INTO users (id, name) VALUES ($1, 'Student')",
                    [FIXED_ID]
                );
                console.log('Default user created.');
            } else {
                console.log('Default user already exists.');
            }
        }

        await dbClient.end();
        console.log('Database setup complete!');

    } catch (err) {
        console.error('Error setting up database:', err);
        console.log('\nPossible fixes:');
        console.log('1. Make sure PostgreSQL is installed and running.');
        console.log('2. Check your .env file or default credentials (user: postgres, pass: postgres).');
        console.log('3. If you don\'t have PostgreSQL, please install it from https://www.postgresql.org/download/');
    }
}

setupDatabase();
