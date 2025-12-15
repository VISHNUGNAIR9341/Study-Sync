import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

const PomodoroTimer = () => {
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'

    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        setIsActive(false);
                        // Play sound or notification here
                        // alert("Time's up!");
                    } else {
                        setMinutes(minutes - 1);
                        setSeconds(59);
                    }
                } else {
                    setSeconds(seconds - 1);
                }
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, minutes, seconds]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'focus') setMinutes(25);
        else if (mode === 'shortBreak') setMinutes(5);
        else setMinutes(15);
        setSeconds(0);
    };

    const changeMode = (newMode) => {
        setMode(newMode);
        setIsActive(false);
        setSeconds(0);
        if (newMode === 'focus') setMinutes(25);
        else if (newMode === 'shortBreak') setMinutes(5);
        else setMinutes(15);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
                <Timer className="text-indigo-500" /> Focus Timer
            </h2>

            <div className="flex justify-center gap-2 mb-6">
                <button
                    onClick={() => changeMode('focus')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === 'focus' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Focus
                </button>
                <button
                    onClick={() => changeMode('shortBreak')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === 'shortBreak' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Short Break
                </button>
                <button
                    onClick={() => changeMode('longBreak')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === 'longBreak' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Long Break
                </button>
            </div>

            <div className="text-center mb-8">
                <div className="text-6xl font-mono font-bold text-slate-800 tracking-wider">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <p className="text-gray-400 text-sm mt-2">
                    {isActive ? 'Stay focused!' : 'Ready to start?'}
                </p>
            </div>

            <div className="flex justify-center gap-4">
                <button
                    onClick={toggleTimer}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-200 text-indigo-900 rounded-xl hover:bg-indigo-300 transition-all shadow-sm hover:shadow-md active:scale-95 font-semibold"
                >
                    {isActive ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start</>}
                </button>
                <button
                    onClick={resetTimer}
                    className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                    title="Reset"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
        </div>
    );
};

export default PomodoroTimer;
