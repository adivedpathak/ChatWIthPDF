import React from 'react';
import { DarkModeSwitch } from 'react-toggle-dark-mode';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
    const [isDarkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : 
               window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
        if (isDarkMode) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    const toggleDarkMode = (checked) => {
        setDarkMode(checked);
    };

    return (
        <div className="theme-toggle">
            <DarkModeSwitch
                checked={isDarkMode}
                onChange={toggleDarkMode}
                size={30}
                moonColor="#f9fafb"
                sunColor="#1f2937"
            />
        </div>
    );
};

export default ThemeToggle; 