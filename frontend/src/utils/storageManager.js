// Centralized localStorage manager with error handling and backup functionality

const BACKUP_PREFIX = 'backup_';
const MAX_BACKUPS = 5;

export const storageManager = {
  // Generic get/set/remove with error handling
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  },

  // Auto-backup functionality
  createBackup(dataKeys = []) {
    try {
      const timestamp = new Date().toISOString();
      const backupData = {
        timestamp,
        version: '1.0',
        data: {}
      };

      // If no keys specified, backup everything except backups
      const keysToBackup = dataKeys.length > 0 
        ? dataKeys 
        : Object.keys(localStorage).filter(key => !key.startsWith(BACKUP_PREFIX));

      keysToBackup.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          backupData.data[key] = value;
        }
      });

      const backupKey = `${BACKUP_PREFIX}${timestamp}`;
      this.set(backupKey, backupData);

      // Clean old backups
      this.cleanOldBackups();

      return backupKey;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  },

  cleanOldBackups() {
    try {
      const backups = Object.keys(localStorage)
        .filter(key => key.startsWith(BACKUP_PREFIX))
        .sort()
        .reverse();

      // Keep only MAX_BACKUPS most recent
      if (backups.length > MAX_BACKUPS) {
        backups.slice(MAX_BACKUPS).forEach(key => {
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  },

  getAllBackups() {
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(BACKUP_PREFIX))
        .map(key => {
          const backup = this.get(key);
          return {
            key,
            timestamp: backup?.timestamp,
            version: backup?.version,
            dataKeys: Object.keys(backup?.data || {})
          };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  },

  restoreBackup(backupKey) {
    try {
      const backup = this.get(backupKey);
      if (!backup || !backup.data) {
        throw new Error('Invalid backup data');
      }

      // Restore all data from backup
      Object.entries(backup.data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  },

  // Export all data as JSON
  exportData() {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {}
      };

      Object.keys(localStorage).forEach(key => {
        if (!key.startsWith(BACKUP_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              exportData.data[key] = JSON.parse(value);
            } catch {
              exportData.data[key] = value;
            }
          }
        }
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  },

  // Import data from JSON
  importData(importData, merge = false) {
    try {
      if (!importData || !importData.data) {
        throw new Error('Invalid import data');
      }

      // Create backup before import
      this.createBackup();

      if (!merge) {
        // Clear existing data (except backups)
        Object.keys(localStorage).forEach(key => {
          if (!key.startsWith(BACKUP_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
      }

      // Import new data
      Object.entries(importData.data).forEach(([key, value]) => {
        this.set(key, value);
      });

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  // Download data as JSON file
  downloadAsJSON(filename = 'studysync-backup.json') {
    try {
      const data = this.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error downloading JSON:', error);
      return false;
    }
  }
};

export default storageManager;
