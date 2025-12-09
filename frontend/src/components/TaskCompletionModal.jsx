import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock } from 'lucide-react';

const TaskCompletionModal = ({ isOpen, onClose, onSubmit, taskTitle, estimatedTime }) => {
    const [actualTime, setActualTime] = useState(estimatedTime || 30);

    useEffect(() => {
        if (isOpen) {
            setActualTime(estimatedTime || 30);
        }
    }, [isOpen, estimatedTime]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(parseInt(actualTime));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                        <CheckCircle size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Task Completed!</h2>
                    <p className="text-emerald-100 mt-1 truncate px-4">{taskTitle}</p>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                        Great job! To help our AI learn your speed, how long did this task actually take?
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Actual Duration (minutes)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Clock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    value={actualTime}
                                    onChange={(e) => setActualTime(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-right">
                                Estimated: {estimatedTime} min
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:-translate-y-0.5 transition-all"
                            >
                                Confirm & Finish
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TaskCompletionModal;
