import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = () => {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('studysync_darkmode');
        if (saved === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('studysync_darkmode', newMode.toString());

        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full hover:shadow-lg transition-all"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {darkMode ? (
                <>
                    <Sun size={20} className="text-yellow-400" />
                    <span className="text-sm font-medium text-gray-200">Light</span>
                </>
            ) : (
                <>
                    <Moon size={20} className="text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Dark</span>
                </>
            )}
        </button>
    );
};

export default DarkModeToggle;
