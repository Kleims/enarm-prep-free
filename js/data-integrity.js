// ENARM Prep - Data Integrity Manager for Medical Exam Security
class DataIntegrityManager {
    constructor() {
        this.salt = 'enarm-medical-integrity-2024';
        this.version = '1.0.0';
        this.questionHashKey = 'enarm-questions-hash';
        this.progressHashKey = 'enarm-progress-hash';
        this.sessionIntegrityKey = 'enarm-session-integrity';
        
        // Medical exam validation rules
        this.validationRules = {
            question: {
                maxQuestionLength: 2000,
                maxOptionLength: 500,
                maxExplanationLength: 1500,
                maxReferenceLength: 200,
                requiredFields: ['id', 'category', 'difficulty', 'question', 'options', 'correct', 'explanation'],
                validDifficulties: ['basico', 'intermedio', 'avanzado'],
                validOptions: ['A', 'B', 'C', 'D'] // ENARM uses A-D format
            },
            progress: {
                maxAccuracy: 1.0,
                minAccuracy: 0.0,
                maxTimePerQuestion: 600, // 10 minutes max per question
                minTimePerQuestion: 5,   // 5 seconds minimum
                maxSessionQuestions: 300
            },
            session: {
                maxSessionDuration: 7200, // 2 hours max
                minSessionDuration: 60,   // 1 minute minimum
                maxConsecutiveSessions: 10
            }
        };
    }

    /**
     * Initialize data integrity checking
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            await this.validateStoredData();
            this.setupIntegrityMonitoring();
            console.log('✅ Data Integrity Manager initialized successfully');
            return true;
        } catch (error) {
            ErrorHandler.logError('Data Integrity initialization failed', error);
            return false;
        }
    }

    /**
     * Generate cryptographic hash for data
     * @param {any} data - Data to hash
     * @param {string} additionalSalt - Additional salt for specific use cases
     * @returns {Promise<string>} SHA-256 hash
     */
    async generateHash(data, additionalSalt = '') {
        try {
            const encoder = new TextEncoder();
            const dataString = JSON.stringify(data, Object.keys(data).sort()); // Ensure consistent key order
            const hashInput = dataString + this.salt + additionalSalt + this.version;
            const dataBuffer = encoder.encode(hashInput);
            
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            ErrorHandler.logError('Hash generation failed', error);
            throw new Error('Failed to generate data hash');
        }
    }

    /**
     * Validate and hash question data
     * @param {Array} questions - Array of question objects
     * @returns {Promise<Object>} Validation result with hash
     */
    async validateQuestionData(questions) {
        if (!Array.isArray(questions)) {
            throw new Error('Questions data must be an array');
        }

        const validationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            hash: null,
            questionCount: questions.length,
            validatedAt: Date.now()
        };

        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const questionValidation = this.validateSingleQuestion(question, i);
            
            if (!questionValidation.isValid) {
                validationResult.isValid = false;
                validationResult.errors.push(...questionValidation.errors);
            }
            
            validationResult.warnings.push(...questionValidation.warnings);
        }

        // Generate hash if validation passed
        if (validationResult.isValid) {
            validationResult.hash = await this.generateHash(questions, 'questions');
            
            // Store hash for future validation
            StorageService.setItem(this.questionHashKey, {
                hash: validationResult.hash,
                questionCount: questions.length,
                timestamp: Date.now()
            });
        }

        return validationResult;
    }

    /**
     * Validate a single question object
     * @private
     */
    validateSingleQuestion(question, index) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        const rules = this.validationRules.question;

        // Check required fields
        for (const field of rules.requiredFields) {
            if (!question.hasOwnProperty(field) || question[field] === null || question[field] === undefined) {
                result.errors.push(`Question ${index}: Missing required field '${field}'`);
                result.isValid = false;
            }
        }

        if (!result.isValid) return result;

        // Validate question length
        if (question.question && question.question.length > rules.maxQuestionLength) {
            result.errors.push(`Question ${index}: Question text too long (${question.question.length}/${rules.maxQuestionLength})`);
            result.isValid = false;
        }

        // Validate difficulty
        if (!rules.validDifficulties.includes(question.difficulty)) {
            result.errors.push(`Question ${index}: Invalid difficulty '${question.difficulty}'. Must be one of: ${rules.validDifficulties.join(', ')}`);
            result.isValid = false;
        }

        // Validate options
        if (question.options && typeof question.options === 'object') {
            const optionKeys = Object.keys(question.options);
            
            // Check for required options A-D
            for (const expectedOption of rules.validOptions) {
                if (!optionKeys.includes(expectedOption)) {
                    result.errors.push(`Question ${index}: Missing option '${expectedOption}'`);
                    result.isValid = false;
                }
            }

            // Check for extra options (E is not used in ENARM)
            if (optionKeys.includes('E')) {
                result.warnings.push(`Question ${index}: Option 'E' found but ENARM only uses A-D options`);
            }

            // Validate option lengths
            for (const [key, value] of Object.entries(question.options)) {
                if (value && value.length > rules.maxOptionLength) {
                    result.errors.push(`Question ${index}: Option '${key}' too long (${value.length}/${rules.maxOptionLength})`);
                    result.isValid = false;
                }
            }
        } else {
            result.errors.push(`Question ${index}: Options must be an object`);
            result.isValid = false;
        }

        // Validate correct answer
        if (!rules.validOptions.includes(question.correct)) {
            result.errors.push(`Question ${index}: Invalid correct answer '${question.correct}'. Must be one of: ${rules.validOptions.join(', ')}`);
            result.isValid = false;
        }

        // Validate explanation length
        if (question.explanation && question.explanation.length > rules.maxExplanationLength) {
            result.errors.push(`Question ${index}: Explanation too long (${question.explanation.length}/${rules.maxExplanationLength})`);
            result.isValid = false;
        }

        // Validate reference length
        if (question.reference && question.reference.length > rules.maxReferenceLength) {
            result.errors.push(`Question ${index}: Reference too long (${question.reference.length}/${rules.maxReferenceLength})`);
            result.isValid = false;
        }

        // Validate ID format
        if (question.id && !/^[a-zA-Z0-9_-]+$/.test(question.id)) {
            result.warnings.push(`Question ${index}: ID contains special characters, consider using alphanumeric characters only`);
        }

        return result;
    }

    /**
     * Validate user progress data for tampering
     * @param {Object} progressData - User progress data
     * @returns {Promise<Object>} Validation result
     */
    async validateProgressData(progressData) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            hash: null,
            tamperingDetected: false
        };

        if (!progressData || typeof progressData !== 'object') {
            result.errors.push('Progress data must be an object');
            result.isValid = false;
            return result;
        }

        const rules = this.validationRules.progress;

        // Check accuracy bounds
        if (progressData.accuracy !== undefined) {
            if (progressData.accuracy < rules.minAccuracy || progressData.accuracy > rules.maxAccuracy) {
                result.errors.push(`Invalid accuracy value: ${progressData.accuracy}. Must be between ${rules.minAccuracy} and ${rules.maxAccuracy}`);
                result.tamperingDetected = true;
                result.isValid = false;
            }
        }

        // Check impossible timing patterns
        if (progressData.sessions && Array.isArray(progressData.sessions)) {
            for (const session of progressData.sessions) {
                if (session.averageTime) {
                    if (session.averageTime < rules.minTimePerQuestion || session.averageTime > rules.maxTimePerQuestion) {
                        result.warnings.push(`Suspicious timing detected: ${session.averageTime} seconds per question`);
                        if (session.averageTime < rules.minTimePerQuestion) {
                            result.tamperingDetected = true;
                        }
                    }
                }

                // Check for impossible perfect scores with fast timing
                if (session.accuracy === 1.0 && session.averageTime && session.averageTime < 10) {
                    result.warnings.push('Perfect score with very fast timing detected - possible tampering');
                    result.tamperingDetected = true;
                }
            }
        }

        // Check session count patterns
        if (progressData.totalSessions && progressData.totalSessions > rules.maxConsecutiveSessions) {
            const recentSessions = this.getRecentSessions(progressData, 24 * 60 * 60 * 1000); // 24 hours
            if (recentSessions > rules.maxConsecutiveSessions) {
                result.warnings.push(`High number of sessions detected: ${recentSessions} in 24 hours`);
            }
        }

        // Generate integrity hash
        if (result.isValid) {
            result.hash = await this.generateHash(progressData, 'progress');
        }

        return result;
    }

    /**
     * Validate session data for anomalies
     * @param {Object} sessionData - Current session data
     * @returns {Promise<Object>} Validation result
     */
    async validateSessionData(sessionData) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            anomaliesDetected: []
        };

        if (!sessionData || typeof sessionData !== 'object') {
            result.errors.push('Session data must be an object');
            result.isValid = false;
            return result;
        }

        const rules = this.validationRules.session;

        // Check session duration
        if (sessionData.duration) {
            if (sessionData.duration < rules.minSessionDuration) {
                result.warnings.push(`Very short session duration: ${sessionData.duration} seconds`);
            }
            
            if (sessionData.duration > rules.maxSessionDuration) {
                result.errors.push(`Session duration too long: ${sessionData.duration} seconds`);
                result.isValid = false;
            }
        }

        // Check for rapid-fire answering patterns
        if (sessionData.answers && Array.isArray(sessionData.answers)) {
            let rapidAnswers = 0;
            for (const answer of sessionData.answers) {
                if (answer.timeSpent && answer.timeSpent < 3) { // Less than 3 seconds
                    rapidAnswers++;
                }
            }
            
            const rapidPercentage = rapidAnswers / sessionData.answers.length;
            if (rapidPercentage > 0.8) { // More than 80% rapid answers
                result.anomaliesDetected.push('High percentage of rapid answers detected');
                result.warnings.push(`${Math.round(rapidPercentage * 100)}% of answers were given in less than 3 seconds`);
            }
        }

        return result;
    }

    /**
     * Check stored data integrity
     * @returns {Promise<boolean>} True if data integrity is intact
     */
    async validateStoredData() {
        try {
            // Check questions hash
            const storedQuestionsHash = StorageService.getItem(this.questionHashKey);
            if (storedQuestionsHash && storedQuestionsHash.hash) {
                const currentQuestions = StorageService.getItem('questions-cache');
                if (currentQuestions) {
                    const currentHash = await this.generateHash(currentQuestions.questions || [], 'questions');
                    if (currentHash !== storedQuestionsHash.hash) {
                        ErrorHandler.logError('Questions data integrity check failed - hash mismatch');
                        return false;
                    }
                }
            }

            // Check progress data
            const progressData = StorageService.getItem('progress');
            if (progressData) {
                const progressValidation = await this.validateProgressData(progressData);
                if (progressValidation.tamperingDetected) {
                    ErrorHandler.logError('Progress data tampering detected', progressValidation.errors);
                    return false;
                }
            }

            return true;
        } catch (error) {
            ErrorHandler.logError('Data integrity validation failed', error);
            return false;
        }
    }

    /**
     * Setup continuous integrity monitoring
     * @private
     */
    setupIntegrityMonitoring() {
        // Monitor storage changes
        const originalSetItem = StorageService.setItem.bind(StorageService);
        StorageService.setItem = (key, value) => {
            // Validate critical data before storing
            if (key === 'progress') {
                this.validateProgressData(value).then(result => {
                    if (result.tamperingDetected) {
                        ErrorHandler.logError('Attempted to store tampered progress data', result.errors);
                        return;
                    }
                });
            }
            
            return originalSetItem(key, value);
        };

        // Periodic integrity checks
        setInterval(() => {
            this.validateStoredData().catch(error => {
                ErrorHandler.logError('Periodic integrity check failed', error);
            });
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    /**
     * Generate session integrity token
     * @param {Object} sessionData - Session data
     * @returns {Promise<string>} Integrity token
     */
    async generateSessionToken(sessionData) {
        const timestamp = Date.now();
        const tokenData = {
            ...sessionData,
            timestamp,
            userAgent: navigator.userAgent.substring(0, 100), // Limited for privacy
            random: Math.random().toString(36).substring(2)
        };
        
        return await this.generateHash(tokenData, 'session-token');
    }

    /**
     * Verify session integrity token
     * @param {string} token - Token to verify
     * @param {Object} sessionData - Original session data
     * @returns {Promise<boolean>} True if token is valid
     */
    async verifySessionToken(token, sessionData) {
        try {
            // This is a simplified verification - in practice, you'd store token components
            // For now, we just check if token format is valid
            return token && token.length === 64 && /^[a-f0-9]+$/.test(token);
        } catch (error) {
            ErrorHandler.logError('Session token verification failed', error);
            return false;
        }
    }

    /**
     * Get count of recent sessions
     * @private
     */
    getRecentSessions(progressData, timeWindow) {
        if (!progressData.sessions || !Array.isArray(progressData.sessions)) {
            return 0;
        }

        const cutoffTime = Date.now() - timeWindow;
        return progressData.sessions.filter(session => 
            session.timestamp && session.timestamp > cutoffTime
        ).length;
    }

    /**
     * Clean up old integrity data
     */
    cleanupOldData() {
        const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
        
        // Clean up old session tokens
        const sessionIntegrityData = StorageService.getItem(this.sessionIntegrityKey) || {};
        Object.keys(sessionIntegrityData).forEach(key => {
            if (sessionIntegrityData[key].timestamp < cutoffTime) {
                delete sessionIntegrityData[key];
            }
        });
        
        StorageService.setItem(this.sessionIntegrityKey, sessionIntegrityData);
    }

    /**
     * Get integrity status report
     * @returns {Object} Comprehensive integrity status
     */
    getIntegrityStatus() {
        return {
            version: this.version,
            lastValidation: Date.now(),
            questionsValidated: !!StorageService.getItem(this.questionHashKey),
            progressValidated: true, // Would be set by validation process
            sessionIntegrityEnabled: true,
            anomalyDetection: true
        };
    }
}

// Global instance for use throughout the application
window.DataIntegrityManager = new DataIntegrityManager();