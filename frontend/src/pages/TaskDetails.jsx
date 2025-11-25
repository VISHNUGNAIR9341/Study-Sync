import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTaskDetails, generateSchedule, fetchTasks } from '../api';
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, BookOpen, Layers, List, Zap } from 'lucide-react';

const TaskDetails = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [dailyPlan, setDailyPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Task Details
                const taskData = await fetchTaskDetails(taskId);
                setTask(taskData);

                // 2. Fetch Daily Schedule (Today/Tomorrow)
                // Note: generateSchedule currently returns today's schedule for ALL tasks
                // We can use this to show "Today's Plan"
                if (taskData && taskData.user_id) {
                    const scheduleData = await generateSchedule(taskData.user_id);
                    setDailyPlan(scheduleData || []);
                }

                // 3. Generate "Task Schedule till Deadline"
                // This is a client-side simulation for now as we don't have a long-term scheduler API yet
                if (taskData) {
                    generateLongTermPlan(taskData);
                }

            } catch (err) {
                console.error("Error loading task details:", err);
                setError("Failed to load task details.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [taskId]);

    const generateLongTermPlan = (task) => {
        // Simple logic to distribute work
        // Assume we can work 2 hours a day on this task
        const totalMinutes = task.manual_time || task.ml_predicted_time || task.default_expected_time || 60;
        const deadline = task.deadline ? new Date(task.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
        const now = new Date();

        const daysUntilDeadline = Math.max(1, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
        const minutesPerDay = Math.ceil(totalMinutes / daysUntilDeadline);

        const plan = [];
        let remainingMinutes = totalMinutes;

        for (let i = 0; i < daysUntilDeadline; i++) {
            if (remainingMinutes <= 0) break;

            const date = new Date();
            date.setDate(date.getDate() + i);

            const sessionDuration = Math.min(remainingMinutes, minutesPerDay); // Cap at calculated daily need

            plan.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                duration: sessionDuration,
                focus: `Part ${i + 1}: ${Math.round((sessionDuration / totalMinutes) * 100)}% of task`
            });

            remainingMinutes -= sessionDuration;
        }
        setSchedule(plan);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-red-500">{error}</div>;
    if (!task) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>

                {/* Task Header Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                    task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {task.priority} Priority
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                                    {task.category}
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{task.title}</h1>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                    <Clock className="text-indigo-500" size={18} />
                                    <span>{task.ml_predicted_time} min estimated</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="text-indigo-500" size={18} />
                                    <span>Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Layers className="text-indigo-500" size={18} />
                                    <span>Complexity: {task.complexity || 'Medium'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="text-indigo-500" size={18} />
                                    <span>
                                        {task.num_pages ? `${task.num_pages} Pages` :
                                            task.num_slides ? `${task.num_slides} Slides` :
                                                task.num_questions ? `${task.num_questions} Questions` : 'Standard Task'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:block">
                            <div className="w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-gray-700 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-indigo-600 dark:text-indigo-400">{task.progress || 0}%</span>
                                    <span className="text-xs text-gray-500">Done</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Task Specific Schedule */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Zap className="text-yellow-500" /> Action Plan
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Here is your recommended schedule to complete <strong>{task.title}</strong> by the deadline.
                            </p>

                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {schedule.map((day, idx) => (
                                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        {/* Icon */}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-indigo-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                            <Calendar size={16} />
                                        </div>

                                        {/* Card */}
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-700 p-4 rounded-xl border border-slate-200 dark:border-gray-600 shadow-sm">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-slate-900 dark:text-white">{day.date}</div>
                                                <time className="font-caveat font-medium text-indigo-500">{day.duration} min</time>
                                            </div>
                                            <div className="text-slate-500 dark:text-gray-300 text-sm">{day.focus}</div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-3">
                                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(day.duration / (task.manual_time || task.ml_predicted_time || 60)) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Daily Overview */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <List className="text-green-500" /> Today's Overview
                            </h2>

                            {dailyPlan.length > 0 ? (
                                <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6 pl-6 py-2">
                                    {dailyPlan.map((item, idx) => (
                                        <div key={idx} className="relative">
                                            <div className={`absolute -left-[1.6rem] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${item.title === task.title ? 'bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900' : 'bg-gray-300 dark:bg-gray-600'
                                                }`}></div>
                                            <p className="text-xs text-gray-500 font-mono mb-1">{item.start} - {item.end}</p>
                                            <h4 className={`font-semibold ${item.title === task.title ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {item.title}
                                            </h4>
                                            <p className="text-xs text-gray-500">{item.duration} min</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No schedule generated for today yet.</p>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                            <h3 className="font-bold text-lg mb-2">Study Tip</h3>
                            <p className="text-indigo-100 text-sm">
                                Breaking down "{task.title}" into {schedule.length} smaller sessions will improve retention by 40% compared to doing it all at once!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;
