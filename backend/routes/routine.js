const express = require('express');
const router = express.Router();
const db = require('../db');

// Get user routine configuration
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query('SELECT routine_config FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0].routine_config || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user routine configuration
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { routine_config } = req.body;

        const result = await db.query(
            'UPDATE users SET routine_config = $1 WHERE id = $2 RETURNING routine_config',
            [routine_config, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0].routine_config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== ROUTINE BLOCKS API =====

// Get all routine blocks for a user
router.get('/blocks/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query(
            'SELECT * FROM routine_blocks WHERE user_id = $1 ORDER BY start_time ASC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new routine block
router.post('/blocks', async (req, res) => {
    try {
        const { user_id, activity_type, start_time, end_time } = req.body;

        const result = await db.query(
            `INSERT INTO routine_blocks (user_id, activity_type, start_time, end_time)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, activity_type, start_time, end_time]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a routine block
router.put('/blocks/:blockId', async (req, res) => {
    try {
        const { blockId } = req.params;
        const { activity_type, start_time, end_time } = req.body;

        const result = await db.query(
            `UPDATE routine_blocks 
             SET activity_type = $1, start_time = $2, end_time = $3
             WHERE id = $4 RETURNING *`,
            [activity_type, start_time, end_time, blockId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Routine block not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a routine block
router.delete('/blocks/:blockId', async (req, res) => {
    try {
        const { blockId } = req.params;

        const result = await db.query(
            'DELETE FROM routine_blocks WHERE id = $1 RETURNING *',
            [blockId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Routine block not found' });
        }

        res.json({ message: 'Routine block deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
