const express = require('express');
const router = express.Router();
const db = require('../db');
const mlClient = require('../ml_client');

// Get single task details
router.get('/details/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const result = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all tasks for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY deadline ASC', [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new task
router.post('/', async (req, res) => {
    try {
        let { user_id, title, category, estimated_size, default_expected_time, priority, deadline, complexity, num_pages, num_slides, num_questions } = req.body;

        if (!deadline) {
            return res.status(400).json({ error: 'Deadline is required' });
        }

        console.log('Creating task:', { user_id, title, category, estimated_size, default_expected_time, priority, deadline, complexity });

        // Call ML service to get predicted time (with fallback)
        let ml_predicted_time = default_expected_time;
        try {
            // Pass the new features to the prediction service
            const predicted = await mlClient.predictTime(category, estimated_size, user_id, {
                complexity,
                num_pages,
                num_slides,
                num_questions
            });
            if (predicted) {
                ml_predicted_time = predicted;
            }
        } catch (mlError) {
            console.error('ML prediction failed, using default time:', mlError.message);
        }

        console.log('Inserting task with ml_predicted_time:', ml_predicted_time);
        const result = await db.query(
            `INSERT INTO tasks (user_id, title, category, estimated_size, default_expected_time, ml_predicted_time, priority, deadline, complexity, num_pages, num_slides, num_questions, manual_time)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [user_id, title, category, estimated_size, default_expected_time, ml_predicted_time, priority, deadline, complexity, num_pages, num_slides, num_questions, req.body.manual_time || null]
        );
        console.log('Task created successfully:', result.rows[0].id);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Task creation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update task status
router.put('/:taskId/status', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        const result = await db.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Award points if completed
        if (status === 'Completed') {
            const task = result.rows[0];
            const points = 10; // Fixed points for now
            await db.query('UPDATE users SET points = points + $1 WHERE id = $2', [points, task.user_id]);

            // Add to task history
            const actualTime = req.body.actual_time || null;
            await db.query(
                `INSERT INTO task_history (user_id, task_id, title, category, priority, status, actual_time, completed_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [task.user_id, task.id, task.title, task.category, task.priority, 'Completed', actualTime]
            );
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update task progress
router.put('/:taskId/progress', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { progress } = req.body;

        const result = await db.query(
            'UPDATE tasks SET progress = $1 WHERE id = $2 RETURNING *',
            [progress, taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete task
router.delete('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const result = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [taskId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
