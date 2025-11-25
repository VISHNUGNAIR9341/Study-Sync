import React, { useState, useEffect } from 'react';
import { Heart, Droplets, Moon, Dumbbell, Eye, TrendingUp, Plus } from 'lucide-react';
import storageManager from '../utils/storageManager';

const WellnessDashboard = () => {
    const [wellnessData, setWellnessData] = useState({
        water: 0, // glasses today
        sleep: 0, // hours last night
        exercise: 0, // minutes today
    });

    useEffect(() => {
        loadTodayData();
    }, []);

    const loadTodayData = () => {
        const today = new Date().toDateString();
        const savedData = storageManager.get(`wellness_${today}`, {
            water: 0,
            sleep: 0,
            exercise: 0,
        });
        setWellnessData(savedData);
    };

    const updateWellness = (key, value) => {
        const newData = { ...wellnessData, [key]: value };
        setWellnessData(newData);

        const today = new Date().toDateString();
        storageManager.set(`wellness_${today}`, newData);
    };

    const calculateWellnessScore = () => {
        const waterScore = Math.min((wellnessData.water / 8) * 100, 100);
        const sleepScore = Math.min((wellnessData.sleep / 8) * 100, 100);
        const exerciseScore = Math.min((wellnessData.exercise / 30) * 100, 100);

        return Math.round((waterScore + sleepScore + exerciseScore) / 3);
    };

    const getRecommendation = () => {
        if (wellnessData.water < 8) return `Drink ${8 - wellnessData.water} more glasses of water today`;
        if (wellnessData.sleep < 7) return "Try to get at least 7-8 hours of sleep tonight";
        if (wellnessData.exercise < 30) return "Take a 15-minute walk to boost your energy";
        return "Great job! You're maintaining excellent wellness habits! 🎉";
    };

    const wellnessScore = calculateWellnessScore();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                    <Heart className="text-white" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Wellness Dashboard</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track your daily health essentials</p>
                </div>
            </div>

            {/* Wellness Score */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Daily Score</h3>
                    <div className="text-right">
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">{wellnessScore}%</p>
                    </div>
                </div>

                {/* Health Rings */}
                <div className="grid grid-cols-3 gap-4">
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
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Water Tracker */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Droplets className="text-blue-500" size={20} />
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Water</h3>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{wellnessData.water}/8</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateWellness('water', Math.max(0, wellnessData.water - 1))}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            -
                        </button>
                        <button
                            onClick={() => updateWellness('water', Math.min(12, wellnessData.water + 1))}
                            className="flex-1 bg-blue-600 text-white px-2 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            +
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
                        <span className="text-sm text-gray-500 dark:text-gray-400">{wellnessData.sleep}h</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="12"
                        step="0.5"
                        value={wellnessData.sleep}
                        onChange={(e) => updateWellness('sleep', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Exercise Tracker */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Dumbbell className="text-green-500" size={20} />
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Exercise</h3>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{wellnessData.exercise}m</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateWellness('exercise', wellnessData.exercise + 15)}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            +15 min
                        </button>
                    </div>
                </div>
            </div>

            {/* Recommendation */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Tip of the Day</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-200">{getRecommendation()}</p>
            </div>
        </div>
    );
};

export default WellnessDashboard;
