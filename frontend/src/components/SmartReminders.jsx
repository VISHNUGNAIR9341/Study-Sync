import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, CheckCircle, Flame, Calendar } from 'lucide-react';
import notificationManager from '../utils/notificationManager';
import storageManager from '../utils/storageManager';

const SmartReminders = ({ tasks = [], userStats = {}, userId }) => {
    const [enabled, setEnabled] = useState(false);
    const [permission, setPermission] = useState('default');
    const [settings, setSettings] = useState({
        taskReminders: true,
        studyReminders: true,
        streakReminders: true,
        dailySummary: true,
        summaryTime: '20:00'
    });

    // Load settings from localStorage
    useEffect(() => {
        if (!userId) return;
        const savedSettings = storageManager.get(`reminderSettings_${userId}`, settings);
        setSettings(savedSettings);
        setPermission(Notification.permission);
        setEnabled(Notification.permission === 'granted' && savedSettings.taskReminders);
    }, [userId]);

    // Request notification permission
    const handleEnableNotifications = async () => {
        const granted = await notificationManager.requestPermission();
        setPermission(granted ? 'granted' : 'denied');
        setEnabled(granted);

        if (granted) {
            notificationManager.show('Notifications Enabled!', {
                body: 'You\'ll now receive smart reminders for your tasks and study sessions.'
            });
        }
    };

    // Update settings
    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        if (userId) {
            storageManager.set(`reminderSettings_${userId}`, newSettings);
        }
    };

    // Schedule task reminders when tasks change
    useEffect(() => {
        if (!enabled || !settings.taskReminders) return;

        // Cancel all existing task reminders
        tasks.forEach(task => {
            notificationManager.cancelTaskReminders(task.id);
        });

        // Schedule new reminders for pending tasks with deadlines
        tasks
            .filter(task => task.status !== 'Completed' && task.deadline)
            .forEach(task => {
                notificationManager.scheduleTaskReminders(task);
            });
    }, [tasks, enabled, settings.taskReminders]);

    // Schedule daily streak reminder
    useEffect(() => {
        if (!enabled || !settings.streakReminders || !userStats.streak) return;

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0); // 6 PM tomorrow

        const delayMs = tomorrow - now;

        const { title, options } = notificationManager.templates.streakReminder(userStats.streak);
        notificationManager.schedule('daily-streak', title, options, delayMs);

        return () => notificationManager.cancel('daily-streak');
    }, [enabled, settings.streakReminders, userStats.streak]);

    // Schedule daily summary
    useEffect(() => {
        if (!enabled || !settings.dailySummary) return;

        const [hours, minutes] = settings.summaryTime.split(':').map(Number);
        const now = new Date();
        const summaryTime = new Date(now);
        summaryTime.setHours(hours, minutes, 0, 0);

        // If time has passed today, schedule for tomorrow
        if (summaryTime <= now) {
            summaryTime.setDate(summaryTime.getDate() + 1);
        }

        const delayMs = summaryTime - now;

        // Calculate today's stats
        const completedToday = tasks.filter(t => {
            const completedDate = new Date(t.updated_at || t.created_at);
            return t.status === 'Completed' &&
                completedDate.toDateString() === now.toDateString();
        }).length;

        const studyTime = completedToday * 30; // Rough estimate

        const { title, options } = notificationManager.templates.dailySummary(completedToday, studyTime);
        notificationManager.schedule('daily-summary', title, options, delayMs);

        return () => notificationManager.cancel('daily-summary');
    }, [enabled, settings.dailySummary, settings.summaryTime, tasks]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                        <Bell className="text-violet-600 dark:text-violet-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100">Smart Reminders</h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400">Never miss a deadline or study session</p>
                    </div>
                </div>

                {permission === 'granted' ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                        <CheckCircle size={18} />
                        <span>Active</span>
                    </div>
                ) : (
                    <button
                        onClick={handleEnableNotifications}
                        className="flex items-center gap-2 bg-violet-200 text-violet-900 px-4 py-2 rounded-lg hover:bg-violet-300 transition-all font-medium"
                    >
                        <Bell size={18} />
                        Enable Notifications
                    </button>
                )}
            </div>

            {permission === 'granted' && (
                <div className="space-y-4">
                    {/* Task Reminders */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-blue-500" size={20} />
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-100">Task Deadline Reminders</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Get notified 1 day, 1 hour, and 15 min before deadlines</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.taskReminders}
                                onChange={(e) => updateSetting('taskReminders', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Streak Reminders */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Flame className="text-orange-500" size={20} />
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-100">Streak Preservation</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Daily reminder to keep your streak alive</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.streakReminders}
                                onChange={(e) => updateSetting('streakReminders', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                        </label>
                    </div>

                    {/* Daily Summary */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-700 rounded-xl">
                        <div className="flex items-center gap-3 flex-1">
                            <Clock className="text-purple-500" size={20} />
                            <div className="flex-1">
                                <p className="font-medium text-gray-800 dark:text-gray-100">Daily Summary</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Receive at</p>
                                    <input
                                        type="time"
                                        value={settings.summaryTime}
                                        onChange={(e) => updateSetting('summaryTime', e.target.value)}
                                        disabled={!settings.dailySummary}
                                        className="text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-gray-800 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.dailySummary}
                                onChange={(e) => updateSetting('dailySummary', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Active Reminders Count */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                            {tasks.filter(t => t.status !== 'Completed' && t.deadline).length} active task reminders scheduled
                        </p>
                    </div>
                </div>
            )}

            {permission === 'denied' && (
                <div className="p-4 bg-red-50 dark:bg-red-900 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-200 mb-2">
                        <BellOff size={20} />
                        <p className="font-medium">Notifications Blocked</p>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-300">
                        Please enable notifications in your browser settings to use this feature.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SmartReminders;
