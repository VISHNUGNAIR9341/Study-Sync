import React, { useState } from 'react';
import { Palette, Save, Trash2, Eye, Download, Upload } from 'lucide-react';
import { useTheme, themePresets } from '../contexts/ThemeContext';

const ThemeCustomizer = () => {
    const {
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
        customThemes
    } = useTheme();

    const [showCustomizer, setShowCustomizer] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customColors, setCustomColors] = useState(getCurrentThemeColors());

    const handleSaveCustomTheme = () => {
        if (!customName.trim()) {
            return;
        }
        saveCustomTheme(customName, customColors);
        setCustomName('');
        setShowCustomizer(false);
        changeTheme(customName);
    };

    const handleColorChange = (colorKey, value) => {
        setCustomColors({ ...customColors, [colorKey]: value });
    };

    const previewTheme = (themeName) => {
        changeTheme(themeName);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl">
                    <Palette className="text-white" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Theme Customizer</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Personalize your study space</p>
                </div>
            </div>

            {/* Theme Presets */}
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Pre-built Themes</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(themePresets).map(([key, theme]) => (
                        <button
                            key={key}
                            onClick={() => previewTheme(key)}
                            className={`p-3 rounded-xl border-2 transition-all ${currentTheme === key
                                ? 'border-blue-500 shadow-lg scale-105'
                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                                }`}
                        >
                            <div className="flex gap-1 mb-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                            </div>
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-100">{theme.name}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Themes */}
            {Object.keys(customThemes).length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Custom Themes</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {Object.entries(customThemes).map(([key, theme]) => (
                            <div
                                key={key}
                                className={`p-3 rounded-xl border-2 transition-all relative group ${currentTheme === key
                                    ? 'border-purple-500 shadow-lg scale-105'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                                    }`}
                            >
                                <button onClick={() => previewTheme(key)} className="w-full">
                                    <div className="flex gap-1 mb-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                                    </div>
                                    <p className="text-xs font-medium text-gray-800 dark:text-gray-100">{theme.name}</p>
                                </button>
                                <button
                                    onClick={() => deleteCustomTheme(key)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete theme"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Font Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
                    <select
                        value={fontSize}
                        onChange={(e) => updateFontSize(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Family</label>
                    <select
                        value={fontFamily}
                        onChange={(e) => updateFontFamily(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="inter">Inter</option>
                        <option value="roboto">Roboto</option>
                        <option value="outfit">Outfit</option>
                        <option value="system">System Default</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Layout Density</label>
                    <select
                        value={layoutDensity}
                        onChange={(e) => updateLayoutDensity(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="compact">Compact</option>
                        <option value="normal">Normal</option>
                        <option value="spacious">Spacious</option>
                    </select>
                </div>
            </div>

            {/* Create Custom Theme */}
            <div>
                <button
                    onClick={() => setShowCustomizer(!showCustomizer)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium mb-4"
                >
                    <Palette size={18} />
                    {showCustomizer ? 'Hide' : 'Create'} Custom Theme
                </button>

                {showCustomizer && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme Name</label>
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="My Awesome Theme"
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(customColors).map(([key, value]) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={value}
                                            onChange={(e) => handleColorChange(key, e.target.value)}
                                            className="w-12 h-10 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => handleColorChange(key, e.target.value)}
                                            className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 rounded text-xs"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveCustomTheme}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                <Save size={18} />
                                Save Theme
                            </button>
                            <button
                                onClick={() => setShowCustomizer(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Info */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 text-center flex items-center justify-center gap-2">
                    <Eye size={16} />
                    Changes apply instantly! Your theme is saved automatically.
                </p>
            </div>
        </div>
    );
};

export default ThemeCustomizer;
