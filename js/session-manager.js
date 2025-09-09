// ENARM Prep - Session Management Service
class SessionManager {
    constructor() {
        this.currentSession = null;
        this.currentQuestion = null;
        this.currentQuestionIndex = 0;
        this.sessionQuestions = [];
        this.sessionResults = [];
        this.sessionConfig = {
            specialty: '',
            difficulty: '',
            questionsCount: 10,
            timeLimit: 0,
            mode: 'study'
        };
        
        this.listeners = {
            sessionStart: [],
            questionShow: [],
            answerSubmit: [],
            sessionEnd: []
        };
    }

    // Session Configuration
    configureSession(config) {
        this.sessionConfig = {
            ...this.sessionConfig,
            ...config
        };
        return this.sessionConfig;
    }

    // Session Lifecycle
    startSession(questions = null) {
        try {
            this.currentSession = {
                id: CommonUtils.generateId('session_'),
                startTime: new Date().toISOString(),
                config: { ...this.sessionConfig },
                questions: questions || this.getFilteredQuestions(),
                results: [],
                status: 'active'
            };

            this.sessionQuestions = CommonUtils.shuffleArray(this.currentSession.questions)
                .slice(0, this.sessionConfig.questionsCount);
            
            this.sessionResults = [];
            this.currentQuestionIndex = 0;

            this.notifyListeners('sessionStart', {
                session: this.currentSession,
                questionsCount: this.sessionQuestions.length
            });

            if (this.sessionQuestions.length > 0) {
                this.showCurrentQuestion();
                return { success: true, session: this.currentSession };
            } else {
                throw new Error('No questions available with current filters');
            }
        } catch (error) {
            ErrorHandler.logError(error, 'SessionManager.startSession');
            return { success: false, error: error.message };
        }
    }

    endSession() {
        if (!this.currentSession) {
            return { success: false, error: 'No active session' };
        }

        this.currentSession.endTime = new Date().toISOString();
        this.currentSession.status = 'completed';
        this.currentSession.results = [...this.sessionResults];

        const sessionSummary = this.calculateSessionSummary();
        
        // Save session to progress
        this.saveSessionToProgress();

        this.notifyListeners('sessionEnd', {
            session: this.currentSession,
            summary: sessionSummary
        });

        const completedSession = { ...this.currentSession };
        this.resetSession();
        
        return { success: true, session: completedSession, summary: sessionSummary };
    }

    resetSession() {
        this.currentSession = null;
        this.currentQuestion = null;
        this.currentQuestionIndex = 0;
        this.sessionQuestions = [];
        this.sessionResults = [];
    }

    // Question Management
    showCurrentQuestion() {
        if (this.currentQuestionIndex >= this.sessionQuestions.length) {
            return this.endSession();
        }

        this.currentQuestion = this.sessionQuestions[this.currentQuestionIndex];
        
        const questionData = {
            question: this.currentQuestion,
            index: this.currentQuestionIndex,
            total: this.sessionQuestions.length,
            sessionId: this.currentSession?.id
        };

        this.notifyListeners('questionShow', questionData);
        return { success: true, questionData };
    }

    submitAnswer(selectedAnswer) {
        if (!this.currentQuestion || !selectedAnswer) {
            return { success: false, error: 'Invalid question or answer' };
        }

        const isCorrect = selectedAnswer === this.currentQuestion.correct;
        const timeSpent = this.getQuestionTimeSpent();

        const result = {
            questionId: this.currentQuestion.id,
            question: this.currentQuestion,
            selectedAnswer,
            correctAnswer: this.currentQuestion.correct,
            isCorrect,
            timeSpent,
            timestamp: new Date().toISOString()
        };

        this.sessionResults.push(result);

        // Record in progress tracking
        this.recordAnswerInProgress(result);

        this.notifyListeners('answerSubmit', {
            result,
            explanation: this.currentQuestion.explanation,
            reference: this.currentQuestion.reference
        });

        return { success: true, result };
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.sessionQuestions.length) {
            return this.endSession();
        } else {
            return this.showCurrentQuestion();
        }
    }

    // Random Question Mode
    showRandomQuestion() {
        try {
            const questions = window.questionBank || [];
            if (questions.length === 0) {
                throw new Error('No questions available');
            }

            const randomQuestion = CommonUtils.getRandomElement(questions);
            this.startSingleQuestionSession(randomQuestion);
            
            return { success: true, question: randomQuestion };
        } catch (error) {
            ErrorHandler.logError(error, 'SessionManager.showRandomQuestion');
            return { success: false, error: error.message };
        }
    }

    startSingleQuestionSession(question) {
        this.currentSession = {
            id: CommonUtils.generateId('single_'),
            startTime: new Date().toISOString(),
            config: { mode: 'single', questionsCount: 1 },
            questions: [question],
            results: [],
            status: 'active'
        };

        this.sessionQuestions = [question];
        this.sessionResults = [];
        this.currentQuestionIndex = 0;
        this.currentQuestion = question;

        this.notifyListeners('questionShow', {
            question,
            index: 0,
            total: 1,
            sessionId: this.currentSession.id
        });
    }

    // Question Filtering
    getFilteredQuestions() {
        let questions = [...(window.questionBank || [])];
        
        if (this.sessionConfig.specialty) {
            questions = questions.filter(q => 
                q.category.toLowerCase().includes(this.sessionConfig.specialty.toLowerCase())
            );
        }
        
        if (this.sessionConfig.difficulty) {
            questions = questions.filter(q => 
                q.difficulty === this.sessionConfig.difficulty
            );
        }
        
        if (this.sessionConfig.mode === 'review') {
            const incorrectQuestions = this.getIncorrectQuestions();
            questions = questions.filter(q => incorrectQuestions.includes(q.id));
        }
        
        return questions;
    }

    getIncorrectQuestions() {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        if (!progress.answers) return [];
        
        return progress.answers
            .filter(a => !a.isCorrect)
            .map(a => a.questionId);
    }

    // Session Statistics
    calculateSessionSummary() {
        const correctAnswers = this.sessionResults.filter(r => r.isCorrect).length;
        const totalQuestions = this.sessionResults.length;
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const totalTime = this.sessionResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
        const averageTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;

        return {
            totalQuestions,
            correctAnswers,
            incorrectAnswers: totalQuestions - correctAnswers,
            accuracy: Math.round(accuracy),
            totalTime,
            averageTime: Math.round(averageTime),
            categoryBreakdown: this.getCategoryBreakdown(),
            difficultyBreakdown: this.getDifficultyBreakdown()
        };
    }

    getCategoryBreakdown() {
        const breakdown = {};
        this.sessionResults.forEach(result => {
            const category = result.question.category;
            if (!breakdown[category]) {
                breakdown[category] = { total: 0, correct: 0 };
            }
            breakdown[category].total++;
            if (result.isCorrect) {
                breakdown[category].correct++;
            }
        });
        return breakdown;
    }

    getDifficultyBreakdown() {
        const breakdown = {};
        this.sessionResults.forEach(result => {
            const difficulty = result.question.difficulty;
            if (!breakdown[difficulty]) {
                breakdown[difficulty] = { total: 0, correct: 0 };
            }
            breakdown[difficulty].total++;
            if (result.isCorrect) {
                breakdown[difficulty].correct++;
            }
        });
        return breakdown;
    }

    // Progress Integration
    recordAnswerInProgress(result) {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        
        if (!progress.answers) {
            progress.answers = [];
        }
        
        if (!progress.categories) {
            progress.categories = {};
        }
        
        const answerRecord = {
            questionId: result.questionId,
            category: result.question.category,
            difficulty: result.question.difficulty,
            isCorrect: result.isCorrect,
            timeSpent: result.timeSpent,
            timestamp: result.timestamp
        };
        
        progress.answers.push(answerRecord);
        
        // Update category stats
        const category = result.question.category;
        if (!progress.categories[category]) {
            progress.categories[category] = { total: 0, correct: 0 };
        }
        
        progress.categories[category].total++;
        if (result.isCorrect) {
            progress.categories[category].correct++;
        }
        
        StorageService.setItem(AppConstants.STORAGE_KEYS.PROGRESS, progress);
    }

    saveSessionToProgress() {
        if (!this.currentSession) return;

        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        if (!progress.sessions) {
            progress.sessions = [];
        }

        const sessionData = {
            id: this.currentSession.id,
            startTime: this.currentSession.startTime,
            endTime: this.currentSession.endTime,
            config: this.currentSession.config,
            summary: this.calculateSessionSummary(),
            results: this.sessionResults
        };

        progress.sessions.push(sessionData);
        
        // Keep only last 50 sessions for performance
        if (progress.sessions.length > 50) {
            progress.sessions = progress.sessions.slice(-50);
        }

        StorageService.setItem(AppConstants.STORAGE_KEYS.PROGRESS, progress);
    }

    // Utility Methods
    getQuestionTimeSpent() {
        // This would integrate with TimerService
        return AppConstants.TIMER.DEFAULT_QUESTION_TIME;
    }

    getCurrentSessionInfo() {
        if (!this.currentSession) {
            return null;
        }

        return {
            id: this.currentSession.id,
            config: this.currentSession.config,
            currentQuestionIndex: this.currentQuestionIndex,
            totalQuestions: this.sessionQuestions.length,
            currentQuestion: this.currentQuestion,
            results: this.sessionResults,
            summary: this.calculateSessionSummary()
        };
    }

    // Event System
    addEventListener(event, callback) {
        if (this.listeners[event] && typeof callback === 'function') {
            this.listeners[event].push(callback);
        }
    }

    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    ErrorHandler.logError(error, `SessionManager.${event}Listener`);
                }
            });
        }
    }

    // Validation
    validateSessionConfig(config) {
        const errors = [];
        
        if (config.questionsCount && (config.questionsCount < 1 || config.questionsCount > 500)) {
            errors.push('Questions count must be between 1 and 500');
        }
        
        if (config.timeLimit && config.timeLimit < 0) {
            errors.push('Time limit cannot be negative');
        }
        
        if (config.difficulty && !AppConstants.QUESTION.DIFFICULTIES.includes(config.difficulty)) {
            errors.push('Invalid difficulty level');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Export as global
window.SessionManager = sessionManager;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = sessionManager;
}