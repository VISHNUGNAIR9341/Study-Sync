import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, TrendingUp, Award, Search, Filter, Trash2 } from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';
import { fetchTaskHistory as apiFetchTaskHistory, fetchUser, deleteTaskFromHistory } from '../api';

const UserProfile = ({ userId, tasks }) => {
    const [taskHistory, setTaskHistory] = useState([]);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [historyData, userData] = await Promise.all([
                apiFetchTaskHistory(userId),
                fetchUser(userId)
            ]);
            setTaskHistory(historyData || []);
            setUser(userData);
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [userId]);

    const handleDeleteTask = async (taskId) => {
        try {
            await deleteTaskFromHistory(taskId);
            await loadData(); // Refresh the task history
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    // Calculate user statistics
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    const totalStudyTime = completedTasks.reduce((sum, t) => sum + (t.ml_predicted_time || t.default_expected_time || 30), 0);
    const avgTaskTime = completedTasks.length > 0 ? Math.round(totalStudyTime / completedTasks.length) : 0;

    // Filter task history
    const filteredHistory = taskHistory.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', 'writing', 'reading', 'problem_solving', 'project', 'revision', 'assignment', 'lab_work', 'presentation'];

    return (
        <div className="space-y-6">
            {/* User Details Card */}
            {user && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 flex items-center gap-6">
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-bold shadow-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : <User />}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{user.name}</h2>
                        <div className="flex items-center gap-4 mt-2 text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                                <User size={14} /> ID: {user.student_id}
                            </span>
                            <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-medium">
                                <Award size={14} /> {user.points} Points
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* User Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="text-blue-600 dark:text-blue-400" size={20} />
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Completed</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{completedTasks.length}</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-purple-600 dark:text-purple-400" size={20} />
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Study Time</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{Math.round(totalStudyTime / 60)}h</p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={20} />
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Avg Task Time</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{avgTaskTime}m</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="text-amber-600 dark:text-amber-400" size={20} />
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">This Week</p>
                    </div>
                    <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                        {completedTasks.filter(t => {
                            const completedDate = new Date(t.updated_at || t.created_at);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return completedDate >= weekAgo;
                        }).length}
                    </p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Task History Timeline (2/3 width) */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                    <User className="text-indigo-600 dark:text-indigo-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100">Task History</h2>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">Your completed tasks</p>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter */}
                        <div className="flex gap-3 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat === 'all' ? 'All Categories' : cat.replace('_', ' ').charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Task History List */}
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="text-center py-10 text-gray-400">Loading history...</div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed">
                                    <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>No task history found</p>
                                    <p className="text-sm">Complete some tasks to see them here!</p>
                                </div>
                            ) : (
                                filteredHistory.map((task, index) => (
                                    <div
                                        key={task.id || index}
                                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{task.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${task.priority === 'Urgent' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' :
                                                    task.priority === 'High' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200' :
                                                        'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                                                    title="Delete task"
                                                >
                                                    <Trash2 size={16} className="text-red-500 dark:text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="capitalize">{task.category?.replace('_', ' ')}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {task.completed_at ? new Date(task.completed_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                }) : 'N/A'}
                                            </span>
                                            <span>•</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.status === 'Completed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' :
                                                'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                                                }`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Compact Analytics (1/3 width) */}
                <div className="lg:col-span-1">
                    <AnalyticsDashboard tasks={tasks} userId={userId} compact={true} />
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
