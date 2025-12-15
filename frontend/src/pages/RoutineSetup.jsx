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

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const m = parseInt(minutes, 10);
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
    };

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
        <div className="max-w-2xl mx-auto p-6 bg-white mt-10 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Setup Your Routine</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Wake Up Time</label>
                        <input
                            type="time"
                            value={routine.wake_up}
                            onChange={(e) => setRoutine({ ...routine, wake_up: e.target.value })}
                            className="mt-1 block w-full border rounded p-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">{formatTime(routine.wake_up)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Sleep Time</label>
                        <input
                            type="time"
                            value={routine.sleep}
                            onChange={(e) => setRoutine({ ...routine, sleep: e.target.value })}
                            className="mt-1 block w-full border rounded p-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">{formatTime(routine.sleep)}</p>
                    </div>
                </div>

                {/* Placeholder for adding blocks */}
                <div className="p-4 bg-slate-50 rounded border border-slate-200">
                    <p className="text-sm text-slate-500">Fixed blocks (classes, etc.) can be added here in future updates.</p>
                </div>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition-colors"
                >
                    Save & Continue
                </button>
            </form>
        </div>
    );
};

export default RoutineSetup;
