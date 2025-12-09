import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchTasks, createTask, generateSchedule, updateTaskStatus, updateTaskProgress, deleteTask, fetchUser } from '../api';
import { Plus, Calendar, CheckCircle, Clock, AlertCircle, Loader2, Trash2, Trophy, Flame, CalendarClock } from 'lucide-react';
import PomodoroTimer from '../components/PomodoroTimer';
import RoutineBuilder from '../components/RoutineBuilder';
import HabitTracker from '../components/HabitTracker';
import ExamMode from '../components/ExamMode';
import MoodTracker from '../components/MoodTracker';
import FocusMusicPlayer from '../components/FocusMusicPlayer';
import DarkModeToggle from '../components/DarkModeToggle';
import SmartReminders from '../components/SmartReminders';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import UserProfile from '../components/UserProfile';
import WellnessDashboard from '../components/WellnessDashboard';
import BackupManager from '../components/BackupManager';
import DatabaseViewer from '../components/DatabaseViewer';
import TaskCompletionModal from '../components/TaskCompletionModal';

const Dashboard = ({ userId, onLogout }) => {
    const [tasks, setTasks] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [completedScheduleItems, setCompletedScheduleItems] = useState(new Set());
    const [activeTab, setActiveTab] = useState('tasks');
    const [showDatabaseViewer, setShowDatabaseViewer] = useState(false);
    const [userStats, setUserStats] = useState({ points: 0, streak: 0 });
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [newTask, setNewTask] = useState({
        title: '', category: 'writing', estimated_size: 1, default_expected_time: 30, priority: 'Medium', deadline: '',
        complexity: 'Medium', num_pages: '', num_slides: '', num_questions: ''
    });
    const [completionModal, setCompletionModal] = useState({
        isOpen: false,
        taskId: null,
        taskTitle: '',
        estimatedTime: 0
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [tasksData, userData] = await Promise.all([
                fetchTasks(userId),
                fetchUser(userId)
            ]);
            setTasks(tasksData || []);
            setUserStats(userData || { points: 0, streak: 0 });
            setError(null);
        } catch (err) {
            console.error("Failed to load data", err);
            setError("Failed to load data. Please check if the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [userId]);

    // Auto-generate schedule when dashboard loads or tasks change
    useEffect(() => {
        const autoGenerateSchedule = async () => {
            if (tasks.length > 0 && userId) {
                try {
                    const scheduleData = await generateSchedule(userId);
                    setSchedule(scheduleData || []);

                    // Load saved completion state from localStorage
                    const savedDate = localStorage.getItem('schedule_date');
                    const today = new Date().toDateString();

                    // Only restore if it's the same day AND we have a valid schedule
                    if (savedDate === today && scheduleData && scheduleData.length > 0) {
                        const savedCompletions = localStorage.getItem('completed_schedule_items');
                        if (savedCompletions) {
                            try {
                                const savedIndices = JSON.parse(savedCompletions);

                                // Create a hash of current schedule for validation
                                const currentScheduleHash = scheduleData.map(item =>
                                    `${item.task_id}_${item.session_info?.session_num || 0}`
                                ).join(',');

                                const savedScheduleHash = localStorage.getItem('schedule_hash');

                                // Only restore if schedule hasn't changed significantly
                                if (savedScheduleHash === currentScheduleHash) {
                                    // Only restore indices that are still valid for current schedule
                                    const validIndices = savedIndices.filter(idx =>
                                        idx < scheduleData.length && scheduleData[idx] != null
                                    );
                                    setCompletedScheduleItems(new Set(validIndices));

                                    // Update localStorage with only valid indices
                                    if (validIndices.length !== savedIndices.length) {
                                        localStorage.setItem('completed_schedule_items', JSON.stringify(validIndices));
                                    }
                                } else {
                                    // Schedule changed - clear old completions
                                    console.log('Schedule changed, clearing old completions');
                                    localStorage.removeItem('completed_schedule_items');
                                    localStorage.setItem('schedule_hash', currentScheduleHash);
                                    setCompletedScheduleItems(new Set());
                                }
                            } catch (e) {
                                // Invalid data - clear it
                                console.error('Error parsing saved completions:', e);
                                localStorage.removeItem('completed_schedule_items');
                                setCompletedScheduleItems(new Set());
                            }
                        } else {
                            // No saved completions - save current hash
                            const currentScheduleHash = scheduleData.map(item =>
                                `${item.task_id}_${item.session_info?.session_num || 0}`
                            ).join(',');
                            localStorage.setItem('schedule_hash', currentScheduleHash);
                        }
                    } else if (savedDate !== today) {
                        // New day - clear old data
                        localStorage.setItem('schedule_date', today);
                        localStorage.removeItem('completed_schedule_items');
                        localStorage.removeItem('schedule_hash');
                        setCompletedScheduleItems(new Set());
                    } else {
                        // Same day but no schedule or empty - clear completions
                        setCompletedScheduleItems(new Set());
                    }
                } catch (err) {
                    console.error("Auto-schedule failed:", err);
                    // Silently fail - user can manually trigger if needed
                }
            }
        };

        // Only auto-generate if we have tasks and are on the tasks tab
        if (activeTab === 'tasks') {
            autoGenerateSchedule();
        }
    }, [tasks, userId, activeTab]); // Re-run when tasks change

    const handleAddTask = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Clean up empty fields before sending
            const taskPayload = { ...newTask, user_id: userId };
            if (!taskPayload.num_pages) delete taskPayload.num_pages;
            if (!taskPayload.num_slides) delete taskPayload.num_slides;
            if (!taskPayload.num_questions) delete taskPayload.num_questions;

            await createTask(taskPayload);
            setShowAddModal(false);
            setNewTask({
                title: '', category: 'writing', estimated_size: 1, default_expected_time: 30, priority: 'Medium', deadline: '',
                complexity: 'Medium', num_pages: '', num_slides: '', num_questions: ''
            });
            await loadData();
        } catch (err) {
            setError("Failed to add task.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        setLoading(true);
        try {
            await deleteTask(taskId);
            await loadData();
        } catch (err) {
            setError("Failed to delete task.");
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteTask = async (taskId, actualTime = null) => {
        setLoading(true);
        try {
            await updateTaskStatus(taskId, 'Completed', actualTime);
            await loadData();
        } catch (err) {
            setError("Failed to complete task.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSchedule = async () => {
        setLoading(true);
        try {
            const scheduleData = await generateSchedule(userId);
            setSchedule(scheduleData || []);
            // Clear completed items when manually regenerating schedule
            setCompletedScheduleItems(new Set());
            localStorage.removeItem('completed_schedule_items');
        } catch (err) {
            setError("Failed to generate schedule.");
        } finally {
            setLoading(false);
        }
    };


    const handleModalSubmit = (actualTime) => {
        const { taskId } = completionModal;
        if (taskId) {
            // Immediately remove from UI
            setTasks(currentTasks =>
                currentTasks.filter(t => t.id !== taskId)
            );
            handleCompleteTask(taskId, actualTime);
        }
        setCompletionModal({ isOpen: false, taskId: null, taskTitle: '', estimatedTime: 0 });
    };

    const handleToggleScheduleItem = async (index) => {
        const scheduledTask = schedule[index];
        if (!scheduledTask) return;

        setCompletedScheduleItems(prev => {
            const newSet = new Set(prev);
            const wasCompleted = newSet.has(index);

            if (wasCompleted) {
                newSet.delete(index);
            } else {
                newSet.add(index);
                // Award points for completing a scheduled task
                setUserStats(prevStats => ({
                    ...prevStats,
                    points: prevStats.points + 10
                }));
            }

            // Save to localStorage for persistence
            localStorage.setItem('completed_schedule_items', JSON.stringify([...newSet]));
            localStorage.setItem('schedule_date', new Date().toDateString());
            // Save schedule hash for validation
            const currentScheduleHash = schedule.map(item =>
                `${item.task_id}_${item.session_info?.session_num || 0}`
            ).join(',');
            localStorage.setItem('schedule_hash', currentScheduleHash);

            // Always update progress (for both check and uncheck)
            const taskId = scheduledTask.task_id;

            // Find all schedule items for this task IN TODAY'S SCHEDULE
            const taskScheduleItems = schedule
                .map((item, idx) => ({ item, idx }))
                .filter(({ item }) => item.task_id === taskId);

            // Count completed sessions AFTER this toggle (only from today's schedule)
            const completedSessionsToday = taskScheduleItems.filter(({ idx }) =>
                newSet.has(idx)
            ).length;

            // Get total sessions and count properly
            let totalSessions = taskScheduleItems.length;
            let completedSessions = completedSessionsToday;

            if (scheduledTask.session_info && scheduledTask.session_info.total_sessions) {
                // Multi-session task - use total_sessions from session_info
                totalSessions = scheduledTask.session_info.total_sessions;

                // Count how many unique session numbers are checked in today's schedule
                const checkedSessionNumbers = new Set(
                    taskScheduleItems
                        .filter(({ idx }) => newSet.has(idx))
                        .map(({ item }) => item.session_info?.session_num)
                        .filter(Boolean)
                );

                // The number of unique sessions checked is our completed count
                completedSessions = checkedSessionNumbers.size;
            }

            // Calculate progress percentage
            const progressPercentage = Math.round((completedSessions / totalSessions) * 100);

            // Update task progress in UI immediately
            setTasks(currentTasks =>
                currentTasks.map(t =>
                    t.id === taskId
                        ? { ...t, progress: progressPercentage }
                        : t
                )
            );

            // Always update progress in backend (for both check and uncheck)
            updateTaskProgress(taskId, progressPercentage).catch(err =>
                console.error('Failed to update progress:', err)
            );

            // Check if all sessions are now completed
            const allSessionsCompleted = completedSessions === totalSessions;

            // Only mark as complete when checking (not unchecking)
            if (!wasCompleted) {
                // If this task has session info and all sessions are done, mark task as completed
                if (allSessionsCompleted && scheduledTask.session_info) {
                    const { session_num, total_sessions } = scheduledTask.session_info;
                    // Only mark complete if this was the last session
                    if (session_num === total_sessions) {
                        // Find task to get estimated time
                        const task = tasks.find(t => t.id === taskId);
                        const estimatedTime = task ? (task.manual_time || task.ml_predicted_time || task.default_expected_time) : 0;

                        // Open completion modal instead of prompt
                        setCompletionModal({
                            isOpen: true,
                            taskId: taskId,
                            taskTitle: task ? task.title : 'Task',
                            estimatedTime: estimatedTime
                        });
                    }
                } else if (allSessionsCompleted && !scheduledTask.session_info) {
                    // Find task to get estimated time
                    const task = tasks.find(t => t.id === taskId);
                    const estimatedTime = task ? (task.manual_time || task.ml_predicted_time || task.default_expected_time) : 0;

                    // Open completion modal instead of prompt
                    setCompletionModal({
                        isOpen: true,
                        taskId: taskId,
                        taskTitle: task ? task.title : 'Task',
                        estimatedTime: estimatedTime
                    });
                }
            }

            return newSet;
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div className="relative">
                        <h1 className="text-5xl bg-clip-text text-transparent bg-gradient-to-r 
               from-cyan-300 via-purple-300 to-pink-300">
                            StudySync
                        </h1>

                        <p className="text-gray-600 dark:text-gray-300 mt-2 font-medium">Sync your success, one task at a time!</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <DarkModeToggle />
                        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-2.5 rounded-full shadow-lg transform hover:scale-110 transition-all">
                            <Trophy className="text-white" size={22} />
                            <span className="font-black text-white">{userStats.points} pts</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 rounded-full shadow-lg transform hover:scale-110 transition-all">
                            <Flame className="text-white" size={22} />
                            <span className="font-black text-white">{userStats.streak} day streak</span>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-110 font-bold"
                        >
                            <Plus size={22} /> New Task
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 mb-6 rounded flex items-center gap-2">
                        <AlertCircle size={20} /> {error}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 whitespace-nowrap ${activeTab === 'tasks'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-2xl scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900 dark:hover:to-cyan-900 shadow-md'
                            }`}
                    >
                        Tasks & Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 whitespace-nowrap ${activeTab === 'profile'
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-2xl scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900 dark:hover:to-purple-900 shadow-md'
                            }`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('routine')}
                        className={`px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 whitespace-nowrap ${activeTab === 'routine'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900 dark:hover:to-pink-900 shadow-md'
                            }`}
                    >
                        Daily Routine
                    </button>
                    <button
                        onClick={() => setActiveTab('wellness')}
                        className={`px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 whitespace-nowrap ${activeTab === 'wellness'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-2xl scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900 dark:hover:to-emerald-900 shadow-md'
                            }`}
                    >
                        Wellness
                    </button>
                    <button
                        onClick={() => setActiveTab('exams')}
                        className={`px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 whitespace-nowrap ${activeTab === 'exams'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-2xl scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900 dark:hover:to-red-900 shadow-md'
                            }`}
                    >
                        Exams
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 whitespace-nowrap ${activeTab === 'settings'
                            ? 'bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-2xl scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700 shadow-md'
                            }`}
                    >
                        Settings
                    </button>
                </div>

                {activeTab === 'profile' ? (
                    <UserProfile userId={userId} tasks={tasks} />
                ) : activeTab === 'settings' ? (
                    <div className="space-y-6">
                        <SmartReminders tasks={tasks} userStats={userStats} userId={userId} />
                        <BackupManager userId={userId} />

                        {/* Database Viewer */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                                Database Inspector
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                View your application's database tables, schemas, and data (read-only)
                            </p>
                            <button
                                onClick={() => setShowDatabaseViewer(true)}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                                View Database
                            </button>
                        </div>
                    </div>
                ) : activeTab === 'routine' ? (
                    <RoutineBuilder userId={userId} />
                ) : activeTab === 'wellness' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <WellnessDashboard />
                            <MoodTracker />
                        </div>
                        <div className="space-y-6">
                            <HabitTracker />
                            <FocusMusicPlayer />
                        </div>
                    </div>
                ) : activeTab === 'exams' ? (
                    <ExamMode />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <PomodoroTimer />

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                    <CheckCircle className="text-emerald-500" /> Your Tasks
                                </h2>

                                {loading && tasks.length === 0 ? (
                                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>
                                ) : (
                                    <div className="space-y-4">
                                        {tasks.filter(t => t.status !== 'Completed').map(task => (
                                            <div key={task.id} className="group p-4 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Link to={`/task/${task.id}`} className="hover:underline">
                                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{task.title}</h3>
                                                    </Link>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${task.priority === 'Urgent' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' :
                                                        task.priority === 'High' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200' :
                                                            'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        <p className="capitalize">{task.category}</p>
                                                        <p className="text-xs mt-1 text-indigo-600 dark:text-indigo-400 font-medium">
                                                            {task.ml_predicted_time}m predicted
                                                        </p>
                                                        {task.deadline && (
                                                            <p className="text-xs mt-1 text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                                                                <CalendarClock size={12} />
                                                                Due: {new Date(task.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                                            </p>
                                                        )}
                                                        {/* Progress Bar */}
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-600">
                                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
                                                        </div>
                                                        <Link to={`/task/${task.id}`} className="text-xs text-indigo-500 hover:text-indigo-700 mt-2 inline-block font-medium">
                                                            View Schedule & Details &rarr;
                                                        </Link>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleCompleteTask(task.id)}
                                                            className="text-gray-400 hover:text-emerald-500 transition-colors p-1"
                                                            title="Complete Task"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                            title="Delete Task"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {tasks.filter(t => t.status !== 'Completed').length === 0 && !loading && (
                                            <div className="text-center py-10 text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed">
                                                <p>No pending tasks.</p>
                                                <p className="text-sm">Add one to get started!</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                        <Calendar className="text-indigo-500" /> Daily Plan
                                    </h2>
                                    <button
                                        onClick={handleGenerateSchedule}
                                        disabled={loading}
                                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors disabled:opacity-50"
                                        title="Regenerate today's schedule"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                                        Refresh Schedule
                                    </button>
                                </div>

                                <div className="relative space-y-0">
                                    {schedule.length > 0 && (
                                        <div className="absolute left-[4.5rem] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-600 hidden md:block"></div>
                                    )}

                                    {schedule.map((item, idx) => {
                                        const isCompleted = completedScheduleItems.has(idx);
                                        return (
                                            <div key={idx} className="relative flex flex-col md:flex-row gap-6 group">
                                                <div className="md:w-16 text-right pt-4">
                                                    <span className={`text-sm font-mono font-bold transition-all ${isCompleted ? 'text-gray-300 dark:text-gray-600 line-through' : 'text-gray-500 dark:text-gray-400'
                                                        }`}>{item.start}</span>
                                                </div>

                                                <div className={`absolute left-[4.2rem] top-5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 shadow hidden md:block z-10 transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                                                    }`}></div>

                                                <div className="flex-1 mb-6">
                                                    <div className={`bg-gradient-to-br p-5 rounded-xl border shadow-sm hover:shadow-md transition-all ${isCompleted
                                                        ? 'from-emerald-50 to-white dark:from-emerald-900 dark:to-gray-800 border-emerald-100 dark:border-emerald-800 opacity-60'
                                                        : 'from-indigo-50 to-white dark:from-indigo-900 dark:to-gray-800 border-indigo-100 dark:border-indigo-800'
                                                        }`}>
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex items-start gap-3 flex-1">
                                                                {/* Checkbox */}
                                                                <button
                                                                    onClick={() => handleToggleScheduleItem(idx)}
                                                                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${isCompleted
                                                                        ? 'bg-emerald-500 border-emerald-500'
                                                                        : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500'
                                                                        }`}
                                                                    title={isCompleted ? 'Mark as not done' : 'Mark as done'}
                                                                >
                                                                    {isCompleted && (
                                                                        <CheckCircle className="text-white" size={18} />
                                                                    )}
                                                                </button>

                                                                <div className="flex-1">
                                                                    <h3 className={`text-lg font-bold transition-all ${isCompleted
                                                                        ? 'text-gray-400 dark:text-gray-500 line-through'
                                                                        : 'text-gray-800 dark:text-gray-100'
                                                                        }`}>{item.title}</h3>
                                                                    <p className={`text-sm font-medium mt-1 flex items-center gap-1 transition-all ${isCompleted
                                                                        ? 'text-gray-400 dark:text-gray-600'
                                                                        : 'text-indigo-600 dark:text-indigo-400'
                                                                        }`}>
                                                                        <Clock size={14} /> {item.duration} minutes
                                                                    </p>
                                                                    {item.session_info && item.session_info.is_multi_session && (
                                                                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                                                            Session {item.session_info.session_num} of {item.session_info.total_sessions}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={`text-right text-xs transition-all ${isCompleted ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'
                                                                }`}>
                                                                Ends at {item.end}
                                                            </div>
                                                        </div>
                                                        {isCompleted && (
                                                            <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                    <CheckCircle size={12} /> Task completed! +10 points
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {schedule.length === 0 && !loading && (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                            <Calendar size={48} className="mb-4 text-gray-200 dark:text-gray-600" />
                                            <p className="text-lg">Your schedule is empty.</p>
                                            <p className="text-sm">Add tasks and click Auto-Schedule to plan your day.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showAddModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Add New Task</h2>
                            <form onSubmit={handleAddTask} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title</label>
                                    <input
                                        placeholder="e.g., History Essay"
                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                        <select
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newTask.category}
                                            onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                                        >
                                            <option value="writing">Writing</option>
                                            <option value="reading">Reading</option>
                                            <option value="problem_solving">Problems</option>
                                            <option value="project">Project</option>
                                            <option value="revision">Revision</option>
                                            <option value="presentation">Presentation</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                        <select
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newTask.priority}
                                            onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Complexity</label>
                                    <select
                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newTask.complexity}
                                        onChange={e => setNewTask({ ...newTask, complexity: e.target.value })}
                                    >
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                </div>

                                {/* Conditional Inputs based on Category */}
                                {newTask.category === 'reading' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Pages</label>
                                        <input
                                            type="number"
                                            placeholder="e.g., 20"
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newTask.num_pages}
                                            onChange={e => setNewTask({ ...newTask, num_pages: e.target.value })}
                                        />
                                    </div>
                                )}

                                {(newTask.category === 'problem_solving' || newTask.category === 'revision') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Questions</label>
                                        <input
                                            type="number"
                                            placeholder="e.g., 10"
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newTask.num_questions}
                                            onChange={e => setNewTask({ ...newTask, num_questions: e.target.value })}
                                        />
                                    </div>
                                )}

                                {newTask.category === 'presentation' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Slides</label>
                                        <input
                                            type="number"
                                            placeholder="e.g., 15"
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newTask.num_slides}
                                            onChange={e => setNewTask({ ...newTask, num_slides: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <Clock size={16} className="inline mr-1" />
                                        Manual Time Estimate (min) <span className="text-gray-400 text-xs">(Optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 45"
                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newTask.manual_time || ''}
                                        onChange={e => setNewTask({ ...newTask, manual_time: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <CalendarClock size={16} className="inline mr-1" />
                                        Deadline
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newTask.deadline}
                                        onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Database Viewer Modal */}
                {showDatabaseViewer && (
                    <DatabaseViewer onClose={() => setShowDatabaseViewer(false)} />
                )}

                {/* Task Completion Modal */}
                <TaskCompletionModal
                    isOpen={completionModal.isOpen}
                    onClose={() => setCompletionModal({ ...completionModal, isOpen: false })}
                    onSubmit={handleModalSubmit}
                    taskTitle={completionModal.taskTitle}
                    estimatedTime={completionModal.estimatedTime}
                />
            </div>
        </div>
    );
};

export default Dashboard;


