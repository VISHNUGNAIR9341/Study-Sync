import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Trash2, Clock, AlertCircle } from 'lucide-react';

const ExamMode = () => {
    const [exams, setExams] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newExam, setNewExam] = useState({ subject: '', date: '', time: '', weightage: 'High' });

    useEffect(() => {
        const saved = localStorage.getItem('studysync_exams');
        if (saved) setExams(JSON.parse(saved));
    }, []);

    const saveExams = (updatedExams) => {
        setExams(updatedExams);
        localStorage.setItem('studysync_exams', JSON.stringify(updatedExams));
    };

    const addExam = (e) => {
        e.preventDefault();
        const exam = {
            id: Date.now(),
            ...newExam,
            createdAt: new Date().toISOString()
        };
        saveExams([...exams, exam].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setNewExam({ subject: '', date: '', time: '', weightage: 'High' });
        setShowAddForm(false);
    };

    const deleteExam = (examId) => {
        saveExams(exams.filter(e => e.id !== examId));
    };

    const getDaysUntil = (examDate) => {
        const today = new Date();
        const exam = new Date(examDate);
        const diffTime = exam - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getUrgencyColor = (days) => {
        if (days < 0) return 'bg-slate-100 text-slate-600';
        if (days <= 3) return 'bg-rose-200 text-rose-900';
        if (days <= 7) return 'bg-amber-200 text-amber-900';
        return 'bg-sky-200 text-sky-900';
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                    <GraduationCap className="text-sky-500" /> Exam Countdown
                </h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 bg-sky-200 text-sky-900 px-4 py-2 rounded-lg hover:bg-sky-300 transition-all font-medium"
                >
                    <Plus size={18} /> Add Exam
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={addExam} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newExam.subject}
                                onChange={e => setNewExam({ ...newExam, subject: e.target.value })}
                                placeholder="e.g., Mathematics"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weightage</label>
                            <select
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newExam.weightage}
                                onChange={e => setNewExam({ ...newExam, weightage: e.target.value })}
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newExam.date}
                                onChange={e => setNewExam({ ...newExam, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                                type="time"
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newExam.time}
                                onChange={e => setNewExam({ ...newExam, time: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Exam</button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {exams.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">
                        <p>No upcoming exams. Add one to start your countdown!</p>
                    </div>
                ) : (
                    exams.map(exam => {
                        const daysUntil = getDaysUntil(exam.date);
                        const urgencyColor = getUrgencyColor(daysUntil);
                        return (
                            <div key={exam.id} className="flex items-center justify-between p-4 rounded-xl border hover:shadow-md transition-all bg-white">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-bold text-gray-800">{exam.subject}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${exam.weightage === 'Critical' ? 'bg-red-100 text-red-700' :
                                            exam.weightage === 'High' ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {exam.weightage}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Clock size={14} />
                                        {new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        {exam.time && ` at ${exam.time}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`px-6 py-3 rounded-xl ${urgencyColor} font-black text-center min-w-[100px]`}>
                                        {daysUntil < 0 ? (
                                            <div>
                                                <div className="text-2xl">PAST</div>
                                            </div>
                                        ) : daysUntil === 0 ? (
                                            <div>
                                                <div className="text-2xl">TODAY!</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-3xl">{daysUntil}</div>
                                                <div className="text-xs">days</div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteExam(exam.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ExamMode;
