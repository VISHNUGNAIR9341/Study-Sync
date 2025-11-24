import React, { useState, useEffect } from 'react';
import { Smile, Meh, Frown, Heart } from 'lucide-react';

const MoodTracker = () => {
    const [moods, setMoods] = useState([]);
    const [selectedMood, setSelectedMood] = useState(null);
    const [note, setNote] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('studysync_moods');
        if (saved) setMoods(JSON.parse(saved));
    }, []);

    const saveMoods = (updatedMoods) => {
        setMoods(updatedMoods);
        localStorage.setItem('studysync_moods', JSON.stringify(updatedMoods));
    };

    const logMood = () => {
        if (!selectedMood) return;
        const today = new Date().toDateString();
        const existingIndex = moods.findIndex(m => new Date(m.date).toDateString() === today);

        const moodEntry = {
            mood: selectedMood,
            note,
            date: new Date().toISOString()
        };

        let updated;
        if (existingIndex >= 0) {
            updated = [...moods];
            updated[existingIndex] = moodEntry;
        } else {
            updated = [moodEntry, ...moods].slice(0, 30); // Keep last 30 days
        }

        saveMoods(updated);
        setSelectedMood(null);
        setNote('');
    };

    const getTodayMood = () => {
        const today = new Date().toDateString();
        return moods.find(m => new Date(m.date).toDateString() === today);
    };

    const moodOptions = [
        { value: 'great', icon: Smile, label: 'Great', color: 'text-green-500', bg: 'bg-green-100' },
        { value: 'good', icon: Smile, label: 'Good', color: 'text-blue-500', bg: 'bg-blue-100' },
        { value: 'okay', icon: Meh, label: 'Okay', color: 'text-yellow-500', bg: 'bg-yellow-100' },
        { value: 'bad', icon: Frown, label: 'Bad', color: 'text-orange-500', bg: 'bg-orange-100' },
        { value: 'terrible', icon: Frown, label: 'Terrible', color: 'text-red-500', bg: 'bg-red-100' },
    ];

    const todayMood = getTodayMood();
    const averageMood = moods.length > 0
        ? moods.slice(0, 7).reduce((sum, m) => {
            const index = moodOptions.findIndex(opt => opt.value === m.mood);
            return sum + (5 - index);
        }, 0) / Math.min(moods.length, 7)
        : 0;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <Heart className="text-pink-500" /> Mood Tracker
                </h2>
                {moods.length > 0 && (
                    <div className="text-right">
                        <p className="text-sm text-gray-500">7-day avg</p>
                        <p className="text-2xl font-bold text-pink-500">{averageMood.toFixed(1)}/5</p>
                    </div>
                )}
            </div>

            {todayMood ? (
                <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                    <p className="text-sm text-gray-600 mb-2">Today's mood:</p>
                    <div className="flex items-center gap-3">
                        {moodOptions.map(opt => {
                            if (opt.value === todayMood.mood) {
                                const Icon = opt.icon;
                                return (
                                    <div key={opt.value} className="flex items-center gap-2">
                                        <Icon size={32} className={opt.color} />
                                        <span className="font-bold text-lg">{opt.label}</span>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                    {todayMood.note && (
                        <p className="mt-2 text-sm text-gray-600 italic">"{todayMood.note}"</p>
                    )}
                    <button
                        onClick={() => {
                            setSelectedMood(todayMood.mood);
                            setNote(todayMood.note);
                        }}
                        className="mt-3 text-sm text-pink-600 hover:underline"
                    >
                        Update today's mood
                    </button>
                </div>
            ) : (
                <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">How are you feeling today?</p>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                        {moodOptions.map(opt => {
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setSelectedMood(opt.value)}
                                    className={`p-4 rounded-xl border-2 transition-all ${selectedMood === opt.value
                                            ? `${opt.bg} border-current ${opt.color} scale-110`
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon size={32} className={selectedMood === opt.value ? opt.color : 'text-gray-400'} />
                                    <p className="text-xs mt-1 font-medium">{opt.label}</p>
                                </button>
                            );
                        })}
                    </div>
                    <textarea
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                        placeholder="Optional: Add a note about your day..."
                        rows="2"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                    />
                    <button
                        onClick={logMood}
                        disabled={!selectedMood}
                        className="mt-3 w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    >
                        Log Mood
                    </button>
                </div>
            )}

            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent History</h3>
                {moods.slice(0, 7).map((mood, idx) => {
                    const moodOpt = moodOptions.find(opt => opt.value === mood.mood);
                    const Icon = moodOpt?.icon || Meh;
                    return (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <Icon size={20} className={moodOpt?.color} />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{moodOpt?.label}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(mood.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            {mood.note && (
                                <p className="text-xs text-gray-500 italic max-w-[200px] truncate">"{mood.note}"</p>
                            )}
                        </div>
                    );
                })}
                {moods.length === 0 && (
                    <p className="text-center text-gray-400 py-4">No mood history yet</p>
                )}
            </div>
        </div>
    );
};

export default MoodTracker;
