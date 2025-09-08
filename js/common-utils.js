// ENARM Prep - Common Utility Functions
class CommonUtils {
    static shuffleArray(array) {
        if (!Array.isArray(array)) {
            throw new Error('Input must be an array');
        }

        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static capitalize(str) {
        if (typeof str !== 'string' || !str) {
            return '';
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static formatTime(seconds) {
        if (typeof seconds !== 'number' || seconds < 0) {
            return '00:00';
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    static formatDate(date, options = {}) {
        if (!(date instanceof Date) && typeof date !== 'string' && typeof date !== 'number') {
            return '';
        }

        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return '';
        }

        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        };

        try {
            return dateObj.toLocaleDateString('es-MX', defaultOptions);
        } catch (error) {
            return dateObj.toLocaleDateString();
        }
    }

    static formatPercentage(value, decimals = 1) {
        if (typeof value !== 'number') {
            return '0%';
        }
        return `${value.toFixed(decimals)}%`;
    }

    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }

        return obj;
    }

    static generateId(prefix = '', length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = prefix;
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    static isValidEmail(email) {
        if (typeof email !== 'string') {
            return false;
        }
        return AppConstants.VALIDATION.EMAIL_REGEX.test(email);
    }

    static sanitizeHtml(str) {
        if (typeof str !== 'string') {
            return '';
        }

        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    static truncateText(text, maxLength, suffix = '...') {
        if (typeof text !== 'string' || text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    static parseQueryParams(url = window.location.search) {
        const params = {};
        const urlParams = new URLSearchParams(url);
        
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        
        return params;
    }

    static buildQueryString(params) {
        if (!params || typeof params !== 'object') {
            return '';
        }

        const urlParams = new URLSearchParams();
        
        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined) {
                urlParams.append(key, String(value));
            }
        }
        
        return urlParams.toString();
    }

    static getCSSVariable(variable) {
        return getComputedStyle(document.documentElement).getPropertyValue(variable);
    }

    static setCSSVariable(variable, value) {
        document.documentElement.style.setProperty(variable, value);
    }

    static getRandomElement(array) {
        if (!Array.isArray(array) || array.length === 0) {
            return null;
        }
        return array[Math.floor(Math.random() * array.length)];
    }

    static getRandomElements(array, count) {
        if (!Array.isArray(array) || count <= 0) {
            return [];
        }

        const shuffled = this.shuffleArray(array);
        return shuffled.slice(0, Math.min(count, array.length));
    }

    static calculateAccuracy(correct, total) {
        if (typeof correct !== 'number' || typeof total !== 'number' || total === 0) {
            return 0;
        }
        return Math.round((correct / total) * 100);
    }

    static getAccuracyLevel(accuracy) {
        if (accuracy >= AppConstants.STATISTICS.MIN_ACCURACY_FOR_EXCELLENT) {
            return 'excellent';
        } else if (accuracy >= AppConstants.STATISTICS.MIN_ACCURACY_FOR_GOOD) {
            return 'good';
        } else if (accuracy >= 50) {
            return 'average';
        } else {
            return 'needs_improvement';
        }
    }

    static isElementInViewport(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    static smoothScrollTo(element, offset = 0) {
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    static isMobileDevice() {
        return window.innerWidth <= AppConstants.UI.MOBILE_BREAKPOINT;
    }

    static isTabletDevice() {
        return window.innerWidth <= AppConstants.UI.TABLET_BREAKPOINT && 
               window.innerWidth > AppConstants.UI.MOBILE_BREAKPOINT;
    }

    static getDeviceType() {
        if (this.isMobileDevice()) return 'mobile';
        if (this.isTabletDevice()) return 'tablet';
        return 'desktop';
    }

    static copyToClipboard(text) {
        if (!text) return Promise.reject('No text provided');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }

        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        } catch (error) {
            document.body.removeChild(textArea);
            return Promise.reject(error);
        }
    }

    static downloadJSON(data, filename = 'data.json') {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static validateQuestion(question) {
        const validation = { valid: true, errors: [] };
        
        if (!question || typeof question !== 'object') {
            return { valid: false, errors: ['Question must be an object'] };
        }

        // Check required fields
        for (const field of AppConstants.VALIDATION.REQUIRED_QUESTION_FIELDS) {
            if (!question[field]) {
                validation.errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate options
        if (question.options) {
            for (const option of AppConstants.QUESTION.OPTIONS) {
                if (!question.options[option]) {
                    validation.errors.push(`Missing option ${option}`);
                }
            }
        }

        // Validate correct answer
        if (question.correct && !AppConstants.QUESTION.OPTIONS.includes(question.correct)) {
            validation.errors.push('Correct answer must be A, B, C, D, or E');
        }

        // Validate difficulty
        if (question.difficulty && !AppConstants.QUESTION.DIFFICULTIES.includes(question.difficulty)) {
            validation.errors.push('Difficulty must be basico, intermedio, or avanzado');
        }

        validation.valid = validation.errors.length === 0;
        return validation;
    }

    static async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static createToast(message, type = 'info', duration = AppConstants.UI.TOAST_DURATION) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--${type === 'info' ? 'primary' : type}-color, var(--primary-color));
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);

        return toast;
    }
}

// Export as global
window.CommonUtils = CommonUtils;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommonUtils;
}