import React, { useState, useEffect } from 'react';
import { Heart, Droplets, Moon, Dumbbell, Eye, TrendingUp, Plus } from 'lucide-react';
import storageManager from '../utils/storageManager';

const WellnessDashboard = () => {
    const [wellnessData, setWellnessData] = useState({
        water: 0, // glasses today
        sleep: 0, // hours last night
        exercise: 0, // minutes today
        screenTime: 0, // hours today
        stress: 3 // 1-5 scale
    });

    const [history, setHistory] = useState([]);
    const [showAddLog, setShowAddLog] = useState(false);

    useEffect(() => {
        loadTodayData();
        loadHistory();
    }, []);

    const loadTodayData = () => {
        const today = new Date().toDateString();
        const savedData = storageManager.get(`wellness_${today}`, {
            water: 0,
            sleep: 0,
            exercise: 0,
            screenTime: 0,
            stress: 3
        });
        setWellnessData(savedData);
    };

    const loadHistory = () => {
        const savedHistory = storageManager.get('wellness_history', []);
        setHistory(savedHistory.slice(-7)); // Last 7 days
    };

    const updateWellness = (key, value) => {
        const newData = { ...wellnessData, [key]: value };
        setWellnessData(newData);

        const today = new Date().toDateString();
        storageManager.set(`wellness_${today}`, newData);

        // Update history
        const newHistory = [...history.filter(h => h.date !== today), { date: today, ...newData }];
        storageManager.set('wellness_history', newHistory);
        loadHistory();
    };

    const calculateWellnessScore = () => {
        const waterScore = Math.min((wellnessData.water / 8) * 100, 100);
        const sleepScore = Math.min((wellnessData.sleep / 8) * 100, 100);
        const exerciseScore = Math.min((wellnessData.exercise / 30) * 100, 100);
        const stressScore = ((6 - wellnessData.stress) / 4) * 100;

        return Math.round((waterScore + sleepScore + exerciseScore + stressScore) / 4);
    };

    const getRecommendation = () => {
        const recommendations = [];

        if (wellnessData.water < 8) {
            recommendations.push(`Drink ${8 - wellnessData.water} more glasses of water today`);
        }
        if (wellnessData.sleep < 7) {
            recommendations.push("Try to get at least 7-8 hours of sleep tonight");
        }
        if (wellnessData.exercise < 30) {
            recommendations.push("Take a 15-minute walk to boost your energy");
        }
        if (wellnessData.stress > 3) {
            recommendations.push("Take a 5-minute break to relax and breathe");
        }
        if (wellnessData.screenTime > 4) {
            recommendations.push("Consider taking a screen break to rest your eyes");
        }

        return recommendations.length > 0
            ? recommendations[0]
            : "Great job! You're maintaining excellent wellness habits! 🎉";
    };

    const wellnessScore = calculateWellnessScore();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                        <Heart className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Wellness Dashboard</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Track your health and well-being</p>
                    </div>
                </div>
            </div>

            {/* Wellness Score */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Wellness Score</h3>
                    <div className="text-right">
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">{wellnessScore}%</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Overall Health</p>
                    </div>
                </div>

                {/* Health Rings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-2">
                            <svg className="transform -rotate-90" width="80" height="80">
                                <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle
                                    cx="40" cy="40" r="36"
                                    stroke="#3b82f6"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${(wellnessData.water / 8) * 226} 226`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Droplets className="text-blue-500" size={24} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{wellnessData.water}/8</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Water</p>
                    </div>

                    <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-2">
                            <svg className="transform -rotate-90" width="80" height="80">
                                <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle
                                    cx="40" cy="40" r="36"
                                    stroke="#8b5cf6"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${(wellnessData.sleep / 8) * 226} 226`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Moon className="text-purple-500" size={24} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{wellnessData.sleep}h</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sleep</p>
                    </div>

                    <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-2">
                            <svg className="transform -rotate-90" width="80" height="80">
                                <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle
                                    cx="40" cy="40" r="36"
                                    stroke="#10b981"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${(wellnessData.exercise / 30) * 226} 226`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Dumbbell className="text-green-500" size={24} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{wellnessData.exercise}m</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Exercise</p>
                    </div>

                    <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-2">
                            <svg className="transform -rotate-90" width="80" height="80">
                                <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle
                                    cx="40" cy="40" r="36"
                                    stroke="#f59e0b"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${((6 - wellnessData.stress) / 5) * 226} 226`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Heart className="text-orange-500" size={24} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{wellnessData.stress}/5</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Stress</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Water Tracker */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Droplets className="text-blue-500" size={20} />
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Water Intake</h3>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{wellnessData.water}/8 glasses</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateWellness('water', Math.max(0, wellnessData.water - 1))}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            -
                        </button>
                        <button
                            onClick={() => updateWellness('water', Math.min(12, wellnessData.water + 1))}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            +1 Glass
                        </button>
                    </div>
                </div>

                {/* Sleep Tracker */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Moon className="text-purple-500" size={20} />
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Sleep</h3>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{wellnessData.sleep} hours</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="12"
                        step="0.5"
                        value={wellnessData.sleep}
                        onChange={(e) => updateWellness('sleep', parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>

                {/* Exercise Tracker */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Dumbbell className="text-green-500" size={20} />
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Exercise</h3>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{wellnessData.exercise} min</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateWellness('exercise', wellnessData.exercise + 15)}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            +15 min
                        </button>
                        <button
                            onClick={() => updateWellness('exercise', wellnessData.exercise + 30)}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            +30 min
                        </button>
                    </div>
                </div>

                {/* Stress Level */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Heart className="text-orange-500" size={20} />
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Stress Level</h3>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Level {wellnessData.stress}</span>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(level => (
                            <button
                                key={level}
                                onClick={() => updateWellness('stress', level)}
                                className={`flex-1 px-3 py-2 rounded-lg transition-colors ${wellnessData.stress === level
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommendation */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Recommendation</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-200">{getRecommendation()}</p>
            </div>
        </div>
    );
};

export default WellnessDashboard;
