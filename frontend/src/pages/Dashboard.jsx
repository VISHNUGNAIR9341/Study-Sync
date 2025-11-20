import React, { useState, useEffect } from 'react';
import { fetchTasks, createTask, generateSchedule, updateTaskStatus, deleteTask, fetchUser } from '../api';
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

const Dashboard = ({ userId }) => {
    const [tasks, setTasks] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [activeTab, setActiveTab] = useState('tasks');
    const [showDatabaseViewer, setShowDatabaseViewer] = useState(false);
    const [userStats, setUserStats] = useState({ points: 0, streak: 0 });
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [newTask, setNewTask] = useState({
        title: '', category: 'writing', estimated_size: 1, default_expected_time: 30, priority: 'Medium', deadline: ''
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

    const handleAddTask = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createTask({ ...newTask, user_id: userId });
            setShowAddModal(false);
            setNewTask({ title: '', category: 'writing', estimated_size: 1, default_expected_time: 30, priority: 'Medium', deadline: '' });
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

    const handleCompleteTask = async (taskId) => {
        setLoading(true);
        try {
            await updateTaskStatus(taskId, 'Completed');
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
        } catch (err) {
            setError("Failed to generate schedule.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div className="relative">
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-pulse">
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
                            <Flame className="text-white animate-bounce" size={22} />
                            <span className="font-black text-white">{userStats.streak} day streak</span>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-110 font-bold"
                        >
                            <Plus size={22} className="animate-spin" /> New Task
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
                        <SmartReminders tasks={tasks} userStats={userStats} />
                        <BackupManager />

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
                                                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{task.title}</h3>
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
                                                                Due: {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        )}
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
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                                        Auto-Schedule
                                    </button>
                                </div>

                                <div className="relative space-y-0">
                                    {schedule.length > 0 && (
                                        <div className="absolute left-[4.5rem] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-600 hidden md:block"></div>
                                    )}

                                    {schedule.map((item, idx) => (
                                        <div key={idx} className="relative flex flex-col md:flex-row gap-6 group">
                                            <div className="md:w-16 text-right pt-4">
                                                <span className="text-sm font-mono font-bold text-gray-500 dark:text-gray-400">{item.start}</span>
                                            </div>

                                            <div className="absolute left-[4.2rem] top-5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-gray-800 shadow hidden md:block z-10"></div>

                                            <div className="flex-1 mb-6">
                                                <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900 dark:to-gray-800 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{item.title}</h3>
                                                            <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-1 flex items-center gap-1">
                                                                <Clock size={14} /> {item.duration} minutes
                                                            </p>
                                                        </div>
                                                        <div className="text-right text-xs text-gray-400">
                                                            Ends at {item.end}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

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
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all">
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <CalendarClock size={16} className="inline mr-1" />
                                        Deadline (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newTask.deadline}
                                        onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
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
            </div>
        </div>
    );
};

export default Dashboard;


