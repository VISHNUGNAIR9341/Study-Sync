import React, { useState, useEffect } from 'react';
import { Download, Upload, Save, RotateCcw, Database, CheckCircle, AlertCircle } from 'lucide-react';
import storageManager from '../utils/storageManager';

const BackupManager = ({ userId }) => {
    const [backups, setBackups] = useState([]);
    const [message, setMessage] = useState(null);
    const [autoBackup, setAutoBackup] = useState(true);

    useEffect(() => {
        loadBackups();

        // Load auto-backup setting
        if (userId) {
            const savedAutoBackup = storageManager.get(`autoBackupEnabled_${userId}`, true);
            setAutoBackup(savedAutoBackup);
        }
    }, [userId]);

    const loadBackups = () => {
        const allBackups = storageManager.getAllBackups();
        setBackups(allBackups);
    };

    const handleCreateBackup = () => {
        const backupKey = storageManager.createBackup();
        if (backupKey) {
            showMessage('success', 'Backup created successfully!');
            loadBackups();
        } else {
            showMessage('error', 'Failed to create backup');
        }
    };

    const handleRestoreBackup = (backupKey) => {
        if (!window.confirm('Are you sure you want to restore this backup? Current data will be overwritten.')) {
            return;
        }

        const success = storageManager.restoreBackup(backupKey);
        if (success) {
            showMessage('success', 'Backup restored successfully! Refreshing page...');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showMessage('error', 'Failed to restore backup');
        }
    };

    const handleExportJSON = () => {
        const success = storageManager.downloadAsJSON(`studysync-backup-${new Date().toISOString().split('T')[0]}.json`);
        if (success) {
            showMessage('success', 'Data exported successfully!');
        } else {
            showMessage('error', 'Failed to export data');
        }
    };

    const handleImportJSON = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);

                if (!window.confirm('Import this backup? You can choose to merge with existing data or replace it.')) {
                    return;
                }

                const merge = window.confirm('Click OK to merge with existing data, or Cancel to replace all data.');
                const success = storageManager.importData(importData, merge);

                if (success) {
                    showMessage('success', 'Data imported successfully! Refreshing page...');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showMessage('error', 'Failed to import data');
                }
            } catch (error) {
                showMessage('error', 'Invalid backup file');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const toggleAutoBackup = () => {
        const newValue = !autoBackup;
        setAutoBackup(newValue);
        if (userId) {
            storageManager.set(`autoBackupEnabled_${userId}`, newValue);
        }

        if (newValue) {
            handleCreateBackup();
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl">
                    <Database className="text-white" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Backup & Export</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Protect your data with backups</p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <button
                    onClick={handleCreateBackup}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transition-all font-medium"
                >
                    <Save size={18} />
                    Create Backup
                </button>

                <button
                    onClick={handleExportJSON}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transition-all font-medium"
                >
                    <Download size={18} />
                    Export JSON
                </button>

                <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transition-all font-medium cursor-pointer">
                    <Upload size={18} />
                    Import JSON
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Auto-Backup Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl mb-6">
                <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">Auto-Backup</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Automatically create backups when you make changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={autoBackup}
                        onChange={toggleAutoBackup}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {/* Backup History */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Backup History ({backups.length}/{5})
                </h3>

                {backups.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed">
                        <Database size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No backups yet</p>
                        <p className="text-xs">Create your first backup to get started</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {backups.map((backup, index) => (
                            <div
                                key={backup.key}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0
                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                        }`}>
                                        <Database size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                            {formatDate(backup.timestamp)}
                                            {index === 0 && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Latest)</span>}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {backup.dataKeys.length} data items
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRestoreBackup(backup.key)}
                                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
                                >
                                    <RotateCcw size={14} />
                                    Restore
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Tip:</strong> Backups are stored locally in your browser. Export to JSON for a permanent copy you can save to your computer.
                </p>
            </div>
        </div>
    );
};

export default BackupManager;
