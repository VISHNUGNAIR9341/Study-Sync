import React, { useState, useEffect } from 'react';
import { fetchRoutineBlocks, createRoutineBlock, deleteRoutineBlock } from '../api';
import { Plus, Trash2, Clock, Coffee, Moon, Sun, BookOpen, School, Gamepad2, MoreHorizontal } from 'lucide-react';

const ACTIVITY_TYPES = [
    { value: 'sleep', label: 'Sleep', icon: Moon, color: 'bg-indigo-100 text-indigo-700' },
    { value: 'wake', label: 'Wake Up', icon: Sun, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'bg-orange-100 text-orange-700' },
    { value: 'lunch', label: 'Lunch', icon: Coffee, color: 'bg-green-100 text-green-700' },
    { value: 'dinner', label: 'Dinner', icon: Coffee, color: 'bg-red-100 text-red-700' },
    { value: 'school', label: 'School/Work', icon: School, color: 'bg-blue-100 text-blue-700' },
    { value: 'study', label: 'Study Time', icon: BookOpen, color: 'bg-purple-100 text-purple-700' },
    { value: 'play', label: 'Play/Recreation', icon: Gamepad2, color: 'bg-pink-100 text-pink-700' },
    { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' },
];

const RoutineBuilder = ({ userId }) => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newBlock, setNewBlock] = useState({
        activity_type: 'sleep',
        start_time: '22:00',
        end_time: '06:00',
    });

    useEffect(() => {
        loadBlocks();
    }, [userId]);

    const loadBlocks = async () => {
        setLoading(true);
        try {
            const data = await fetchRoutineBlocks(userId);
            setBlocks(data);
        } catch (err) {
            console.error('Failed to load routine blocks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBlock = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createRoutineBlock({ ...newBlock, user_id: userId });
            setNewBlock({ activity_type: 'sleep', start_time: '22:00', end_time: '06:00' });
            setShowAddForm(false);
            await loadBlocks();
        } catch (err) {
            console.error('Failed to add routine block:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBlock = async (blockId) => {
        setLoading(true);
        try {
            await deleteRoutineBlock(blockId);
            await loadBlocks();
        } catch (err) {
            console.error('Failed to delete routine block:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActivityConfig = (type) => {
        return ACTIVITY_TYPES.find(a => a.value === type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const m = parseInt(minutes, 10);
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <Clock className="text-indigo-500" /> Daily Routine
                </h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} /> Add Activity
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddBlock} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                            <select
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newBlock.activity_type}
                                onChange={e => setNewBlock({ ...newBlock, activity_type: e.target.value })}
                            >
                                {ACTIVITY_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newBlock.start_time}
                                onChange={e => setNewBlock({ ...newBlock, start_time: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="time"
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newBlock.end_time}
                                onChange={e => setNewBlock({ ...newBlock, end_time: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Activity'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {loading && blocks.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Loading routine...</div>
                ) : blocks.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">
                        <p>No routine activities yet.</p>
                        <p className="text-sm">Add activities to define your daily schedule!</p>
                    </div>
                ) : (
                    blocks.map(block => {
                        const config = getActivityConfig(block.activity_type);
                        const Icon = config.icon;
                        return (
                            <div
                                key={block.id}
                                className={`flex items-center justify-between p-4 rounded-xl border ${config.color} hover:shadow-md transition-all`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={24} />
                                    <div>
                                        <h3 className="font-semibold">{config.label}</h3>
                                        <p className="text-sm opacity-75">
                                            {formatTime(block.start_time)} - {formatTime(block.end_time)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteBlock(block.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                    title="Remove activity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RoutineBuilder;
