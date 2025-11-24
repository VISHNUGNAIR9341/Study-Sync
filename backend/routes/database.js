const express = require('express');
const router = express.Router();
const db = require('../db');

// Get list of all tables
router.get('/tables', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get table schema (columns, types, constraints)
router.get('/tables/:tableName/schema', async (req, res) => {
    try {
        const { tableName } = req.params;

        // Validate table name to prevent SQL injection
        const validTables = ['users', 'tasks', 'task_history', 'sessions', 'routine_blocks'];
        if (!validTables.includes(tableName)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        const result = await db.query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
        `, [tableName]);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get table data (paginated, read-only)
router.get('/tables/:tableName/data', async (req, res) => {
    try {
        const { tableName } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 rows
        const offset = parseInt(req.query.offset) || 0;

        // Validate table name to prevent SQL injection
        const validTables = ['users', 'tasks', 'task_history', 'sessions', 'routine_blocks'];
        if (!validTables.includes(tableName)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        // Get total count
        const countResult = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
        const totalRows = parseInt(countResult.rows[0].count);

        // Get data
        const dataResult = await db.query(
            `SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            data: dataResult.rows,
            total: totalRows,
            limit,
            offset
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get row count for a table
router.get('/tables/:tableName/count', async (req, res) => {
    try {
        const { tableName } = req.params;

        // Validate table name
        const validTables = ['users', 'tasks', 'task_history', 'sessions', 'routine_blocks'];
        if (!validTables.includes(tableName)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        const result = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
