// ENARM Prep - Theme Management Module
class ThemeManager {
    constructor() {
        this.currentTheme = AppConstants.THEMES.LIGHT;
        this.listeners = [];
        // Don't initialize immediately - wait for dependencies
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
    }

    loadTheme() {
        // Check if StorageService is available
        if (window.StorageService && window.StorageService.getItem) {
            const savedTheme = window.StorageService.getItem(
                AppConstants.STORAGE_KEYS.THEME, 
                AppConstants.THEMES.LIGHT
            );
            this.setTheme(savedTheme);
        } else {
            // Fallback to default theme if StorageService not ready
            this.setTheme(AppConstants.THEMES.LIGHT);
        }
    }

    setTheme(theme) {
        if (!Object.values(AppConstants.THEMES).includes(theme)) {
            console.warn(`Invalid theme: ${theme}. Using default.`);
            theme = AppConstants.THEMES.LIGHT;
        }

        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Save to storage if available
        if (window.StorageService && window.StorageService.setItem) {
            window.StorageService.setItem(AppConstants.STORAGE_KEYS.THEME, theme);
        }

        this.updateThemeToggleIcon(theme);
        this.notifyListeners(theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === AppConstants.THEMES.LIGHT 
            ? AppConstants.THEMES.DARK 
            : AppConstants.THEMES.LIGHT;
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkTheme() {
        return this.currentTheme === AppConstants.THEMES.DARK;
    }

    isLightTheme() {
        return this.currentTheme === AppConstants.THEMES.LIGHT;
    }

    updateThemeToggleIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = theme === AppConstants.THEMES.DARK ? '☀️' : '🌙';
            const iconElement = themeToggle.querySelector('.theme-icon');
            if (iconElement) {
                iconElement.textContent = icon;
            }
        }
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener(this.handleSystemThemeChange.bind(this));
        }

        // Keyboard shortcut (Ctrl + Shift + T)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    handleSystemThemeChange(e) {
        if (StorageService.getItem('theme-auto-sync', false)) {
            const systemTheme = e.matches ? AppConstants.THEMES.DARK : AppConstants.THEMES.LIGHT;
            this.setTheme(systemTheme);
        }
    }

    enableAutoSync() {
        StorageService.setItem('theme-auto-sync', true);
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? AppConstants.THEMES.DARK 
            : AppConstants.THEMES.LIGHT;
        this.setTheme(systemTheme);
    }

    disableAutoSync() {
        StorageService.setItem('theme-auto-sync', false);
    }

    isAutoSyncEnabled() {
        return StorageService.getItem('theme-auto-sync', false);
    }

    addThemeChangeListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    removeThemeChangeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners(theme) {
        this.listeners.forEach(callback => {
            try {
                callback(theme);
            } catch (error) {
                console.error('Error in theme change listener:', error);
            }
        });
    }

    getThemeColors() {
        const isDark = this.isDarkTheme();
        return {
            primary: isDark ? '#3b82f6' : '#2563eb',
            secondary: isDark ? '#8b5cf6' : '#7c3aed',
            success: isDark ? '#22c55e' : '#10b981',
            warning: isDark ? '#fbbf24' : '#f59e0b',
            error: isDark ? '#f87171' : '#ef4444',
            background: isDark ? '#1f2937' : '#ffffff',
            surface: isDark ? '#374151' : '#f8fafc',
            text: isDark ? '#f9fafb' : '#1f2937',
            textSecondary: isDark ? '#d1d5db' : '#64748b'
        };
    }

    applyCustomTheme(customColors) {
        if (!customColors || typeof customColors !== 'object') {
            console.error('Invalid custom theme colors');
            return;
        }

        const root = document.documentElement;
        
        Object.entries(customColors).forEach(([property, value]) => {
            const cssProperty = `--${property.replace(/([A-Z])/g, '-$1').toLowerCase()}-color`;
            root.style.setProperty(cssProperty, value);
        });
    }

    resetTheme() {
        const root = document.documentElement;
        const customProperties = [
            '--primary-color',
            '--secondary-color', 
            '--success-color',
            '--warning-color',
            '--error-color',
            '--background-color',
            '--surface-color',
            '--text-color',
            '--text-secondary-color'
        ];

        customProperties.forEach(property => {
            root.style.removeProperty(property);
        });
    }

    exportThemePreferences() {
        return {
            theme: this.currentTheme,
            autoSync: this.isAutoSyncEnabled(),
            customColors: this.getCustomColors()
        };
    }

    importThemePreferences(preferences) {
        if (!preferences || typeof preferences !== 'object') {
            return false;
        }

        try {
            if (preferences.theme) {
                this.setTheme(preferences.theme);
            }

            if (typeof preferences.autoSync === 'boolean') {
                if (preferences.autoSync) {
                    this.enableAutoSync();
                } else {
                    this.disableAutoSync();
                }
            }

            if (preferences.customColors) {
                this.applyCustomTheme(preferences.customColors);
            }

            return true;
        } catch (error) {
            console.error('Error importing theme preferences:', error);
            return false;
        }
    }

    getCustomColors() {
        const root = document.documentElement;
        const style = getComputedStyle(root);
        const customColors = {};

        const properties = [
            'primary-color',
            'secondary-color',
            'success-color',
            'warning-color',
            'error-color',
            'background-color',
            'surface-color',
            'text-color',
            'text-secondary-color'
        ];

        properties.forEach(property => {
            const value = style.getPropertyValue(`--${property}`);
            if (value) {
                customColors[property.replace(/-/g, '')] = value.trim();
            }
        });

        return customColors;
    }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Initialize after dependencies are loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeManager.init();
    });
} else {
    themeManager.init();
}

// Export as global
window.ThemeManager = themeManager;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = themeManager;
}