const db = require('./db');

async function migrate() {
    try {
        console.log('Starting migration: Adding new task features...');

        // Add complexity column
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='complexity') THEN 
                    ALTER TABLE tasks ADD COLUMN complexity TEXT CHECK (complexity IN ('Low', 'Medium', 'High'));
                END IF;
            END $$;
        `);

        // Add num_pages column
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='num_pages') THEN 
                    ALTER TABLE tasks ADD COLUMN num_pages INT;
                END IF;
            END $$;
        `);

        // Add num_slides column
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='num_slides') THEN 
                    ALTER TABLE tasks ADD COLUMN num_slides INT;
                END IF;
            END $$;
        `);

        // Add num_questions column
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='num_questions') THEN 
                    ALTER TABLE tasks ADD COLUMN num_questions INT;
                END IF;
            END $$;
        `);

        // Add progress column
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='progress') THEN 
                    ALTER TABLE tasks ADD COLUMN progress INT DEFAULT 0;
                END IF;
            END $$;
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
