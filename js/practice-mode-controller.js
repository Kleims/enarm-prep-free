// ENARM Prep - Practice Mode Controller
class PracticeModeController {
    constructor() {
        this.currentMode = null;
        this.availableModes = {
            [AppConstants.PRACTICE_MODES.EXAM_SIMULATION]: {
                name: 'Simulación de Examen',
                description: 'Examen completo de 280 preguntas en 5 horas',
                questionsCount: AppConstants.EXAM_SETTINGS.FULL_EXAM_QUESTIONS,
                timeLimit: AppConstants.EXAM_SETTINGS.FULL_EXAM_DURATION * 60, // Convert to seconds
                allowCustomConfig: false,
                showExplanations: false,
                allowPause: false
            },
            [AppConstants.PRACTICE_MODES.TIMED_PRACTICE]: {
                name: 'Práctica con Tiempo',
                description: 'Sesión personalizada con tiempo límite',
                questionsCount: 50,
                timeLimit: 3600, // 1 hour in seconds
                allowCustomConfig: true,
                showExplanations: true,
                allowPause: true
            },
            [AppConstants.PRACTICE_MODES.STUDY]: {
                name: 'Modo Estudio',
                description: 'Práctica relajada con explicaciones inmediatas',
                questionsCount: 10,
                timeLimit: 0, // No time limit
                allowCustomConfig: true,
                showExplanations: true,
                allowPause: true
            },
            [AppConstants.PRACTICE_MODES.REVIEW]: {
                name: 'Revisar Incorrectas',
                description: 'Repasa las preguntas que has fallado anteriormente',
                questionsCount: null, // Determined by available incorrect questions
                timeLimit: 0,
                allowCustomConfig: false,
                showExplanations: true,
                allowPause: true
            },
            [AppConstants.PRACTICE_MODES.RANDOM]: {
                name: 'Pregunta Aleatoria',
                description: 'Una pregunta aleatoria para práctica rápida',
                questionsCount: 1,
                timeLimit: AppConstants.TIMER.DEFAULT_QUESTION_TIME,
                allowCustomConfig: false,
                showExplanations: true,
                allowPause: false
            }
        };
        
        this.listeners = [];
    }

    // Mode Selection and Configuration
    selectMode(modeId, customConfig = {}) {
        if (!this.availableModes[modeId]) {
            throw new Error(`Unknown practice mode: ${modeId}`);
        }

        this.currentMode = {
            id: modeId,
            ...this.availableModes[modeId],
            ...customConfig
        };

        this.notifyListeners('modeSelected', this.currentMode);
        return this.currentMode;
    }

    getModeConfig(modeId) {
        return this.availableModes[modeId] || null;
    }

    getCurrentMode() {
        return this.currentMode;
    }

    // Mode-Specific Session Starters
    async startExamSimulation(config = {}) {
        try {
            const mode = this.selectMode(AppConstants.PRACTICE_MODES.EXAM_SIMULATION, config);
            
            // Check freemium limitations
            if (window.FreemiumManager && !window.FreemiumManager.canStartExam()) {
                window.FreemiumManager.showUpgradeModal('daily-limit');
                return { success: false, error: 'Daily exam limit reached' };
            }

            // Configure session
            const sessionConfig = {
                mode: mode.id,
                specialty: config.specialty || '',
                difficulty: config.difficulty || '',
                questionsCount: mode.questionsCount,
                timeLimit: mode.timeLimit,
                showExplanations: mode.showExplanations,
                allowPause: mode.allowPause
            };

            // Start session timer for full duration
            if (mode.timeLimit > 0) {
                TimerService.startSessionTimer(mode.timeLimit);
            }

            // Configure and start session
            SessionManager.configureSession(sessionConfig);
            const result = SessionManager.startSession();

            if (result.success) {
                // Increment usage tracking
                if (window.FreemiumManager) {
                    window.FreemiumManager.incrementExamCount();
                }
                
                CommonUtils.createToast('Simulación de examen iniciada. ¡Buena suerte!', 'info');
                this.notifyListeners('sessionStarted', { mode, result });
            }

            return result;
        } catch (error) {
            window.ErrorHandler?.logError(error, 'PracticeModeController.startExamSimulation');
            return { success: false, error: error.message };
        }
    }

    async startTimedPractice(config = {}) {
        try {
            const mode = this.selectMode(AppConstants.PRACTICE_MODES.TIMED_PRACTICE, config);
            
            const sessionConfig = {
                mode: mode.id,
                specialty: config.specialty || '',
                difficulty: config.difficulty || '',
                questionsCount: config.questionsCount || mode.questionsCount,
                timeLimit: config.timeLimit || mode.timeLimit,
                showExplanations: mode.showExplanations,
                allowPause: mode.allowPause
            };

            // Start session timer
            if (sessionConfig.timeLimit > 0) {
                TimerService.startSessionTimer(sessionConfig.timeLimit);
            }

            SessionManager.configureSession(sessionConfig);
            const result = SessionManager.startSession();

            if (result.success) {
                const timeText = sessionConfig.timeLimit > 0 
                    ? `${Math.floor(sessionConfig.timeLimit / 60)} minutos` 
                    : 'sin límite de tiempo';
                CommonUtils.createToast(
                    `Práctica cronometrada iniciada - ${timeText}`, 
                    'info'
                );
                this.notifyListeners('sessionStarted', { mode, result });
            }

            return result;
        } catch (error) {
            window.ErrorHandler?.logError(error, 'PracticeModeController.startTimedPractice');
            return { success: false, error: error.message };
        }
    }

    async startStudyMode(config = {}) {
        try {
            const mode = this.selectMode(AppConstants.PRACTICE_MODES.STUDY, config);
            
            const sessionConfig = {
                mode: mode.id,
                specialty: config.specialty || '',
                difficulty: config.difficulty || '',
                questionsCount: config.questionsCount || mode.questionsCount,
                timeLimit: 0, // No time limit in study mode
                showExplanations: mode.showExplanations,
                allowPause: mode.allowPause
            };

            SessionManager.configureSession(sessionConfig);
            const result = SessionManager.startSession();

            if (result.success) {
                CommonUtils.createToast('Modo estudio iniciado', 'info');
                this.notifyListeners('sessionStarted', { mode, result });
            }

            return result;
        } catch (error) {
            window.ErrorHandler?.logError(error, 'PracticeModeController.startStudyMode');
            return { success: false, error: error.message };
        }
    }

    async startReviewMode(config = {}) {
        try {
            // Get incorrect questions
            const incorrectQuestions = this.getIncorrectQuestions();
            
            if (incorrectQuestions.length === 0) {
                CommonUtils.createToast(
                    'No tienes preguntas incorrectas para revisar. ¡Excelente trabajo!', 
                    'info'
                );
                return { success: false, error: 'No incorrect questions available' };
            }

            const mode = this.selectMode(AppConstants.PRACTICE_MODES.REVIEW, {
                questionsCount: Math.min(incorrectQuestions.length, config.maxQuestions || 50)
            });
            
            const sessionConfig = {
                mode: mode.id,
                specialty: config.specialty || '',
                difficulty: config.difficulty || '',
                questionsCount: mode.questionsCount,
                timeLimit: config.timeLimit || 0,
                showExplanations: mode.showExplanations,
                allowPause: mode.allowPause
            };

            SessionManager.configureSession(sessionConfig);
            
            // Filter to only incorrect questions
            const filteredQuestions = this.filterIncorrectQuestions(incorrectQuestions, config);
            const result = SessionManager.startSession(filteredQuestions);

            if (result.success) {
                CommonUtils.createToast(
                    `Revisando ${filteredQuestions.length} preguntas incorrectas`, 
                    'info'
                );
                this.notifyListeners('sessionStarted', { mode, result });
            }

            return result;
        } catch (error) {
            window.ErrorHandler?.logError(error, 'PracticeModeController.startReviewMode');
            return { success: false, error: error.message };
        }
    }

    async startRandomQuestion() {
        try {
            const mode = this.selectMode(AppConstants.PRACTICE_MODES.RANDOM);
            
            const result = SessionManager.showRandomQuestion();

            if (result.success) {
                // Start question timer
                TimerService.startQuestionTimer(mode.timeLimit);
                this.notifyListeners('randomQuestionStarted', { mode, result });
            }

            return result;
        } catch (error) {
            window.ErrorHandler?.logError(error, 'PracticeModeController.startRandomQuestion');
            return { success: false, error: error.message };
        }
    }

    // Configuration Helpers
    validateModeConfig(modeId, config) {
        const mode = this.availableModes[modeId];
        if (!mode) {
            return { valid: false, errors: ['Invalid practice mode'] };
        }

        const errors = [];

        if (!mode.allowCustomConfig && Object.keys(config).length > 0) {
            errors.push('This mode does not allow custom configuration');
        }

        if (config.questionsCount) {
            if (config.questionsCount < 1 || config.questionsCount > 500) {
                errors.push('Questions count must be between 1 and 500');
            }
        }

        if (config.timeLimit !== undefined) {
            if (config.timeLimit < 0) {
                errors.push('Time limit cannot be negative');
            }
            if (modeId === AppConstants.PRACTICE_MODES.STUDY && config.timeLimit > 0) {
                errors.push('Study mode should not have time limit');
            }
        }

        if (config.specialty && !AppConstants.CATEGORIES.includes(config.specialty)) {
            errors.push('Invalid specialty selected');
        }

        if (config.difficulty && !AppConstants.QUESTION.DIFFICULTIES.includes(config.difficulty)) {
            errors.push('Invalid difficulty level');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    getDefaultConfigForMode(modeId) {
        const mode = this.availableModes[modeId];
        if (!mode) {
            return null;
        }

        return {
            specialty: '',
            difficulty: '',
            questionsCount: mode.questionsCount,
            timeLimit: mode.timeLimit,
            showExplanations: mode.showExplanations,
            allowPause: mode.allowPause
        };
    }

    // Question Management Helpers
    getIncorrectQuestions() {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        if (!progress.answers) return [];
        
        // Get unique incorrect question IDs
        const incorrectIds = new Set();
        progress.answers
            .filter(a => !a.isCorrect)
            .forEach(a => incorrectIds.add(a.questionId));
        
        // Get the actual question objects
        const questionBank = window.questionBank || [];
        return questionBank.filter(q => incorrectIds.has(q.id));
    }

    filterIncorrectQuestions(incorrectQuestions, config) {
        let filtered = [...incorrectQuestions];
        
        if (config.specialty) {
            filtered = filtered.filter(q => 
                q.category.toLowerCase().includes(config.specialty.toLowerCase())
            );
        }
        
        if (config.difficulty) {
            filtered = filtered.filter(q => q.difficulty === config.difficulty);
        }
        
        // Limit to configured count
        if (config.maxQuestions) {
            filtered = CommonUtils.shuffleArray(filtered).slice(0, config.maxQuestions);
        }
        
        return filtered;
    }

    // Mode Management
    getAllModes() {
        return Object.keys(this.availableModes).map(id => ({
            id,
            ...this.availableModes[id]
        }));
    }

    getAvailableModes() {
        // Could filter based on user permissions, features unlocked, etc.
        return this.getAllModes();
    }

    getModeByName(name) {
        const entry = Object.entries(this.availableModes).find(([id, mode]) => 
            mode.name.toLowerCase() === name.toLowerCase()
        );
        return entry ? { id: entry[0], ...entry[1] } : null;
    }

    // Session Control
    pauseCurrentSession() {
        if (!this.currentMode || !this.currentMode.allowPause) {
            return { success: false, error: 'Current mode does not allow pausing' };
        }

        // Pause timers
        TimerService.pauseTimer('question-timer');
        TimerService.pauseTimer('session-timer');
        
        this.notifyListeners('sessionPaused', { mode: this.currentMode });
        CommonUtils.createToast('Sesión pausada', 'info');
        
        return { success: true };
    }

    resumeCurrentSession() {
        if (!this.currentMode) {
            return { success: false, error: 'No active session to resume' };
        }

        // Resume timers
        TimerService.resumeTimer('question-timer');
        TimerService.resumeTimer('session-timer');
        
        this.notifyListeners('sessionResumed', { mode: this.currentMode });
        CommonUtils.createToast('Sesión reanudada', 'info');
        
        return { success: true };
    }

    endCurrentSession() {
        if (this.currentMode) {
            // Stop all timers
            TimerService.stopTimer('question-timer');
            TimerService.stopTimer('session-timer');
            
            const mode = this.currentMode;
            this.currentMode = null;
            
            this.notifyListeners('sessionEnded', { mode });
        }
        
        return SessionManager.endSession();
    }

    // Statistics and Analytics
    getModeStatistics() {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        const sessions = progress.sessions || [];
        
        const modeStats = {};
        
        Object.keys(this.availableModes).forEach(modeId => {
            const modeSessions = sessions.filter(s => s.config && s.config.mode === modeId);
            
            modeStats[modeId] = {
                totalSessions: modeSessions.length,
                totalQuestions: modeSessions.reduce((sum, s) => sum + (s.summary?.totalQuestions || 0), 0),
                averageAccuracy: this.calculateAverageAccuracy(modeSessions),
                totalTime: modeSessions.reduce((sum, s) => sum + (s.summary?.totalTime || 0), 0),
                lastUsed: modeSessions.length > 0 
                    ? Math.max(...modeSessions.map(s => new Date(s.endTime || s.startTime).getTime()))
                    : null
            };
        });
        
        return modeStats;
    }

    calculateAverageAccuracy(sessions) {
        if (sessions.length === 0) return 0;
        
        const totalAccuracy = sessions.reduce((sum, s) => sum + (s.summary?.accuracy || 0), 0);
        return Math.round(totalAccuracy / sessions.length);
    }

    // Event System
    addEventListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    removeEventListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback({ event, data });
            } catch (error) {
                window.ErrorHandler?.logError(error, `PracticeModeController.${event}Listener`);
            }
        });
    }
}

// Create singleton instance
const practiceModeController = new PracticeModeController();

// Export as global
window.PracticeModeController = practiceModeController;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = practiceModeController;
}