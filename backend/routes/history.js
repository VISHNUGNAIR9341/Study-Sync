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

// Delete task from history (using the history record ID)
router.delete('/:historyId', async (req, res) => {
    try {
        const { historyId } = req.params;

        // First get the task_id from the history record
        const historyResult = await db.query('SELECT task_id FROM task_history WHERE id = $1', [historyId]);

        if (historyResult.rows.length === 0) {
            return res.status(404).json({ error: 'History record not found' });
        }

        const taskId = historyResult.rows[0].task_id;

        // Delete from task_history table
        await db.query('DELETE FROM task_history WHERE id = $1', [historyId]);

        // Also try to delete the actual task if it still exists
        if (taskId) {
            await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        }

        res.json({ message: 'Task deleted from history' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
