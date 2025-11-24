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

// Add basic global error handlers to capture why the process might terminate.
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
    // keep process alive briefly to flush logs, then exit with failure
    setTimeout(() => process.exit(1), 100);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    setTimeout(() => process.exit(1), 100);
});

// If the PG pool emits an error it can crash the app; listen on process warnings.
process.on('warning', (warning) => {
    console.warn('Process warning:', warning && warning.stack ? warning.stack : warning);
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.on('close', () => {
    console.log('Server closed!');
});

// Force keep-alive to debug why process is exiting
setInterval(() => {
    // console.log('Heartbeat - Process is still alive');
}, 10000);

console.log('Server setup complete. Awaiting connections...');
