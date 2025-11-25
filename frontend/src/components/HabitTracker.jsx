import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';

const HabitTracker = () => {
    const [habits, setHabits] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: '', frequency: 'daily', target: 1 });

    useEffect(() => {
        const saved = localStorage.getItem('studysync_habits');
        if (saved) setHabits(JSON.parse(saved));
    }, []);

    const saveHabits = (updatedHabits) => {
        setHabits(updatedHabits);
        localStorage.setItem('studysync_habits', JSON.stringify(updatedHabits));
    };

    const addHabit = (e) => {
        e.preventDefault();
        const habit = {
            id: Date.now(),
            ...newHabit,
            completions: [],
            createdAt: new Date().toISOString()
        };
        saveHabits([...habits, habit]);
        setNewHabit({ name: '', frequency: 'daily', target: 1 });
        setShowAddForm(false);
    };

    const toggleCompletion = (habitId) => {
        const today = new Date().toDateString();
        const updated = habits.map(habit => {
            if (habit.id === habitId) {
                const completions = habit.completions || [];
                const alreadyDone = completions.includes(today);
                return {
                    ...habit,
                    completions: alreadyDone
                        ? completions.filter(d => d !== today)
                        : [...completions, today]
                };
            }
            return habit;
        });
        saveHabits(updated);
    };

    const deleteHabit = (habitId) => {
        saveHabits(habits.filter(h => h.id !== habitId));
    };

    const getStreak = (completions) => {
        if (!completions || completions.length === 0) return 0;
        const sorted = completions.map(d => new Date(d)).sort((a, b) => b - a);
        let streak = 0;
        let currentDate = new Date();

        for (let completion of sorted) {
            const diffDays = Math.floor((currentDate - completion) / (1000 * 60 * 60 * 24));
            if (diffDays <= 1) {
                streak++;
                currentDate = completion;
            } else {
                break;
            }
        }
        return streak;
    };

    const isCompletedToday = (completions) => {
        const today = new Date().toDateString();
        return completions && completions.includes(today);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <Target className="text-green-500" /> Habit Tracker
                </h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                >
                    <Plus size={18} /> Add Habit
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={addHabit} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Habit Name</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                value={newHabit.name}
                                onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                                placeholder="e.g., Exercise, Read, Meditate"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                            <select
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                value={newHabit.frequency}
                                onChange={e => setNewHabit({ ...newHabit, frequency: e.target.value })}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Habit</button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {habits.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">
                        <p>No habits yet. Add one to start building consistency!</p>
                    </div>
                ) : (
                    habits.map(habit => {
                        const streak = getStreak(habit.completions);
                        const completedToday = isCompletedToday(habit.completions);
                        return (
                            <div key={habit.id} className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={() => toggleCompletion(habit.id)}
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${completedToday
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-gray-300 hover:border-green-500'
                                            }`}
                                    >
                                        {completedToday && '✓'}
                                    </button>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{habit.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{habit.frequency}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-600">{streak}</p>
                                        <p className="text-xs text-gray-500">day streak</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteHabit(habit.id)}
                                    className="ml-4 text-gray-400 hover:text-red-500 transition-colors p-2"
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

export default HabitTracker;
