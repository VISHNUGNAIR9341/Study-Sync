import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTaskDetails, generateSchedule, fetchTasks, updateTaskStatus, updateTaskProgress } from '../api';
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, BookOpen, Layers, List, Zap } from 'lucide-react';

const TaskDetails = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [dailyPlan, setDailyPlan] = useState([]);
    const [completedTodayItems, setCompletedTodayItems] = useState(new Set());
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

                    // Load saved completion state from localStorage
                    const savedDate = localStorage.getItem('schedule_date');
                    const today = new Date().toDateString();

                    // Only restore if it's the same day AND we have a valid schedule
                    if (savedDate === today && scheduleData && scheduleData.length > 0) {
                        const savedCompletions = localStorage.getItem('completed_schedule_items');
                        if (savedCompletions) {
                            try {
                                const savedIndices = JSON.parse(savedCompletions);
                                // Only restore indices that are still valid for current schedule
                                const validIndices = savedIndices.filter(idx =>
                                    idx < scheduleData.length && scheduleData[idx] != null
                                );
                                setCompletedTodayItems(new Set(validIndices));
                            } catch (e) {
                                console.error('Error parsing saved completions:', e);
                                setCompletedTodayItems(new Set());
                            }
                        }
                    } else {
                        // Different day or invalid schedule - clear completions
                        setCompletedTodayItems(new Set());
                    }
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
        // Divide task evenly across days until deadline
        const totalMinutes = task.manual_time || task.ml_predicted_time || task.default_expected_time || 60;
        const deadline = task.deadline ? new Date(task.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();

        const daysUntilDeadline = Math.max(1, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));

        // Divide by days - one session per day
        let numSessions;
        if (totalMinutes <= 45) {
            numSessions = 1;
        } else {
            // One session per day until deadline
            numSessions = Math.max(2, daysUntilDeadline);
        }

        const minutesPerSession = Math.floor(totalMinutes / numSessions);
        const remainingMinutes = totalMinutes % numSessions;

        const plan = [];

        for (let i = 0; i < numSessions; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);

            // Distribute remaining minutes to early sessions
            const sessionDuration = minutesPerSession + (i < remainingMinutes ? 1 : 0);

            plan.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                duration: sessionDuration,
                focus: `Part ${i + 1}/${numSessions}: ${Math.round((sessionDuration / totalMinutes) * 100)}% of task`,
                sessionNum: i + 1,
                totalSessions: numSessions
            });
        }

        setSchedule(plan);
    };

    const handleToggleTodayItem = async (index) => {
        const scheduledTask = dailyPlan[index];
        if (!scheduledTask) return;

        setCompletedTodayItems(prev => {
            const newSet = new Set(prev);
            const wasCompleted = newSet.has(index);

            if (wasCompleted) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }

            // Save to localStorage for persistence
            localStorage.setItem('completed_schedule_items', JSON.stringify([...newSet]));
            localStorage.setItem('schedule_date', new Date().toDateString());

            // Always update progress (for both check and uncheck)
            const taskId = scheduledTask.task_id;

            // Find all schedule items for this task IN TODAY'S SCHEDULE
            const taskScheduleItems = dailyPlan
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

            // Update task progress if it's the current task
            if (taskId === task.id) {
                setTask(currentTask => ({
                    ...currentTask,
                    progress: progressPercentage
                }));
            }

            // Always update progress in backend
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
                    if (session_num === total_sessions && taskId === task.id) {
                        // Mark current task as completed
                        // Ask user for actual time for ML training
                        const actualTimeStr = window.prompt("Task Completed! How many minutes did it actually take?", task.manual_time || task.ml_predicted_time || task.default_expected_time);
                        const actualTime = actualTimeStr ? parseInt(actualTimeStr) : null;

                        updateTaskStatus(taskId, 'Completed', actualTime).then(() => {
                            // Reload to show completion
                            window.location.reload();
                        });
                    }
                } else if (allSessionsCompleted && !scheduledTask.session_info && taskId === task.id) {
                    // Single session task - mark as complete
                    // Single session task - mark as complete
                    const actualTimeStr = window.prompt("Task Completed! How many minutes did it actually take?", task.manual_time || task.ml_predicted_time || task.default_expected_time);
                    const actualTime = actualTimeStr ? parseInt(actualTimeStr) : null;

                    updateTaskStatus(taskId, 'Completed', actualTime).then(() => {
                        window.location.reload();
                    });
                }
            }

            return newSet;
        });
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
                                    <span>Due: {task.deadline ? new Date(task.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'No Deadline'}</span>
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
                                {schedule.map((day, idx) => {
                                    // Check if this session is completed
                                    // We use the idx + 1 as session number (Part 1, Part 2, etc.)
                                    const sessionNum = idx + 1;

                                    // Find if this session is in today's plan and is checked
                                    const matchingTodayItem = dailyPlan.findIndex(item =>
                                        item.task_id === task.id &&
                                        item.session_info?.session_num === sessionNum
                                    );

                                    const isCompleted = matchingTodayItem !== -1 && completedTodayItems.has(matchingTodayItem);

                                    return (
                                        <div key={idx} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${isCompleted ? 'is-complete' : 'is-active'}`}>
                                            {/* Icon */}
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-all ${isCompleted
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-300 group-[.is-active]:bg-indigo-500 text-slate-500 group-[.is-active]:text-emerald-50'
                                                }`}>
                                                {isCompleted ? <CheckCircle size={16} /> : <Calendar size={16} />}
                                            </div>

                                            {/* Card */}
                                            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border shadow-sm transition-all ${isCompleted
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                                                : 'bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600'
                                                }`}>
                                                <div className="flex items-center justify-between space-x-2 mb-1">
                                                    <div className={`font-bold ${isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                                                        {day.date}
                                                    </div>
                                                    <time className={`font-caveat font-medium ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-500'}`}>
                                                        {day.duration} min
                                                    </time>
                                                </div>
                                                <div className={`text-sm ${isCompleted ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-500 dark:text-gray-300'}`}>
                                                    {day.focus}
                                                </div>
                                                {isCompleted && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        <CheckCircle size={12} /> Completed!
                                                    </div>
                                                )}
                                                <div className={`w-full rounded-full h-1.5 mt-3 ${isCompleted ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                                    <div className={`h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: isCompleted ? '100%' : `${(day.duration / (task.manual_time || task.ml_predicted_time || 60)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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
                                    {dailyPlan.map((item, idx) => {
                                        const isCompleted = completedTodayItems.has(idx);
                                        const isCurrentTask = item.title.includes(task.title) || item.task_id === taskId;
                                        return (
                                            <div key={idx} className="relative group">
                                                <div className={`absolute -left-[1.6rem] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 transition-all ${isCompleted ? 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900' :
                                                    isCurrentTask ? 'bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900' :
                                                        'bg-gray-300 dark:bg-gray-600'
                                                    }`}></div>

                                                <div className="flex items-start gap-2">
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={() => handleToggleTodayItem(idx)}
                                                        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 shrink-0 ${isCompleted
                                                            ? 'bg-emerald-500 border-emerald-500'
                                                            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500'
                                                            }`}
                                                        title={isCompleted ? 'Mark as not done' : 'Mark as done'}
                                                    >
                                                        {isCompleted && (
                                                            <CheckCircle className="text-white" size={14} />
                                                        )}
                                                    </button>

                                                    <div className="flex-1">
                                                        <p className={`text-xs font-mono mb-1 transition-all ${isCompleted ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-500'
                                                            }`}>{item.start} - {item.end}</p>
                                                        <h4 className={`font-semibold transition-all ${isCompleted ? 'text-gray-400 dark:text-gray-500 line-through' :
                                                            isCurrentTask ? 'text-indigo-600 dark:text-indigo-400' :
                                                                'text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {item.title}
                                                        </h4>
                                                        <p className={`text-xs transition-all ${isCompleted ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500'
                                                            }`}>{item.duration} min</p>
                                                        {item.session_info && item.session_info.is_multi_session && (
                                                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                                                Session {item.session_info.session_num} of {item.session_info.total_sessions}
                                                            </p>
                                                        )}
                                                        {isCompleted && (
                                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                                                <CheckCircle size={10} /> Completed!
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
