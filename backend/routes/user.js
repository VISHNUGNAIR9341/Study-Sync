const express = require('express');
const router = express.Router();
const db = require('../db');

// Get user profile (points, streak)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('API Fetching user:', userId);
        const result = await db.query('SELECT id, name, points, streak FROM users WHERE id = $1', [userId]);
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
