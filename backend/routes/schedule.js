const express = require('express');
const router = express.Router();
const db = require('../db');
const mlClient = require('../ml_client');

router.post('/generate', async (req, res) => {
    try {
        const { userId } = req.body;

        // 1. Fetch User Routine
        const userRes = await db.query('SELECT routine_config FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const routine = userRes.rows[0].routine_config;

        // 2. Fetch Routine Blocks (for smart scheduling)
        const blocksRes = await db.query('SELECT * FROM routine_blocks WHERE user_id = $1', [userId]);
        const routine_blocks = blocksRes.rows.map(block => ({
            activity_type: block.activity_type,
            start_time: block.start_time,
            end_time: block.end_time
        }));

        // 3. Fetch Pending Tasks
        const tasksRes = await db.query("SELECT * FROM tasks WHERE user_id = $1 AND status = 'Pending'", [userId]);
        const tasks = tasksRes.rows.map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            estimated_size: t.estimated_size,
            predicted_time: t.manual_time || t.ml_predicted_time || t.default_expected_time,
            deadline: t.deadline,
            priority: t.priority,
            complexity: t.complexity || 'Medium',
            progress: t.progress || 0
        }));

        // 4. Fetch Completed Sessions for Today
        const todaySessionsRes = await db.query(
            `SELECT task_id, SUM(duration_minutes) as total_minutes 
             FROM sessions 
             WHERE user_id = $1 
             AND start_time >= CURRENT_DATE 
             GROUP BY task_id`,
            [userId]
        );

        const completed_today = {};
        todaySessionsRes.rows.forEach(row => {
            completed_today[row.task_id] = parseInt(row.total_minutes);
        });

        // 5. Call ML Service to Schedule (with routine_blocks and completed_today)
        console.log('Calling ML service with:', { userId, tasksCount: tasks.length, routineBlocksCount: routine_blocks.length, completedTodayCount: Object.keys(completed_today).length });
        const schedule = await mlClient.generateSchedule(userId, routine, tasks, routine_blocks, completed_today);
        console.log('ML Service returned schedule:', schedule);

        res.json(schedule);
    } catch (err) {
        console.error('Schedule generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
