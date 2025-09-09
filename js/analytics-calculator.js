// ENARM Prep - Analytics and Performance Calculator
class AnalyticsCalculator {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Core Analytics Methods
    calculateOverallStats(progressData) {
        const cacheKey = 'overall_stats';
        const cached = this.getCachedResult(cacheKey, progressData);
        if (cached) return cached;

        const stats = {
            totalQuestions: 0,
            correctAnswers: 0,
            accuracy: 0,
            totalTime: 0,
            averageTime: 0,
            studyStreak: 0,
            bestStreak: 0,
            sessions: 0,
            categoriesStudied: 0,
            improvementTrend: 'stable',
            strengthCategories: [],
            weaknessCategories: [],
            studyPatterns: this.analyzeStudyPatterns(progressData),
            performanceLevel: 'beginner'
        };

        // Process sessions data
        const sessions = progressData.sessions || [];
        stats.sessions = sessions.length;
        
        sessions.forEach(session => {
            const summary = session.summary || {};
            stats.totalQuestions += summary.totalQuestions || 0;
            stats.correctAnswers += summary.correctAnswers || 0;
            stats.totalTime += summary.totalTime || 0;
        });

        // Calculate derived metrics
        if (stats.totalQuestions > 0) {
            stats.accuracy = Math.round((stats.correctAnswers / stats.totalQuestions) * 100);
            stats.averageTime = Math.round(stats.totalTime / stats.totalQuestions);
        }

        // Category analysis
        const categoryStats = this.calculateCategoryStats(progressData);
        stats.categoriesStudied = Object.keys(categoryStats).length;
        stats.strengthCategories = this.identifyStrengths(categoryStats);
        stats.weaknessCategories = this.identifyWeaknesses(categoryStats);

        // Performance level
        stats.performanceLevel = this.determinePerformanceLevel(stats);

        // Improvement trend
        stats.improvementTrend = this.calculateImprovementTrend(progressData);

        // Study streaks
        stats.studyStreak = progressData.user?.studyStreak || 0;
        stats.bestStreak = progressData.statistics?.bestStreak || 0;

        this.setCachedResult(cacheKey, stats, progressData);
        return stats;
    }

    calculateCategoryStats(progressData) {
        const cacheKey = 'category_stats';
        const cached = this.getCachedResult(cacheKey, progressData);
        if (cached) return cached;

        const categories = {};
        const sessions = progressData.sessions || [];

        sessions.forEach(session => {
            if (session.summary && session.summary.categoryBreakdown) {
                Object.entries(session.summary.categoryBreakdown).forEach(([category, stats]) => {
                    if (!categories[category]) {
                        categories[category] = {
                            total: 0,
                            correct: 0,
                            sessions: 0,
                            averageTime: 0,
                            totalTime: 0,
                            improvement: 0,
                            difficulty: 'unknown',
                            mastery: 'beginner'
                        };
                    }

                    categories[category].total += stats.total;
                    categories[category].correct += stats.correct;
                    categories[category].sessions++;
                });
            }
        });

        // Calculate derived metrics for each category
        Object.entries(categories).forEach(([category, stats]) => {
            stats.accuracy = stats.total > 0 ? 
                Math.round((stats.correct / stats.total) * 100) : 0;
            
            stats.averageTime = stats.sessions > 0 ? 
                Math.round(stats.totalTime / stats.sessions) : 0;
            
            stats.improvement = this.calculateCategoryImprovement(category, progressData);
            stats.difficulty = this.assessCategoryDifficulty(stats);
            stats.mastery = this.assessMasteryLevel(stats);
        });

        this.setCachedResult(cacheKey, categories, progressData);
        return categories;
    }

    calculatePerformanceTrends(progressData, timeframe = 30) {
        const cacheKey = `trends_${timeframe}`;
        const cached = this.getCachedResult(cacheKey, progressData);
        if (cached) return cached;

        const sessions = progressData.sessions || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeframe);

        const recentSessions = sessions.filter(session => 
            new Date(session.startTime) >= cutoffDate
        ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        const trends = {
            accuracyTrend: [],
            speedTrend: [],
            volumeTrend: [],
            consistencyScore: 0,
            improvementRate: 0,
            predictedPerformance: 0,
            studyEfficiency: 0,
            optimalStudyTime: null
        };

        // Group sessions by day
        const dailyData = this.groupSessionsByDay(recentSessions);
        
        // Calculate trends
        trends.accuracyTrend = this.calculateAccuracyTrend(dailyData);
        trends.speedTrend = this.calculateSpeedTrend(dailyData);
        trends.volumeTrend = this.calculateVolumeTrend(dailyData);
        trends.consistencyScore = this.calculateConsistencyScore(dailyData);
        trends.improvementRate = this.calculateImprovementRate(trends.accuracyTrend);
        trends.predictedPerformance = this.predictFuturePerformance(trends);
        trends.studyEfficiency = this.calculateStudyEfficiency(dailyData);
        trends.optimalStudyTime = this.identifyOptimalStudyTime(recentSessions);

        this.setCachedResult(cacheKey, trends, progressData);
        return trends;
    }

    // Advanced Analytics
    analyzeStudyPatterns(progressData) {
        const sessions = progressData.sessions || [];
        if (sessions.length === 0) return null;

        const patterns = {
            preferredStudyTimes: [],
            sessionLengthPreference: 'short', // short, medium, long
            weekdayVsWeekend: { weekday: 0, weekend: 0 },
            consistentDays: [],
            avgSessionsPerDay: 0,
            studyIntensity: 'low', // low, medium, high
            breakPatterns: []
        };

        // Analyze study times
        const hourCounts = new Array(24).fill(0);
        const sessionLengths = [];

        sessions.forEach(session => {
            const startTime = new Date(session.startTime);
            const hour = startTime.getHours();
            hourCounts[hour]++;

            const duration = session.summary?.totalTime || 0;
            sessionLengths.push(duration);

            // Weekday vs Weekend
            const dayOfWeek = startTime.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                patterns.weekdayVsWeekend.weekend++;
            } else {
                patterns.weekdayVsWeekend.weekday++;
            }
        });

        // Find preferred study times
        const topHours = hourCounts
            .map((count, hour) => ({ hour, count }))
            .filter(item => item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        patterns.preferredStudyTimes = topHours.map(item => ({
            hour: item.hour,
            timeLabel: this.formatHourLabel(item.hour),
            frequency: item.count
        }));

        // Session length preference
        const avgSessionLength = sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length;
        if (avgSessionLength < 600) patterns.sessionLengthPreference = 'short'; // < 10 min
        else if (avgSessionLength < 1800) patterns.sessionLengthPreference = 'medium'; // < 30 min
        else patterns.sessionLengthPreference = 'long';

        // Study intensity
        const questionsPerSession = sessions.reduce((sum, s) => sum + (s.summary?.totalQuestions || 0), 0) / sessions.length;
        if (questionsPerSession < 10) patterns.studyIntensity = 'low';
        else if (questionsPerSession < 25) patterns.studyIntensity = 'medium';
        else patterns.studyIntensity = 'high';

        return patterns;
    }

    identifyLearningRecommendations(progressData) {
        const stats = this.calculateOverallStats(progressData);
        const categoryStats = this.calculateCategoryStats(progressData);
        const trends = this.calculatePerformanceTrends(progressData);
        
        const recommendations = [];

        // Performance-based recommendations
        if (stats.accuracy < 60) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                title: 'Reforzar Conceptos Básicos',
                description: 'Tu precisión está por debajo del 60%. Considera revisar los fundamentos.',
                action: 'study_mode',
                icon: '📚'
            });
        }

        if (stats.accuracy > 85) {
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                title: 'Desafío Avanzado',
                description: 'Excelente rendimiento. Intenta preguntas de mayor dificultad.',
                action: 'advanced_practice',
                icon: '🚀'
            });
        }

        // Category-based recommendations
        if (stats.weaknessCategories.length > 0) {
            const weakest = stats.weaknessCategories[0];
            recommendations.push({
                type: 'category',
                priority: 'high',
                title: `Mejorar en ${weakest.name}`,
                description: `Solo ${weakest.accuracy}% de precisión en esta especialidad.`,
                action: 'category_focus',
                category: weakest.name,
                icon: '🎯'
            });
        }

        // Study pattern recommendations
        if (stats.studyStreak === 0) {
            recommendations.push({
                type: 'habit',
                priority: 'medium',
                title: 'Establecer Rutina',
                description: 'Estudiar consistentemente mejora el rendimiento.',
                action: 'daily_practice',
                icon: '📅'
            });
        }

        // Time-based recommendations
        if (stats.averageTime > 180) { // > 3 minutes per question
            recommendations.push({
                type: 'efficiency',
                priority: 'medium',
                title: 'Mejorar Velocidad',
                description: 'Practica responder más rápido para el examen real.',
                action: 'timed_practice',
                icon: '⏱️'
            });
        }

        // Trend-based recommendations
        if (trends && trends.improvementRate < 0) {
            recommendations.push({
                type: 'trend',
                priority: 'high',
                title: 'Recuperar el Impulso',
                description: 'Tu rendimiento ha disminuido recientemente.',
                action: 'review_incorrect',
                icon: '📈'
            });
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // Predictive Analytics
    predictExamReadiness(progressData) {
        const stats = this.calculateOverallStats(progressData);
        const categoryStats = this.calculateCategoryStats(progressData);
        const trends = this.calculatePerformanceTrends(progressData);

        const readiness = {
            overallScore: 0,
            readinessLevel: 'not_ready', // not_ready, partially_ready, ready, very_ready
            strengths: [],
            weaknesses: [],
            recommendations: [],
            estimatedScore: 0,
            timeToReadiness: null,
            confidenceInterval: { min: 0, max: 0 }
        };

        // Calculate readiness score (0-100)
        let score = 0;

        // Volume factor (30% of score)
        const volumeScore = Math.min(100, (stats.totalQuestions / 500) * 100);
        score += volumeScore * 0.3;

        // Accuracy factor (40% of score)
        score += stats.accuracy * 0.4;

        // Consistency factor (20% of score)
        const consistencyScore = trends ? trends.consistencyScore : 50;
        score += consistencyScore * 0.2;

        // Category coverage (10% of score)
        const coverageScore = Math.min(100, (stats.categoriesStudied / 10) * 100);
        score += coverageScore * 0.1;

        readiness.overallScore = Math.round(score);

        // Determine readiness level
        if (score >= 85) readiness.readinessLevel = 'very_ready';
        else if (score >= 70) readiness.readinessLevel = 'ready';
        else if (score >= 50) readiness.readinessLevel = 'partially_ready';
        else readiness.readinessLevel = 'not_ready';

        // Estimate exam score
        readiness.estimatedScore = this.estimateExamScore(stats, trends);
        
        // Confidence interval
        const confidence = Math.min(95, Math.max(50, score));
        const margin = (100 - confidence) / 2;
        readiness.confidenceInterval = {
            min: Math.max(0, readiness.estimatedScore - margin),
            max: Math.min(100, readiness.estimatedScore + margin)
        };

        // Time to readiness estimate
        if (readiness.readinessLevel !== 'very_ready') {
            readiness.timeToReadiness = this.estimateTimeToReadiness(score, trends);
        }

        return readiness;
    }

    // Helper Methods
    groupSessionsByDay(sessions) {
        const dailyData = {};
        
        sessions.forEach(session => {
            const date = new Date(session.startTime).toISOString().split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = {
                    sessions: [],
                    totalQuestions: 0,
                    correctAnswers: 0,
                    totalTime: 0
                };
            }
            
            dailyData[date].sessions.push(session);
            dailyData[date].totalQuestions += session.summary?.totalQuestions || 0;
            dailyData[date].correctAnswers += session.summary?.correctAnswers || 0;
            dailyData[date].totalTime += session.summary?.totalTime || 0;
        });

        return dailyData;
    }

    calculateAccuracyTrend(dailyData) {
        return Object.entries(dailyData)
            .map(([date, data]) => ({
                date,
                accuracy: data.totalQuestions > 0 ? 
                    Math.round((data.correctAnswers / data.totalQuestions) * 100) : 0
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    calculateSpeedTrend(dailyData) {
        return Object.entries(dailyData)
            .map(([date, data]) => ({
                date,
                averageTime: data.totalQuestions > 0 ? 
                    Math.round(data.totalTime / data.totalQuestions) : 0
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    calculateVolumeTrend(dailyData) {
        return Object.entries(dailyData)
            .map(([date, data]) => ({
                date,
                questions: data.totalQuestions,
                sessions: data.sessions.length
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    calculateConsistencyScore(dailyData) {
        const days = Object.keys(dailyData);
        if (days.length < 3) return 50;

        const accuracies = Object.values(dailyData)
            .map(data => data.totalQuestions > 0 ? 
                (data.correctAnswers / data.totalQuestions) * 100 : 0);

        const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
        const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
        const standardDeviation = Math.sqrt(variance);

        // Lower standard deviation = higher consistency
        // Convert to 0-100 scale
        const consistencyScore = Math.max(0, 100 - (standardDeviation * 2));
        return Math.round(consistencyScore);
    }

    calculateImprovementRate(accuracyTrend) {
        if (accuracyTrend.length < 2) return 0;

        const first = accuracyTrend[0];
        const last = accuracyTrend[accuracyTrend.length - 1];
        const daysDiff = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
        
        if (daysDiff === 0) return 0;
        
        return ((last.accuracy - first.accuracy) / daysDiff);
    }

    identifyStrengths(categoryStats) {
        return Object.entries(categoryStats)
            .filter(([_, stats]) => stats.accuracy >= 80 && stats.total >= 10)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.accuracy - a.accuracy)
            .slice(0, 3);
    }

    identifyWeaknesses(categoryStats) {
        return Object.entries(categoryStats)
            .filter(([_, stats]) => stats.accuracy < 70 && stats.total >= 5)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 3);
    }

    determinePerformanceLevel(stats) {
        if (stats.accuracy >= 85 && stats.totalQuestions >= 200) return 'expert';
        if (stats.accuracy >= 75 && stats.totalQuestions >= 100) return 'advanced';
        if (stats.accuracy >= 65 && stats.totalQuestions >= 50) return 'intermediate';
        return 'beginner';
    }

    calculateImprovementTrend(progressData) {
        const sessions = progressData.sessions || [];
        if (sessions.length < 5) return 'stable';

        const recent = sessions.slice(-5);
        const older = sessions.slice(-10, -5);

        if (older.length === 0) return 'stable';

        const recentAvg = recent.reduce((sum, s) => sum + (s.summary?.accuracy || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, s) => sum + (s.summary?.accuracy || 0), 0) / older.length;

        const diff = recentAvg - olderAvg;
        if (diff > 5) return 'improving';
        if (diff < -5) return 'declining';
        return 'stable';
    }

    formatHourLabel(hour) {
        if (hour === 0) return '12:00 AM';
        if (hour < 12) return `${hour}:00 AM`;
        if (hour === 12) return '12:00 PM';
        return `${hour - 12}:00 PM`;
    }

    // Caching System
    getCachedResult(key, data) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        // Simple data hash check
        const currentHash = this.hashData(data);
        if (cached.dataHash !== currentHash) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.result;
    }

    setCachedResult(key, result, data) {
        this.cache.set(key, {
            result,
            timestamp: Date.now(),
            dataHash: this.hashData(data)
        });
    }

    hashData(data) {
        return JSON.stringify(data).length; // Simple hash - could be improved
    }

    clearCache() {
        this.cache.clear();
    }

    // Additional helper methods for exam predictions
    estimateExamScore(stats, trends) {
        let estimatedScore = stats.accuracy;
        
        // Adjust based on question volume (more practice generally improves real performance)
        if (stats.totalQuestions > 500) estimatedScore += 2;
        else if (stats.totalQuestions < 100) estimatedScore -= 3;
        
        // Adjust based on improvement trend
        if (trends && trends.improvementRate > 1) estimatedScore += 3;
        else if (trends && trends.improvementRate < -1) estimatedScore -= 3;
        
        // Adjust based on consistency
        if (trends && trends.consistencyScore > 80) estimatedScore += 2;
        else if (trends && trends.consistencyScore < 60) estimatedScore -= 2;
        
        return Math.max(0, Math.min(100, Math.round(estimatedScore)));
    }

    estimateTimeToReadiness(currentScore, trends) {
        const targetScore = 70; // Minimum readiness score
        const gap = targetScore - currentScore;
        
        if (gap <= 0) return 0;
        
        // Estimate improvement rate based on trends
        let improvementRate = 2; // Default: 2 points per week
        if (trends && trends.improvementRate > 0) {
            improvementRate = Math.max(1, trends.improvementRate * 7); // Convert daily to weekly
        }
        
        const weeksNeeded = Math.ceil(gap / improvementRate);
        return {
            weeks: weeksNeeded,
            days: weeksNeeded * 7,
            text: weeksNeeded === 1 ? '1 semana' : `${weeksNeeded} semanas`
        };
    }
}

// Create singleton instance
const analyticsCalculator = new AnalyticsCalculator();

// Export as global
window.AnalyticsCalculator = analyticsCalculator;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = analyticsCalculator;
}