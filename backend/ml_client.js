const { spawn } = require('child_process');
const path = require('path');

const ML_SERVICE_PATH = path.join(__dirname, '../ml_service');

function runPythonScript(scriptName, data) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [path.join(ML_SERVICE_PATH, scriptName)]);

        let result = '';
        let error = '';

        // Send data to stdin
        pythonProcess.stdin.write(JSON.stringify(data));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            const stderr = data.toString();
            console.log('[ML Debug]', stderr.trim()); // Log debug output
            error += stderr;
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script error: ${error}`);
                reject(new Error(error || 'Python script failed'));
            } else {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    reject(new Error('Failed to parse Python output'));
                }
            }
        });
    });
}

async function predictTime(category, size, userId, extraFeatures = {}) {
    try {
        const output = await runPythonScript('predict.py', {
            category,
            size,
            user_id: userId,
            ...extraFeatures
        });
        return output.predicted_time;
    } catch (err) {
        console.error('ML Prediction Error:', err.message);
        return null;
    }
}

async function generateSchedule(userId, routine, tasks, routine_blocks = [], completed_today = {}) {
    try {
        const output = await runPythonScript('schedule.py', {
            user_id: userId,
            routine,
            tasks,
            routine_blocks,
            completed_today
        });
        return output.schedule;
    } catch (err) {
        console.error('Scheduling Error:', err.message);
        return [];
    }
}

async function trainModel(userId, completedTasks) {
    try {
        const output = await runPythonScript('ml_trainer.py', {
            user_id: userId,
            completed_tasks: completedTasks
        });
        return output;
    } catch (err) {
        console.error('ML Training Error:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = { predictTime, generateSchedule, trainModel };
