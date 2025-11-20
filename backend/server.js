const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Smart Student Planner API is running');
});

const routineRoutes = require('./routes/routine');
const taskRoutes = require('./routes/tasks');
const scheduleRoutes = require('./routes/schedule');
const userRoutes = require('./routes/user');
const databaseRoutes = require('./routes/database');
const historyRoutes = require('./routes/history');

console.log('Registering user routes...');
app.use('/api/user', userRoutes);
app.use('/api/routine', routineRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/history', historyRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
