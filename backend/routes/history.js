const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all task history for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query(
            'SELECT * FROM task_history WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get completed tasks for a user
router.get('/:userId/completed', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query(
            'SELECT * FROM task_history WHERE user_id = $1 AND status = $2 ORDER BY completed_at DESC',
            [userId, 'Completed']
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add task to history (called when task is completed)
router.post('/', async (req, res) => {
    try {
        const { user_id, task_id, title, category, priority, status, completed_at } = req.body;

        const result = await db.query(
            `INSERT INTO task_history (user_id, task_id, title, category, priority, status, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [user_id, task_id, title, category, priority, status, completed_at]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
