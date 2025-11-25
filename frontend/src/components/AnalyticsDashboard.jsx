import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { TrendingUp, Calendar, Clock, Target, Award, Zap } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AnalyticsDashboard = ({ tasks = [], userId, compact = false }) => {
    const [timeRange, setTimeRange] = useState('week'); // week, month, all
    const [analyticsData, setAnalyticsData] = useState({
        studyTime: { labels: [], datasets: [] },
        categoryDistribution: { labels: [], datasets: [] },
        completionRate: { labels: [], datasets: [] },
        productivityHeatmap: { labels: [], datasets: [] },
        bestHours: []
    });

    useEffect(() => {
        calculateAnalytics();
    }, [tasks, timeRange]);

    const calculateAnalytics = () => {
        // Get completed tasks within time range
        const now = new Date();
        const filteredTasks = tasks.filter(task => {
            if (task.status !== 'Completed') return false;

            const completedDate = new Date(task.updated_at || task.created_at);
            const daysDiff = Math.floor((now - completedDate) / (1000 * 60 * 60 * 24));

            if (timeRange === 'week') return daysDiff <= 7;
            if (timeRange === 'month') return daysDiff <= 30;
            return true; // all time
        });

        // Calculate study time by day
        const studyTimeByDay = {};
        const daysToShow = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;

        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            studyTimeByDay[dateKey] = 0;
        }

        filteredTasks.forEach(task => {
            const completedDate = new Date(task.updated_at || task.created_at);
            const dateKey = completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (studyTimeByDay.hasOwnProperty(dateKey)) {
                studyTimeByDay[dateKey] += task.ml_predicted_time || task.default_expected_time || 30;
            }
        });

        const studyTimeData = {
            labels: Object.keys(studyTimeByDay),
            datasets: [{
                label: 'Study Time (minutes)',
                data: Object.values(studyTimeByDay),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        };

        // Calculate category distribution
        const categoryCount = {};
        filteredTasks.forEach(task => {
            const category = task.category || 'other';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });

        const categoryData = {
            labels: Object.keys(categoryCount).map(cat =>
                cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')
            ),
            datasets: [{
                data: Object.values(categoryCount),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        // Calculate completion rate over time
        const completionByWeek = {};
        const allTasksByWeek = {};

        tasks.forEach(task => {
            const taskDate = new Date(task.created_at);
            const weekKey = getWeekKey(taskDate);
            allTasksByWeek[weekKey] = (allTasksByWeek[weekKey] || 0) + 1;

            if (task.status === 'Completed') {
                completionByWeek[weekKey] = (completionByWeek[weekKey] || 0) + 1;
            }
        });

        const weeks = Object.keys(allTasksByWeek).sort().slice(-8);
        const completionRateData = {
            labels: weeks,
            datasets: [{
                label: 'Completion Rate (%)',
                data: weeks.map(week =>
                    Math.round((completionByWeek[week] || 0) / allTasksByWeek[week] * 100)
                ),
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: 'rgba(16, 185, 129, 1)'
            }]
        };

        // Calculate productivity heatmap (hour of day)
        const hourlyActivity = Array(24).fill(0);
        filteredTasks.forEach(task => {
            const hour = new Date(task.updated_at || task.created_at).getHours();
            hourlyActivity[hour]++;
        });

        const heatmapData = {
            labels: hourlyActivity.map((_, hour) => `${hour}:00`),
            datasets: [{
                label: 'Tasks Completed',
                data: hourlyActivity,
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderColor: 'rgba(245, 158, 11, 1)',
                borderWidth: 2,
                borderRadius: 4
            }]
        };

        // Find best study hours
        const bestHoursData = hourlyActivity
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        setAnalyticsData({
            studyTime: studyTimeData,
            categoryDistribution: categoryData,
            completionRate: completionRateData,
            productivityHeatmap: heatmapData,
            bestHours: bestHoursData
        });
    };

    const getWeekKey = (date) => {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Chart options
    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                padding: 12,
                borderRadius: 8
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(107, 114, 128, 0.1)' },
                ticks: { color: '#6b7280' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#6b7280' }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#6b7280', padding: 15 }
            },
            tooltip: {
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                padding: 12,
                borderRadius: 8
            }
        }
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                padding: 12,
                borderRadius: 8
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(107, 114, 128, 0.1)' },
                ticks: { color: '#6b7280', callback: (value) => value + '%' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#6b7280' }
            }
        }
    };

    // Calculate summary stats
    const totalStudyTime = analyticsData.studyTime.datasets?.[0]?.data?.reduce((sum, val) => sum + val, 0) || 0;
    const avgDailyTime = Math.round(totalStudyTime / (timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90));
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // Compact view for sidebar
    if (compact) {
        return (
            <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <TrendingUp size={16} />
                        Quick Analytics
                    </h3>
                    <div style={{ height: '180px' }}>
                        <Pie data={analyticsData.categoryDistribution} options={pieOptions} />
                    </div>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Category Distribution</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div style={{ height: '150px' }}>
                        <Bar data={analyticsData.completionRate} options={barOptions} />
                    </div>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Completion Rate</p>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs font-medium text-slate-600 dark:text-gray-300 mb-1">Recommendation</p>
                    <p className="text-sm text-gray-800 dark:text-gray-100">
                        {avgDailyTime < 60
                            ? "Try to study at least 1 hour per day!"
                            : avgDailyTime < 120
                                ? "Great consistency! Keep it up."
                                : "Excellent study habits!"}
                    </p>
                </div>
            </div>
        );
    }

    // Full view
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100">Study Analytics</h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400">Track your productivity and progress</p>
                    </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-2">
                    {['week', 'month', 'all'].map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${timeRange === range
                                ? 'bg-indigo-200 text-indigo-900 shadow-sm'
                                : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-blue-600 dark:text-blue-400" size={20} />
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Study Time</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{Math.round(totalStudyTime / 60)}h</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{totalStudyTime} minutes</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="text-purple-600 dark:text-purple-400" size={20} />
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Avg Daily Time</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{avgDailyTime}m</p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">per day</p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-emerald-600 dark:text-emerald-400" size={20} />
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Completion Rate</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{completionRate}%</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">{completedTasks} completed</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="text-amber-600 dark:text-amber-400" size={20} />
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Best Hour</p>
                    </div>
                    <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                        {analyticsData.bestHours[0]?.hour || 0}:00
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Most productive</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Study Time Bar Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Calendar className="text-blue-500" size={20} />
                        Daily Study Time
                    </h3>
                    <div style={{ height: '250px' }}>
                        <Bar data={analyticsData.studyTime} options={barOptions} />
                    </div>
                </div>

                {/* Category Distribution Pie Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Target className="text-purple-500" size={20} />
                        Subject Distribution
                    </h3>
                    <div style={{ height: '250px' }}>
                        <Pie data={analyticsData.categoryDistribution} options={pieOptions} />
                    </div>
                </div>

                {/* Completion Rate Trend */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-green-500" size={20} />
                        Completion Rate Trend
                    </h3>
                    <div style={{ height: '250px' }}>
                        <Line data={analyticsData.completionRate} options={lineOptions} />
                    </div>
                </div>

                {/* Productivity Heatmap */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Zap className="text-orange-500" size={20} />
                        Hourly Productivity
                    </h3>
                    <div style={{ height: '250px' }}>
                        <Bar data={analyticsData.productivityHeatmap} options={barOptions} />
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-4">Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Most Productive Hours</p>
                        <div className="space-y-1">
                            {analyticsData.bestHours.map((hour, index) => (
                                <p key={index} className="text-gray-800 dark:text-gray-100">
                                    {index + 1}. {hour.hour}:00 - {hour.count} tasks completed
                                </p>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Recommendation</p>
                        <p className="text-gray-800 dark:text-gray-100">
                            {avgDailyTime < 60
                                ? "Try to study at least 1 hour per day for better results!"
                                : avgDailyTime < 120
                                    ? "Great consistency! Consider adding 30 more minutes to maximize learning."
                                    : "Excellent study habits! Keep up the great work!"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
