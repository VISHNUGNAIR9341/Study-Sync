const express = require('express');
const router = express.Router();
const db = require('../db');
const { spawn } = require('child_process');
const path = require('path');

const ML_SERVICE_PATH = path.join(__dirname, '../ml_service');

/**
 * Train ML model for a user based on their completed tasks
 * POST /ml/train/:userId
 */
router.post('/train/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get completed tasks from task_history
        const historyQuery = `
            SELECT 
                th.task_id,
                th.actual_time,
                t.category,
                t.estimated_size,
                t.complexity,
                t.num_pages,
                t.num_slides,
                t.num_questions,
                t.manual_time
            FROM task_history th
            JOIN tasks t ON th.task_id = t.id
            WHERE th.user_id = $1 
            AND th.completed_at IS NOT NULL
            AND (th.actual_time > 0 OR t.manual_time > 0)
            ORDER BY th.completed_at DESC
            LIMIT 50
        `;

        const result = await db.query(historyQuery, [userId]);
        const completed_tasks = result.rows;

        if (completed_tasks.length < 3) {
            return res.json({
                success: false,
                message: `Need at least 3 completed tasks to train. You have ${completed_tasks.length}.`,
                trained_on: 0
            });
        }

        // Call ML training script
        const pythonProcess = spawn('python', [path.join(ML_SERVICE_PATH, 'ml_trainer.py')]);

        let result_data = '';
        let error_data = '';

        // Send data to stdin
        pythonProcess.stdin.write(JSON.stringify({
            user_id: userId,
            completed_tasks: completed_tasks
        }));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
            result_data += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error_data += data.toString();
            console.log('[ML Training]', data.toString().trim());
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`ML training error: ${error_data}`);
                return res.status(500).json({
                    success: false,
                    error: error_data || 'Training failed'
                });
            }

            try {
                const training_result = JSON.parse(result_data);
                res.json(training_result);
            } catch (e) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to parse training result'
                });
            }
        });

    } catch (err) {
        console.error('ML training error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Get ML model status for a user
 * GET /ml/status/:userId
 */
router.get('/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if model file exists
        const fs = require('fs');
        const modelPath = path.join(ML_SERVICE_PATH, 'models', `user_${userId}_model.pkl`);

        const model_exists = fs.existsSync(modelPath);

        // Get count of completed tasks
        const countQuery = `
            SELECT COUNT(*) as count
            FROM task_history
            WHERE user_id = $1 
            AND completed_at IS NOT NULL
        `;
        const result = await db.query(countQuery, [userId]);
        const completed_count = parseInt(result.rows[0].count);

        res.json({
            model_exists,
            completed_tasks: completed_count,
            can_train: completed_count >= 3,
            needs_retraining: completed_count > 0 && !model_exists
        });
    } catch (err) {
        console.error('ML status error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
