// Notification manager for browser notifications

class NotificationManager {
    constructor() {
        this.permission = Notification.permission;
        this.scheduledNotifications = new Map();
    }

    // Request notification permission
    async requestPermission() {
        try {
            if (!('Notification' in window)) {
                console.warn('This browser does not support notifications');
                return false;
            }

            if (this.permission === 'granted') {
                return true;
            }

            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    // Show immediate notification
    show(title, options = {}) {
        if (this.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }

        try {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options
            });

            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000);

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }

    // Schedule a notification
    schedule(id, title, options = {}, delayMs = 0) {
        // Cancel existing notification with same ID
        this.cancel(id);

        const timeoutId = setTimeout(() => {
            this.show(title, options);
            this.scheduledNotifications.delete(id);
        }, delayMs);

        this.scheduledNotifications.set(id, timeoutId);
        return id;
    }

    // Cancel scheduled notification
    cancel(id) {
        if (this.scheduledNotifications.has(id)) {
            clearTimeout(this.scheduledNotifications.get(id));
            this.scheduledNotifications.delete(id);
            return true;
        }
        return false;
    }

    // Cancel all scheduled notifications
    cancelAll() {
        this.scheduledNotifications.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        this.scheduledNotifications.clear();
    }

    // Notification templates
    templates = {
        taskDeadline: (taskTitle, timeUntil) => ({
            title: 'Task Deadline Reminder',
            options: {
                body: `"${taskTitle}" is due ${timeUntil}!`,
                tag: 'task-deadline',
                requireInteraction: true
            }
        }),

        studySession: (sessionType) => ({
            title: 'Time to Study!',
            options: {
                body: `Your ${sessionType} session is starting now.`,
                tag: 'study-session',
                requireInteraction: false
            }
        }),

        breakTime: (duration) => ({
            title: 'Break Time!',
            options: {
                body: `Take a ${duration} minute break. You've earned it!`,
                tag: 'break-time',
                requireInteraction: false
            }
        }),

        streakReminder: (streak) => ({
            title: 'Keep Your Streak!',
            options: {
                body: `You're on a ${streak} day streak! Complete a task today to keep it going.`,
                tag: 'streak-reminder',
                requireInteraction: false
            }
        }),

        achievement: (achievementName) => ({
            title: 'Achievement Unlocked!',
            options: {
                body: `You earned: ${achievementName}`,
                tag: 'achievement',
                requireInteraction: false
            }
        }),

        dailySummary: (tasksCompleted, studyTime) => ({
            title: 'Daily Summary',
            options: {
                body: `Today: ${tasksCompleted} tasks completed, ${studyTime} minutes studied.`,
                tag: 'daily-summary',
                requireInteraction: false
            }
        }),

        wellness: (message) => ({
            title: 'Wellness Reminder',
            options: {
                body: message,
                tag: 'wellness',
                requireInteraction: false
            }
        })
    };

    // Schedule task deadline reminders
    scheduleTaskReminders(task) {
        if (!task.deadline) return;

        const deadline = new Date(task.deadline);
        const now = new Date();
        const timeUntilDeadline = deadline - now;

        // Schedule reminders at different intervals
        const intervals = [
            { time: 24 * 60 * 60 * 1000, label: 'in 1 day' }, // 1 day before
            { time: 60 * 60 * 1000, label: 'in 1 hour' },     // 1 hour before
            { time: 15 * 60 * 1000, label: 'in 15 minutes' }  // 15 min before
        ];

        intervals.forEach(({ time, label }) => {
            const delayMs = timeUntilDeadline - time;
            if (delayMs > 0) {
                const { title, options } = this.templates.taskDeadline(task.title, label);
                this.schedule(`task-${task.id}-${time}`, title, options, delayMs);
            }
        });
    }

    // Cancel task reminders
    cancelTaskReminders(taskId) {
        const intervals = [24 * 60 * 60 * 1000, 60 * 60 * 1000, 15 * 60 * 1000];
        intervals.forEach(time => {
            this.cancel(`task-${taskId}-${time}`);
        });
    }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
export default notificationManager;
