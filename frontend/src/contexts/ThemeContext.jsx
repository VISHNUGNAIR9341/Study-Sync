import React, { createContext, useContext, useState, useEffect } from 'react';
import storageManager from '../utils/storageManager';

const ThemeContext = createContext();

// Pre-built theme presets
export const themePresets = {
    default: {
        name: 'Default',
        colors: {
            primary: '#94a3b8',   /* Slate 400 - Soft Neutral Blue-Grey */
            secondary: '#cbd5e1', /* Slate 300 */
            accent: '#e2e8f0',    /* Slate 200 */
            background: '#f8fafc',/* Slate 50 */
            surface: '#ffffff',
            text: '#475569',      /* Slate 600 - Soft Text */
            textSecondary: '#94a3b8'
        }
    },
    ocean: {
        name: 'Ocean',
        colors: {
            primary: '#0ea5e9',
            secondary: '#06b6d4',
            accent: '#3b82f6',
            background: '#f0f9ff',
            surface: '#e0f2fe',
            text: '#0c4a6e',
            textSecondary: '#075985'
        }
    },
    forest: {
        name: 'Forest',
        colors: {
            primary: '#10b981',
            secondary: '#059669',
            accent: '#34d399',
            background: '#f0fdf4',
            surface: '#dcfce7',
            text: '#064e3b',
            textSecondary: '#065f46'
        }
    },
    sunset: {
        name: 'Sunset',
        colors: {
            primary: '#f97316',
            secondary: '#fb923c',
            accent: '#fbbf24',
            background: '#fff7ed',
            surface: '#ffedd5',
            text: '#7c2d12',
            textSecondary: '#9a3412'
        }
    },
    neon: {
        name: 'Neon',
        colors: {
            primary: '#a855f7',
            secondary: '#d946ef',
            accent: '#f0abfc',
            background: '#1f2937',
            surface: '#374151',
            text: '#f9fafb',
            textSecondary: '#d1d5db'
        }
    },
    pastel: {
        name: 'Pastel',
        colors: {
            primary: '#c084fc',
            secondary: '#f0abfc',
            accent: '#fbcfe8',
            background: '#faf5ff',
            surface: '#f3e8ff',
            text: '#581c87',
            textSecondary: '#7e22ce'
        }
    },
    midnight: {
        name: 'Midnight',
        colors: {
            primary: '#3b82f6',
            secondary: '#6366f1',
            accent: '#8b5cf6',
            background: '#0f172a',
            surface: '#1e293b',
            text: '#f1f5f9',
            textSecondary: '#cbd5e1'
        }
    },
    rose: {
        name: 'Rose',
        colors: {
            primary: '#f43f5e',
            secondary: '#fb7185',
            accent: '#fda4af',
            background: '#fff1f2',
            surface: '#ffe4e6',
            text: '#881337',
            textSecondary: '#9f1239'
        }
    },
    emerald: {
        name: 'Emerald',
        colors: {
            primary: '#10b981',
            secondary: '#34d399',
            accent: '#6ee7b7',
            background: '#ecfdf5',
            surface: '#d1fae5',
            text: '#064e3b',
            textSecondary: '#065f46'
        }
    },
    amber: {
        name: 'Amber',
        colors: {
            primary: '#f59e0b',
            secondary: '#fbbf24',
            accent: '#fcd34d',
            background: '#fffbeb',
            surface: '#fef3c7',
            text: '#78350f',
            textSecondary: '#92400e'
        }
    }
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState('default');
    const [customThemes, setCustomThemes] = useState({});
    const [fontSize, setFontSize] = useState('medium');
    const [fontFamily, setFontFamily] = useState('inter');
    const [layoutDensity, setLayoutDensity] = useState('normal');

    // Load theme settings from localStorage on mount
    useEffect(() => {
        const savedTheme = storageManager.get('currentTheme', 'default');
        const savedCustomThemes = storageManager.get('customThemes', {});
        const savedFontSize = storageManager.get('fontSize', 'medium');
        const savedFontFamily = storageManager.get('fontFamily', 'inter');
        const savedLayoutDensity = storageManager.get('layoutDensity', 'normal');

        setCurrentTheme(savedTheme);
        setCustomThemes(savedCustomThemes);
        setFontSize(savedFontSize);
        setFontFamily(savedFontFamily);
        setLayoutDensity(savedLayoutDensity);
    }, []);

    // Apply theme to document
    useEffect(() => {
        const theme = customThemes[currentTheme] || themePresets[currentTheme] || themePresets.default;
        const root = document.documentElement;

        // Apply color variables
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });

        // Apply font size
        const fontSizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        root.style.setProperty('--base-font-size', fontSizes[fontSize] || fontSizes.medium);

        // Apply font family
        const fontFamilies = {
            inter: "'Inter', sans-serif",
            roboto: "'Roboto', sans-serif",
            outfit: "'Outfit', sans-serif",
            system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        };
        root.style.setProperty('--font-family', fontFamilies[fontFamily] || fontFamilies.inter);

        // Apply layout density
        const densities = {
            compact: '0.75',
            normal: '1',
            spacious: '1.25'
        };
        root.style.setProperty('--layout-density', densities[layoutDensity] || densities.normal);
    }, [currentTheme, customThemes, fontSize, fontFamily, layoutDensity]);

    const changeTheme = (themeName) => {
        setCurrentTheme(themeName);
        storageManager.set('currentTheme', themeName);
    };

    const saveCustomTheme = (name, colors) => {
        const newCustomThemes = {
            ...customThemes,
            [name]: { name, colors }
        };
        setCustomThemes(newCustomThemes);
        storageManager.set('customThemes', newCustomThemes);
    };

    const deleteCustomTheme = (name) => {
        const newCustomThemes = { ...customThemes };
        delete newCustomThemes[name];
        setCustomThemes(newCustomThemes);
        storageManager.set('customThemes', newCustomThemes);

        // If deleted theme was active, switch to default
        if (currentTheme === name) {
            changeTheme('default');
        }
    };

    const updateFontSize = (size) => {
        setFontSize(size);
        storageManager.set('fontSize', size);
    };

    const updateFontFamily = (family) => {
        setFontFamily(family);
        storageManager.set('fontFamily', family);
    };

    const updateLayoutDensity = (density) => {
        setLayoutDensity(density);
        storageManager.set('layoutDensity', density);
    };

    const getAllThemes = () => {
        return {
            ...themePresets,
            ...customThemes
        };
    };

    const getCurrentThemeColors = () => {
        const theme = customThemes[currentTheme] || themePresets[currentTheme] || themePresets.default;
        return theme.colors;
    };

    const value = {
        currentTheme,
        changeTheme,
        saveCustomTheme,
        deleteCustomTheme,
        getAllThemes,
        getCurrentThemeColors,
        fontSize,
        updateFontSize,
        fontFamily,
        updateFontFamily,
        layoutDensity,
        updateLayoutDensity,
        themePresets,
        customThemes
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
