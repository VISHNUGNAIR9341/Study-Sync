const express = require('express');
const router = express.Router();
const db = require('../db');

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { student_id, password, name } = req.body;
        if (!student_id || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await db.query('SELECT * FROM users WHERE student_id = $1', [student_id]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Insert new user
        const result = await db.query(
            'INSERT INTO users (student_id, password, name) VALUES ($1, $2, $3) RETURNING id, name, student_id',
            [student_id, password, name]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { student_id, password } = req.body;
        if (!student_id || !password) {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        const result = await db.query('SELECT * FROM users WHERE student_id = $1', [student_id]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Simple password check (In production, use bcrypt)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            id: user.id,
            name: user.name,
            student_id: user.student_id,
            points: user.points,
            streak: user.streak
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user profile (points, streak)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('API Fetching user:', userId);
        const result = await db.query('SELECT id, name, points, streak, student_id FROM users WHERE id = $1', [userId]);
        console.log('API User found rows:', result.rows.length);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
