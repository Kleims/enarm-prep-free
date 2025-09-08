// ENARM Prep - Centralized Storage Service
class StorageService {
    constructor() {
        this.isSupported = this.checkStorageSupport();
        this.listeners = {};
    }

    checkStorageSupport() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('LocalStorage is not supported or disabled');
            return false;
        }
    }

    setItem(key, value, options = {}) {
        if (!this.isSupported) {
            console.warn('Storage not supported, data will not persist');
            return false;
        }

        try {
            const data = {
                value,
                timestamp: Date.now(),
                expires: options.expires || null
            };

            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            
            this.notifyListeners(key, value, 'set');
            return true;
        } catch (error) {
            console.error(`Error setting item ${key}:`, error);
            return false;
        }
    }

    getItem(key, defaultValue = null) {
        if (!this.isSupported) {
            return defaultValue;
        }

        try {
            const stored = localStorage.getItem(key);
            if (!stored) {
                return defaultValue;
            }

            const data = JSON.parse(stored);
            
            if (data.expires && Date.now() > data.expires) {
                localStorage.removeItem(key);
                return defaultValue;
            }

            return data.value !== undefined ? data.value : defaultValue;
        } catch (error) {
            console.error(`Error getting item ${key}:`, error);
            return defaultValue;
        }
    }

    removeItem(key) {
        if (!this.isSupported) {
            return false;
        }

        try {
            localStorage.removeItem(key);
            this.notifyListeners(key, null, 'remove');
            return true;
        } catch (error) {
            console.error(`Error removing item ${key}:`, error);
            return false;
        }
    }

    clear() {
        if (!this.isSupported) {
            return false;
        }

        try {
            localStorage.clear();
            this.notifyListeners('*', null, 'clear');
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    hasItem(key) {
        return this.getItem(key) !== null;
    }

    getAllKeys() {
        if (!this.isSupported) {
            return [];
        }

        return Object.keys(localStorage);
    }

    getSize() {
        if (!this.isSupported) {
            return 0;
        }

        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    backup() {
        if (!this.isSupported) {
            return {};
        }

        const backup = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            backup[key] = localStorage.getItem(key);
        }
        return backup;
    }

    restore(backup) {
        if (!this.isSupported || !backup) {
            return false;
        }

        try {
            this.clear();
            for (const [key, value] of Object.entries(backup)) {
                localStorage.setItem(key, value);
            }
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }

    addListener(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }

    removeListener(key, callback) {
        if (this.listeners[key]) {
            const index = this.listeners[key].indexOf(callback);
            if (index > -1) {
                this.listeners[key].splice(index, 1);
            }
        }
    }

    notifyListeners(key, value, action) {
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => {
                try {
                    callback({ key, value, action });
                } catch (error) {
                    console.error('Error in storage listener:', error);
                }
            });
        }
    }

    // Session Storage methods
    setSessionItem(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting session item ${key}:`, error);
            return false;
        }
    }

    getSessionItem(key, defaultValue = null) {
        try {
            const stored = sessionStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.error(`Error getting session item ${key}:`, error);
            return defaultValue;
        }
    }

    removeSessionItem(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing session item ${key}:`, error);
            return false;
        }
    }

    clearSession() {
        try {
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing session storage:', error);
            return false;
        }
    }

    // Helper methods for common operations
    updateItemProperty(key, property, value) {
        const item = this.getItem(key, {});
        item[property] = value;
        return this.setItem(key, item);
    }

    pushToArray(key, value, maxLength = null) {
        const array = this.getItem(key, []);
        array.push(value);
        
        if (maxLength && array.length > maxLength) {
            array.shift(); // Remove oldest item
        }
        
        return this.setItem(key, array);
    }

    removeFromArray(key, predicate) {
        const array = this.getItem(key, []);
        const filtered = array.filter(item => !predicate(item));
        return this.setItem(key, filtered);
    }

    incrementCounter(key, increment = 1) {
        const current = this.getItem(key, 0);
        return this.setItem(key, current + increment);
    }

    setWithTTL(key, value, ttlMinutes) {
        const expires = Date.now() + (ttlMinutes * 60 * 1000);
        return this.setItem(key, value, { expires });
    }
}

// Create singleton instance
const storageService = new StorageService();

// Export as global
window.StorageService = storageService;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = storageService;
}