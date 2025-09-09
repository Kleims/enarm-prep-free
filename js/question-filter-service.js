// ENARM Prep - Advanced Question Filtering Service
class QuestionFilterService {
    constructor() {
        this.filters = new Map();
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
        this.searchIndex = null;
        this.setupDefaultFilters();
    }

    // Default Filter Definitions
    setupDefaultFilters() {
        // Basic filters
        this.addFilter('category', (question, value) => {
            if (!value) return true;
            return question.category.toLowerCase().includes(value.toLowerCase());
        });

        this.addFilter('difficulty', (question, value) => {
            if (!value) return true;
            return question.difficulty === value;
        });

        this.addFilter('answered', (question, value) => {
            const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
            const answeredIds = (progress.answers || []).map(a => a.questionId);
            const isAnswered = answeredIds.includes(question.id);
            return value ? isAnswered : !isAnswered;
        });

        this.addFilter('correct', (question, value) => {
            const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
            const correctIds = (progress.answers || [])
                .filter(a => a.isCorrect)
                .map(a => a.questionId);
            const isCorrect = correctIds.includes(question.id);
            return value ? isCorrect : !isCorrect;
        });

        this.addFilter('incorrect', (question, value) => {
            const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
            const incorrectIds = (progress.answers || [])
                .filter(a => !a.isCorrect)
                .map(a => a.questionId);
            const isIncorrect = incorrectIds.includes(question.id);
            return value ? isIncorrect : !isIncorrect;
        });

        this.addFilter('bookmarked', (question, value) => {
            const bookmarks = StorageService.getItem(AppConstants.STORAGE_KEYS.BOOKMARKS, []);
            const isBookmarked = bookmarks.includes(question.id);
            return value ? isBookmarked : !isBookmarked;
        });

        // Advanced filters
        this.addFilter('text', (question, value) => {
            if (!value) return true;
            const searchText = value.toLowerCase();
            return question.question.toLowerCase().includes(searchText) ||
                   question.explanation.toLowerCase().includes(searchText) ||
                   Object.values(question.options).some(option => 
                       option.toLowerCase().includes(searchText)
                   );
        });

        this.addFilter('keywords', (question, keywords) => {
            if (!keywords || keywords.length === 0) return true;
            const questionText = `${question.question} ${question.explanation} ${Object.values(question.options).join(' ')}`.toLowerCase();
            return keywords.some(keyword => questionText.includes(keyword.toLowerCase()));
        });

        this.addFilter('recentlyAnswered', (question, days) => {
            if (!days) return true;
            const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const recentAnswer = (progress.answers || []).find(a => 
                a.questionId === question.id && 
                new Date(a.timestamp) >= cutoffDate
            );
            
            return !!recentAnswer;
        });

        this.addFilter('accuracyRange', (question, range) => {
            if (!range || !range.min || !range.max) return true;
            const accuracy = this.getQuestionAccuracy(question.id);
            return accuracy >= range.min && accuracy <= range.max;
        });

        this.addFilter('attemptCount', (question, range) => {
            if (!range) return true;
            const attempts = this.getQuestionAttempts(question.id);
            if (range.min !== undefined && attempts < range.min) return false;
            if (range.max !== undefined && attempts > range.max) return false;
            return true;
        });

        this.addFilter('timeRange', (question, range) => {
            if (!range) return true;
            const avgTime = this.getQuestionAverageTime(question.id);
            if (avgTime === 0) return true; // Not attempted yet
            if (range.min !== undefined && avgTime < range.min) return false;
            if (range.max !== undefined && avgTime > range.max) return false;
            return true;
        });

        // Smart filters
        this.addFilter('weakAreas', (question, enabled) => {
            if (!enabled) return true;
            const weakCategories = this.getWeakCategories();
            return weakCategories.includes(question.category);
        });

        this.addFilter('strongAreas', (question, enabled) => {
            if (!enabled) return true;
            const strongCategories = this.getStrongCategories();
            return strongCategories.includes(question.category);
        });

        this.addFilter('needsReview', (question, enabled) => {
            if (!enabled) return true;
            return this.questionNeedsReview(question);
        });

        this.addFilter('examFocus', (question, enabled) => {
            if (!enabled) return true;
            // Questions that are commonly tested in ENARM
            return this.isExamFocused(question);
        });

        this.addFilter('adaptive', (question, enabled) => {
            if (!enabled) return true;
            // Adaptive filtering based on user performance
            return this.isAdaptiveMatch(question);
        });
    }

    // Filter Management
    addFilter(name, filterFunction) {
        this.filters.set(name, {
            name,
            fn: filterFunction,
            active: false,
            value: null
        });
    }

    removeFilter(name) {
        this.filters.delete(name);
        this.clearCache();
    }

    activateFilter(name, value) {
        const filter = this.filters.get(name);
        if (filter) {
            filter.active = true;
            filter.value = value;
            this.clearCache();
        }
    }

    deactivateFilter(name) {
        const filter = this.filters.get(name);
        if (filter) {
            filter.active = false;
            filter.value = null;
            this.clearCache();
        }
    }

    // Question Filtering
    filterQuestions(questions, customFilters = {}) {
        const cacheKey = this.generateCacheKey(customFilters);
        const cached = this.getCachedResult(cacheKey);
        if (cached) return cached;

        try {
            let filteredQuestions = [...questions];

            // Apply active filters
            for (const [name, filter] of this.filters) {
                if (filter.active && filter.value !== null) {
                    filteredQuestions = filteredQuestions.filter(question => 
                        filter.fn(question, filter.value)
                    );
                }
            }

            // Apply custom filters
            for (const [name, value] of Object.entries(customFilters)) {
                const filter = this.filters.get(name);
                if (filter && value !== null && value !== undefined) {
                    filteredQuestions = filteredQuestions.filter(question => 
                        filter.fn(question, value)
                    );
                }
            }

            this.setCachedResult(cacheKey, filteredQuestions);
            return filteredQuestions;
        } catch (error) {
            ErrorHandler.logError(error, 'QuestionFilterService.filterQuestions');
            return questions; // Return original on error
        }
    }

    // Search Functionality
    searchQuestions(questions, query, options = {}) {
        if (!query || query.trim().length < 2) return questions;

        const searchOptions = {
            fuzzy: options.fuzzy !== false,
            threshold: options.threshold || 0.6,
            includeOptions: options.includeOptions !== false,
            includeExplanations: options.includeExplanations !== false,
            ...options
        };

        const results = [];
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);

        questions.forEach(question => {
            let score = 0;
            let matches = [];

            // Search in question text
            const questionText = question.question.toLowerCase();
            if (questionText.includes(queryLower)) {
                score += 10;
                matches.push('question');
            }

            // Search for individual words
            queryWords.forEach(word => {
                if (questionText.includes(word)) {
                    score += 3;
                }
            });

            // Search in options
            if (searchOptions.includeOptions) {
                Object.entries(question.options).forEach(([letter, option]) => {
                    const optionText = option.toLowerCase();
                    if (optionText.includes(queryLower)) {
                        score += 5;
                        matches.push(`option_${letter}`);
                    }
                    queryWords.forEach(word => {
                        if (optionText.includes(word)) {
                            score += 1;
                        }
                    });
                });
            }

            // Search in explanation
            if (searchOptions.includeExplanations && question.explanation) {
                const explanationText = question.explanation.toLowerCase();
                if (explanationText.includes(queryLower)) {
                    score += 3;
                    matches.push('explanation');
                }
                queryWords.forEach(word => {
                    if (explanationText.includes(word)) {
                        score += 0.5;
                    }
                });
            }

            // Category match
            if (question.category.toLowerCase().includes(queryLower)) {
                score += 5;
                matches.push('category');
            }

            if (score > 0) {
                results.push({
                    question,
                    score,
                    matches,
                    relevance: Math.min(100, Math.round(score * 10))
                });
            }
        });

        return results
            .sort((a, b) => b.score - a.score)
            .map(result => result.question);
    }

    // Smart Filtering Methods
    getRecommendedQuestions(questions, count = 10, options = {}) {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        const recommendations = [];

        questions.forEach(question => {
            let recommendationScore = 0;
            let reasons = [];

            // Factor 1: Weak categories (high priority)
            const weakCategories = this.getWeakCategories();
            if (weakCategories.includes(question.category)) {
                recommendationScore += 20;
                reasons.push('weak_category');
            }

            // Factor 2: Incorrect answers (high priority)
            const incorrectIds = (progress.answers || [])
                .filter(a => !a.isCorrect)
                .map(a => a.questionId);
            if (incorrectIds.includes(question.id)) {
                recommendationScore += 15;
                reasons.push('previously_incorrect');
            }

            // Factor 3: Never attempted (medium priority)
            const attemptedIds = (progress.answers || []).map(a => a.questionId);
            if (!attemptedIds.includes(question.id)) {
                recommendationScore += 10;
                reasons.push('never_attempted');
            }

            // Factor 4: Exam focus (medium priority)
            if (this.isExamFocused(question)) {
                recommendationScore += 8;
                reasons.push('exam_focus');
            }

            // Factor 5: Difficulty appropriate to user level
            const userLevel = this.getUserPerformanceLevel();
            if (this.isDifficultyAppropriate(question.difficulty, userLevel)) {
                recommendationScore += 5;
                reasons.push('appropriate_difficulty');
            }

            // Factor 6: Time since last attempt
            const daysSinceLastAttempt = this.getDaysSinceLastAttempt(question.id);
            if (daysSinceLastAttempt > 7) {
                recommendationScore += 3;
                reasons.push('needs_refresh');
            }

            if (recommendationScore > 0) {
                recommendations.push({
                    question,
                    score: recommendationScore,
                    reasons
                });
            }
        });

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(rec => rec.question);
    }

    getAdaptiveQuestions(questions, sessionResults = [], count = 10) {
        // Adaptive algorithm based on recent performance
        if (sessionResults.length === 0) {
            return this.getRecommendedQuestions(questions, count);
        }

        const recentAccuracy = sessionResults
            .slice(-5)
            .reduce((sum, result) => sum + (result.isCorrect ? 1 : 0), 0) / Math.min(5, sessionResults.length);

        let targetDifficulty;
        if (recentAccuracy > 0.8) targetDifficulty = 'avanzado';
        else if (recentAccuracy > 0.6) targetDifficulty = 'intermedio';
        else targetDifficulty = 'basico';

        // Filter by adaptive difficulty
        return this.filterQuestions(questions, {
            difficulty: targetDifficulty,
            answered: false
        }).slice(0, count);
    }

    // Analytics Helpers
    getQuestionAccuracy(questionId) {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        const attempts = (progress.answers || []).filter(a => a.questionId === questionId);
        
        if (attempts.length === 0) return 0;
        
        const correct = attempts.filter(a => a.isCorrect).length;
        return Math.round((correct / attempts.length) * 100);
    }

    getQuestionAttempts(questionId) {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        return (progress.answers || []).filter(a => a.questionId === questionId).length;
    }

    getQuestionAverageTime(questionId) {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        const attempts = (progress.answers || []).filter(a => a.questionId === questionId);
        
        if (attempts.length === 0) return 0;
        
        const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
        return Math.round(totalTime / attempts.length);
    }

    getWeakCategories() {
        if (window.AnalyticsCalculator) {
            const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
            const categoryStats = window.AnalyticsCalculator.calculateCategoryStats(progress);
            
            return Object.entries(categoryStats)
                .filter(([_, stats]) => stats.accuracy < 70 && stats.total >= 5)
                .map(([category, _]) => category);
        }
        return [];
    }

    getStrongCategories() {
        if (window.AnalyticsCalculator) {
            const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
            const categoryStats = window.AnalyticsCalculator.calculateCategoryStats(progress);
            
            return Object.entries(categoryStats)
                .filter(([_, stats]) => stats.accuracy >= 85 && stats.total >= 10)
                .map(([category, _]) => category);
        }
        return [];
    }

    questionNeedsReview(question) {
        // Logic to determine if a question needs review
        const attempts = this.getQuestionAttempts(question.id);
        const accuracy = this.getQuestionAccuracy(question.id);
        const daysSinceLastAttempt = this.getDaysSinceLastAttempt(question.id);
        
        return (attempts > 0 && accuracy < 70) || 
               (attempts > 0 && daysSinceLastAttempt > 14);
    }

    isExamFocused(question) {
        // Determine if question is commonly tested in ENARM
        // This could be based on tags, keywords, or categories
        const examFocusCategories = [
            'Medicina Interna', 'Pediatría', 'Cirugía General', 
            'Ginecología y Obstetricia', 'Medicina Familiar'
        ];
        
        return examFocusCategories.includes(question.category);
    }

    isAdaptiveMatch(question) {
        // Complex adaptive logic based on user's current state
        const userLevel = this.getUserPerformanceLevel();
        const weakCategories = this.getWeakCategories();
        const recentPerformance = this.getRecentPerformance();
        
        // Prioritize weak categories
        if (weakCategories.includes(question.category)) return true;
        
        // Match difficulty to performance
        if (recentPerformance > 0.8 && question.difficulty === 'avanzado') return true;
        if (recentPerformance < 0.6 && question.difficulty === 'basico') return true;
        if (recentPerformance >= 0.6 && recentPerformance <= 0.8 && question.difficulty === 'intermedio') return true;
        
        return false;
    }

    getUserPerformanceLevel() {
        if (window.AnalyticsCalculator) {
            const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
            const stats = window.AnalyticsCalculator.calculateOverallStats(progress);
            return stats.performanceLevel;
        }
        return 'beginner';
    }

    getRecentPerformance() {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        const recentAnswers = (progress.answers || []).slice(-10);
        
        if (recentAnswers.length === 0) return 0.5;
        
        const correct = recentAnswers.filter(a => a.isCorrect).length;
        return correct / recentAnswers.length;
    }

    isDifficultyAppropriate(questionDifficulty, userLevel) {
        const levelMap = {
            'beginner': ['basico'],
            'intermediate': ['basico', 'intermedio'],
            'advanced': ['intermedio', 'avanzado'],
            'expert': ['avanzado']
        };
        
        return levelMap[userLevel]?.includes(questionDifficulty) || false;
    }

    getDaysSinceLastAttempt(questionId) {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        const attempts = (progress.answers || []).filter(a => a.questionId === questionId);
        
        if (attempts.length === 0) return Infinity;
        
        const lastAttempt = attempts.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
        
        const daysDiff = (Date.now() - new Date(lastAttempt.timestamp)) / (1000 * 60 * 60 * 24);
        return Math.floor(daysDiff);
    }

    // Filter Presets
    saveFilterPreset(name, filterConfig) {
        const presets = StorageService.getItem('filter-presets', {});
        presets[name] = {
            ...filterConfig,
            createdAt: new Date().toISOString()
        };
        StorageService.setItem('filter-presets', presets);
    }

    loadFilterPreset(name) {
        const presets = StorageService.getItem('filter-presets', {});
        return presets[name] || null;
    }

    applyFilterPreset(name) {
        const preset = this.loadFilterPreset(name);
        if (!preset) return false;

        // Clear current filters
        for (const [filterName, filter] of this.filters) {
            filter.active = false;
            filter.value = null;
        }

        // Apply preset filters
        for (const [filterName, value] of Object.entries(preset)) {
            if (filterName !== 'createdAt') {
                this.activateFilter(filterName, value);
            }
        }

        return true;
    }

    getFilterPresets() {
        return StorageService.getItem('filter-presets', {});
    }

    deleteFilterPreset(name) {
        const presets = StorageService.getItem('filter-presets', {});
        delete presets[name];
        StorageService.setItem('filter-presets', presets);
    }

    // Caching System
    generateCacheKey(filters) {
        const activeFilters = {};
        for (const [name, filter] of this.filters) {
            if (filter.active) {
                activeFilters[name] = filter.value;
            }
        }
        
        return JSON.stringify({ active: activeFilters, custom: filters });
    }

    getCachedResult(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.result;
    }

    setCachedResult(key, result) {
        this.cache.set(key, {
            result,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // Utility Methods
    getActiveFilters() {
        const active = {};
        for (const [name, filter] of this.filters) {
            if (filter.active) {
                active[name] = filter.value;
            }
        }
        return active;
    }

    getFilterCount(questions) {
        return this.filterQuestions(questions).length;
    }

    getFilterStats(questions) {
        const total = questions.length;
        const filtered = this.filterQuestions(questions).length;
        
        return {
            total,
            filtered,
            excluded: total - filtered,
            percentage: total > 0 ? Math.round((filtered / total) * 100) : 0
        };
    }
}

// Create singleton instance
const questionFilterService = new QuestionFilterService();

// Export as global
window.QuestionFilterService = questionFilterService;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = questionFilterService;
}