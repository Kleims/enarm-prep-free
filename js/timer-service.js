// ENARM Prep - Timer Management Service
class TimerService {
    constructor() {
        this.timers = new Map();
        this.listeners = new Map();
    }

    // Timer Creation and Management
    createTimer(id, config = {}) {
        const timerConfig = {
            duration: config.duration || AppConstants.TIMER.DEFAULT_QUESTION_TIME,
            interval: config.interval || 1000,
            autoStart: config.autoStart !== false,
            onTick: config.onTick || null,
            onComplete: config.onComplete || null,
            onWarning: config.onWarning || null,
            warningThreshold: config.warningThreshold || AppConstants.TIMER.WARNING_THRESHOLD,
            displayElement: config.displayElement || null,
            ...config
        };

        const timer = {
            id,
            config: timerConfig,
            timeRemaining: timerConfig.duration,
            timeElapsed: 0,
            isRunning: false,
            isPaused: false,
            intervalId: null,
            startTime: null,
            pausedTime: 0,
            status: 'created'
        };

        this.timers.set(id, timer);

        if (timerConfig.autoStart) {
            this.startTimer(id);
        }

        return timer;
    }

    // Timer Controls
    startTimer(id) {
        const timer = this.timers.get(id);
        if (!timer) {
            throw new Error(`Timer ${id} not found`);
        }

        if (timer.isRunning) {
            return timer;
        }

        timer.isRunning = true;
        timer.isPaused = false;
        timer.status = 'running';
        timer.startTime = Date.now() - timer.pausedTime;

        timer.intervalId = setInterval(() => {
            this.tickTimer(id);
        }, timer.config.interval);

        this.notifyListeners(id, 'start', timer);
        return timer;
    }

    pauseTimer(id) {
        const timer = this.timers.get(id);
        if (!timer || !timer.isRunning) {
            return timer;
        }

        timer.isRunning = false;
        timer.isPaused = true;
        timer.status = 'paused';
        timer.pausedTime = Date.now() - timer.startTime;

        if (timer.intervalId) {
            clearInterval(timer.intervalId);
            timer.intervalId = null;
        }

        this.notifyListeners(id, 'pause', timer);
        return timer;
    }

    resumeTimer(id) {
        const timer = this.timers.get(id);
        if (!timer || timer.isRunning || !timer.isPaused) {
            return timer;
        }

        return this.startTimer(id);
    }

    stopTimer(id) {
        const timer = this.timers.get(id);
        if (!timer) {
            return null;
        }

        timer.isRunning = false;
        timer.isPaused = false;
        timer.status = 'stopped';

        if (timer.intervalId) {
            clearInterval(timer.intervalId);
            timer.intervalId = null;
        }

        this.notifyListeners(id, 'stop', timer);
        return timer;
    }

    resetTimer(id) {
        const timer = this.timers.get(id);
        if (!timer) {
            return null;
        }

        this.stopTimer(id);
        
        timer.timeRemaining = timer.config.duration;
        timer.timeElapsed = 0;
        timer.pausedTime = 0;
        timer.startTime = null;
        timer.status = 'reset';

        this.updateTimerDisplay(timer);
        this.notifyListeners(id, 'reset', timer);
        return timer;
    }

    deleteTimer(id) {
        const timer = this.timers.get(id);
        if (timer) {
            this.stopTimer(id);
            this.timers.delete(id);
            this.listeners.delete(id);
        }
        return timer;
    }

    // Timer Tick Logic
    tickTimer(id) {
        const timer = this.timers.get(id);
        if (!timer || !timer.isRunning) {
            return;
        }

        const currentTime = Date.now();
        timer.timeElapsed = Math.floor((currentTime - timer.startTime) / 1000);
        timer.timeRemaining = Math.max(0, timer.config.duration - timer.timeElapsed);

        // Update display
        this.updateTimerDisplay(timer);

        // Trigger callbacks
        if (timer.config.onTick) {
            try {
                timer.config.onTick(timer);
            } catch (error) {
                ErrorHandler.logError(error, 'TimerService.onTick');
            }
        }

        // Warning threshold
        if (timer.timeRemaining === timer.config.warningThreshold && timer.config.onWarning) {
            try {
                timer.config.onWarning(timer);
            } catch (error) {
                ErrorHandler.logError(error, 'TimerService.onWarning');
            }
        }

        // Timer completion
        if (timer.timeRemaining <= 0) {
            this.completeTimer(id);
        }

        this.notifyListeners(id, 'tick', timer);
    }

    completeTimer(id) {
        const timer = this.timers.get(id);
        if (!timer) {
            return;
        }

        this.stopTimer(id);
        timer.status = 'completed';
        timer.timeRemaining = 0;

        if (timer.config.onComplete) {
            try {
                timer.config.onComplete(timer);
            } catch (error) {
                ErrorHandler.logError(error, 'TimerService.onComplete');
            }
        }

        this.notifyListeners(id, 'complete', timer);
    }

    // Timer Display Updates
    updateTimerDisplay(timer) {
        if (!timer.config.displayElement) {
            return;
        }

        const element = typeof timer.config.displayElement === 'string' 
            ? document.getElementById(timer.config.displayElement)
            : timer.config.displayElement;

        if (!element) {
            return;
        }

        const timeString = this.formatTime(timer.timeRemaining);
        element.textContent = timeString;

        // Apply warning styles
        const isWarning = timer.timeRemaining <= timer.config.warningThreshold;
        element.style.color = isWarning ? 'var(--error-color)' : 'var(--primary-color)';
        
        if (isWarning) {
            element.classList.add('timer-warning');
        } else {
            element.classList.remove('timer-warning');
        }
    }

    // Specialized Timer Types
    createQuestionTimer(questionConfig = {}) {
        const config = {
            duration: AppConstants.TIMER.DEFAULT_QUESTION_TIME,
            displayElement: 'timer-display',
            warningThreshold: AppConstants.TIMER.WARNING_THRESHOLD,
            onComplete: () => {
                // Auto-submit when timer expires
                if (window.SessionManager) {
                    const sessionInfo = window.SessionManager.getCurrentSessionInfo();
                    if (sessionInfo && sessionInfo.currentQuestion) {
                        // Trigger auto-submit - this would be handled by UI controller
                        this.notifyListeners('question-timer', 'auto-submit', {
                            questionId: sessionInfo.currentQuestion.id
                        });
                    }
                }
            },
            ...questionConfig
        };

        return this.createTimer('question-timer', config);
    }

    createSessionTimer(sessionConfig = {}) {
        const config = {
            duration: sessionConfig.duration || AppConstants.TIMER.EXAM_TOTAL_TIME,
            displayElement: 'session-timer',
            warningThreshold: Math.floor((sessionConfig.duration || AppConstants.TIMER.EXAM_TOTAL_TIME) * 0.1),
            onComplete: () => {
                // Auto-end session when timer expires
                if (window.SessionManager) {
                    this.notifyListeners('session-timer', 'auto-end', {
                        reason: 'time-expired'
                    });
                }
            },
            onWarning: (timer) => {
                CommonUtils.createToast(
                    `¡Solo quedan ${this.formatTime(timer.timeRemaining)}!`, 
                    'warning'
                );
            },
            ...sessionConfig
        };

        return this.createTimer('session-timer', config);
    }

    // Timer Queries
    getTimer(id) {
        return this.timers.get(id);
    }

    getAllTimers() {
        return Array.from(this.timers.values());
    }

    getActiveTimers() {
        return Array.from(this.timers.values()).filter(timer => timer.isRunning);
    }

    getTimerStatus(id) {
        const timer = this.timers.get(id);
        return timer ? timer.status : 'not-found';
    }

    isTimerRunning(id) {
        const timer = this.timers.get(id);
        return timer ? timer.isRunning : false;
    }

    getTimeRemaining(id) {
        const timer = this.timers.get(id);
        return timer ? timer.timeRemaining : 0;
    }

    getTimeElapsed(id) {
        const timer = this.timers.get(id);
        return timer ? timer.timeElapsed : 0;
    }

    // Utility Methods
    formatTime(seconds) {
        if (typeof seconds !== 'number' || seconds < 0) {
            return '00:00';
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    calculateProgress(timer) {
        if (!timer || timer.config.duration === 0) {
            return 0;
        }
        return Math.max(0, Math.min(100, (timer.timeElapsed / timer.config.duration) * 100));
    }

    // Event System
    addEventListener(timerId, event, callback) {
        if (!this.listeners.has(timerId)) {
            this.listeners.set(timerId, new Map());
        }
        
        const timerListeners = this.listeners.get(timerId);
        if (!timerListeners.has(event)) {
            timerListeners.set(event, []);
        }
        
        timerListeners.get(event).push(callback);
    }

    removeEventListener(timerId, event, callback) {
        const timerListeners = this.listeners.get(timerId);
        if (!timerListeners) return;
        
        const eventListeners = timerListeners.get(event);
        if (!eventListeners) return;
        
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
            eventListeners.splice(index, 1);
        }
    }

    notifyListeners(timerId, event, data) {
        const timerListeners = this.listeners.get(timerId);
        if (!timerListeners) return;
        
        const eventListeners = timerListeners.get(event);
        if (!eventListeners) return;
        
        eventListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                ErrorHandler.logError(error, `TimerService.${timerId}.${event}`);
            }
        });
    }

    // Cleanup
    stopAllTimers() {
        for (const [id] of this.timers) {
            this.stopTimer(id);
        }
    }

    clearAllTimers() {
        this.stopAllTimers();
        this.timers.clear();
        this.listeners.clear();
    }

    // Integration with SessionManager
    startQuestionTimer(duration = null) {
        this.deleteTimer('question-timer'); // Clear any existing question timer
        
        const config = {
            duration: duration || AppConstants.TIMER.DEFAULT_QUESTION_TIME,
            displayElement: 'timer-display'
        };
        
        return this.createQuestionTimer(config);
    }

    startSessionTimer(duration = null) {
        this.deleteTimer('session-timer'); // Clear any existing session timer
        
        const config = {
            duration: duration || AppConstants.TIMER.PRACTICE_TOTAL_TIME
        };
        
        return this.createSessionTimer(config);
    }

    stopQuestionTimer() {
        return this.stopTimer('question-timer');
    }

    stopSessionTimer() {
        return this.stopTimer('session-timer');
    }

    getQuestionTimeSpent() {
        const timer = this.getTimer('question-timer');
        return timer ? timer.timeElapsed : 0;
    }

    // Statistics
    getTimerStats() {
        const timers = this.getAllTimers();
        const activeCount = timers.filter(t => t.isRunning).length;
        const pausedCount = timers.filter(t => t.isPaused).length;
        const completedCount = timers.filter(t => t.status === 'completed').length;

        return {
            total: timers.length,
            active: activeCount,
            paused: pausedCount,
            completed: completedCount,
            stopped: timers.length - activeCount - pausedCount - completedCount
        };
    }
}

// Create singleton instance
const timerService = new TimerService();

// Export as global
window.TimerService = timerService;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = timerService;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    timerService.stopAllTimers();
});