// ENARM Prep - Comprehensive Error Handling System
class ErrorHandler {
    constructor() {
        this.errors = [];
        this.listeners = [];
        this.maxErrors = 100;
        this.init();
    }

    init() {
        this.setupGlobalErrorHandling();
        this.setupUnhandledPromiseRejection();
    }

    setupGlobalErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });

        // Global unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                error: event.reason,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });
    }

    setupUnhandledPromiseRejection() {
        // Override Promise.prototype.catch to ensure better error tracking
        const originalCatch = Promise.prototype.catch;
        Promise.prototype.catch = function(onRejected) {
            return originalCatch.call(this, (error) => {
                // Safe error logging that doesn't depend on StorageService
                if (window.ErrorHandler && window.ErrorHandler.logError) {
                    window.ErrorHandler.logError(error, 'promise-catch');
                } else {
                    console.error('Promise rejection:', error);
                }
                if (onRejected) {
                    return onRejected(error);
                }
                throw error;
            });
        };
    }

    handleError(errorInfo) {
        // Log to console in development
        if (this.isDevelopment()) {
            console.error('Error caught:', errorInfo);
        }

        // Store error
        this.logError(errorInfo);

        // Notify listeners
        this.notifyListeners(errorInfo);

        // Show user-friendly message for critical errors
        if (this.isCriticalError(errorInfo)) {
            this.showErrorMessage(errorInfo);
        }
    }

    logError(error, context = 'unknown') {
        const errorEntry = {
            id: CommonUtils.generateId('error_'),
            timestamp: new Date(),
            context,
            message: this.extractErrorMessage(error),
            stack: this.extractErrorStack(error),
            type: this.determineErrorType(error),
            severity: this.determineSeverity(error),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getCurrentUserId(),
            sessionId: this.getSessionId()
        };

        // Add to errors array
        this.errors.unshift(errorEntry);

        // Limit array size
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }

        // Store in localStorage for persistence
        this.persistErrors();

        // Send to logging service if available
        this.sendToLoggingService(errorEntry);

        return errorEntry;
    }

    extractErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }
        if (error?.message) {
            return error.message;
        }
        if (error?.error?.message) {
            return error.error.message;
        }
        return 'Unknown error occurred';
    }

    extractErrorStack(error) {
        if (error?.stack) {
            return error.stack;
        }
        if (error?.error?.stack) {
            return error.error.stack;
        }
        return null;
    }

    determineErrorType(error) {
        if (error?.type) {
            return error.type;
        }
        if (error instanceof TypeError) {
            return 'type';
        }
        if (error instanceof ReferenceError) {
            return 'reference';
        }
        if (error instanceof SyntaxError) {
            return 'syntax';
        }
        if (error instanceof RangeError) {
            return 'range';
        }
        return 'unknown';
    }

    determineSeverity(error) {
        const message = this.extractErrorMessage(error).toLowerCase();
        
        if (message.includes('network') || message.includes('fetch')) {
            return 'low';
        }
        if (message.includes('storage') || message.includes('quota')) {
            return 'medium';
        }
        if (message.includes('script') || message.includes('reference')) {
            return 'high';
        }
        if (message.includes('security') || message.includes('cors')) {
            return 'critical';
        }
        
        return 'medium';
    }

    isCriticalError(errorInfo) {
        return errorInfo.severity === 'critical' || 
               errorInfo.type === 'security' ||
               (errorInfo.message && errorInfo.message.includes('QuotaExceededError'));
    }

    showErrorMessage(errorInfo) {
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        CommonUtils.createToast(userMessage, 'error', 5000);
    }

    getUserFriendlyMessage(errorInfo) {
        const message = errorInfo.message.toLowerCase();
        
        if (message.includes('quotaexceedederror') || message.includes('storage')) {
            return 'El almacenamiento local está lleno. Algunos datos podrían no guardarse.';
        }
        if (message.includes('network') || message.includes('fetch')) {
            return 'Error de conexión. Verifica tu conexión a internet.';
        }
        if (message.includes('cors')) {
            return 'Error de seguridad. Recarga la página.';
        }
        
        return 'Ocurrió un error inesperado. La aplicación continuará funcionando.';
    }

    persistErrors() {
        try {
            if (window.StorageService && typeof window.StorageService.setItem === 'function') {
                const recentErrors = this.errors.slice(0, 20); // Only store recent errors
                window.StorageService.setItem('app-errors', recentErrors);
            }
        } catch (error) {
            console.warn('Could not persist errors to storage');
        }
    }

    loadPersistedErrors() {
        try {
            if (window.StorageService && typeof window.StorageService.getItem === 'function') {
                const persistedErrors = window.StorageService.getItem('app-errors', []);
                this.errors = [...persistedErrors, ...this.errors];
            }
        } catch (error) {
            console.warn('Could not load persisted errors');
        }
    }

    sendToLoggingService(errorEntry) {
        // Only send errors in production
        if (!this.isDevelopment()) {
            // Implement your logging service here
            // Example: Send to Sentry, LogRocket, or custom endpoint
            this.queueErrorForSending(errorEntry);
        }
    }

    queueErrorForSending(errorEntry) {
        if (!window.StorageService || typeof window.StorageService.getItem !== 'function') {
            return; // Skip if StorageService not available
        }
        const errorQueue = window.StorageService.getItem('error-queue', []);
        errorQueue.push(errorEntry);
        
        // Limit queue size
        if (errorQueue.length > 50) {
            errorQueue.shift();
        }
        
        window.StorageService.setItem('error-queue', errorQueue);
        
        // Try to send queued errors
        this.sendQueuedErrors();
    }

    async sendQueuedErrors() {
        if (!window.StorageService || typeof window.StorageService.getItem !== 'function') {
            return;
        }
        
        const errorQueue = window.StorageService.getItem('error-queue', []);
        if (errorQueue.length === 0) return;

        try {
            // Implement actual sending logic here
            // For now, just clear the queue after a delay
            setTimeout(() => {
                if (window.StorageService && typeof window.StorageService.setItem === 'function') {
                    window.StorageService.setItem('error-queue', []);
                }
            }, 5000);
        } catch (error) {
            console.warn('Could not send queued errors');
        }
    }

    getCurrentUserId() {
        if (window.StorageService && window.StorageService.getItem) {
            return window.StorageService.getItem('user-id', 'anonymous');
        }
        return 'anonymous';
    }

    getSessionId() {
        if (window.StorageService && window.StorageService.getSessionItem) {
            let sessionId = window.StorageService.getSessionItem('session-id');
            if (!sessionId) {
                sessionId = window.CommonUtils ? window.CommonUtils.generateId('session_') : 'session_' + Date.now();
                window.StorageService.setSessionItem('session-id', sessionId);
            }
            return sessionId;
        }
        return 'session_' + Date.now();
    }

    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    // Wrapper methods for common operations
    async tryAsync(asyncFn, context = 'async-operation') {
        try {
            return await asyncFn();
        } catch (error) {
            this.logError(error, context);
            throw error;
        }
    }

    trySyncWithFallback(fn, fallback = null, context = 'sync-operation') {
        try {
            return fn();
        } catch (error) {
            this.logError(error, context);
            return fallback;
        }
    }

    wrapMethod(obj, methodName, context) {
        const original = obj[methodName];
        if (typeof original !== 'function') return;

        obj[methodName] = (...args) => {
            try {
                const result = original.apply(obj, args);
                if (result instanceof Promise) {
                    return result.catch(error => {
                        this.logError(error, `${context}.${methodName}`);
                        throw error;
                    });
                }
                return result;
            } catch (error) {
                this.logError(error, `${context}.${methodName}`);
                throw error;
            }
        };
    }

    // Error retrieval and management
    getErrors(filters = {}) {
        let filteredErrors = [...this.errors];

        if (filters.severity) {
            filteredErrors = filteredErrors.filter(e => e.severity === filters.severity);
        }
        if (filters.type) {
            filteredErrors = filteredErrors.filter(e => e.type === filters.type);
        }
        if (filters.context) {
            filteredErrors = filteredErrors.filter(e => e.context.includes(filters.context));
        }
        if (filters.since) {
            const since = new Date(filters.since);
            filteredErrors = filteredErrors.filter(e => new Date(e.timestamp) >= since);
        }

        return filteredErrors;
    }

    getErrorStats() {
        const stats = {
            total: this.errors.length,
            bySeverity: {},
            byType: {},
            byContext: {},
            recent: this.errors.filter(e => 
                new Date() - new Date(e.timestamp) < 24 * 60 * 60 * 1000
            ).length
        };

        this.errors.forEach(error => {
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;
        });

        return stats;
    }

    clearErrors() {
        this.errors = [];
        StorageService.removeItem('app-errors');
        StorageService.removeItem('error-queue');
    }

    exportErrors() {
        return {
            errors: this.errors,
            stats: this.getErrorStats(),
            exportedAt: new Date(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }

    addErrorListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    removeErrorListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners(errorInfo) {
        this.listeners.forEach(callback => {
            try {
                callback(errorInfo);
            } catch (error) {
                console.error('Error in error listener:', error);
            }
        });
    }

    // Static singleton method
    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }
}

// Create singleton instance
const errorHandler = ErrorHandler.getInstance();

// Export as global with both instance methods and static methods
window.ErrorHandler = errorHandler;

// Add static methods for backward compatibility
window.ErrorHandler.logError = errorHandler.logError.bind(errorHandler);
window.ErrorHandler.handleError = errorHandler.handleError.bind(errorHandler);
window.ErrorHandler.getInstance = ErrorHandler.getInstance;
window.ErrorHandler.prototype = ErrorHandler.prototype;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = errorHandler;
}