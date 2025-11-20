import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRoutine, updateRoutine } from '../api';

const RoutineSetup = ({ userId }) => {
    const navigate = useNavigate();
    const [routine, setRoutine] = useState({
        wake_up: '07:00',
        sleep: '23:00',
        daily_blocks: []
    });

    useEffect(() => {
        const loadRoutine = async () => {
            const data = await fetchRoutine(userId);
            if (data && data.wake_up) {
                setRoutine(data);
            }
        };
        loadRoutine();
    }, [userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateRoutine(userId, routine);
        navigate('/');
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white mt-10 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">Setup Your Routine</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Wake Up Time</label>
                        <input
                            type="time"
                            value={routine.wake_up}
                            onChange={(e) => setRoutine({ ...routine, wake_up: e.target.value })}
                            className="mt-1 block w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Sleep Time</label>
                        <input
                            type="time"
                            value={routine.sleep}
                            onChange={(e) => setRoutine({ ...routine, sleep: e.target.value })}
                            className="mt-1 block w-full border rounded p-2"
                        />
                    </div>
                </div>

                {/* Placeholder for adding blocks */}
                <div className="p-4 bg-gray-50 rounded border">
                    <p className="text-sm text-gray-500">Fixed blocks (classes, etc.) can be added here in future updates.</p>
                </div>

                <button
                    type="submit"
                    className="w-full bg-secondary text-white p-2 rounded hover:bg-emerald-600"
                >
                    Save & Continue
                </button>
            </form>
        </div>
    );
};

export default RoutineSetup;
