// ENARM Progress Tracking and Analytics System
class ProgressManager {
    constructor() {
        this.storageKey = 'enarm-progress';
        this.sessionStorageKey = 'enarm-session';
        this.charts = {};
        this.init();
    }

    init() {
        this.initializeProgressData();
        this.updateStudyStreak();
    }

    // Data Initialization
    initializeProgressData() {
        const defaultData = {
            user: {
                name: '',
                startDate: new Date().toISOString(),
                totalStudyTime: 0,
                studyStreak: 0,
                lastStudyDate: null,
                preferences: {
                    dailyGoal: 20, // questions per day
                    preferredSubjects: [],
                    studyReminders: true
                }
            },
            statistics: {
                totalQuestions: 0,
                correctAnswers: 0,
                totalTime: 0,
                averageTime: 0,
                bestStreak: 0,
                currentStreak: 0
            },
            categories: {},
            sessions: [],
            performance: {
                daily: [],
                weekly: [],
                monthly: []
            },
            achievements: [],
            bookmarks: [],
            incorrectQuestions: []
        };

        const stored = localStorage.getItem(this.storageKey);
        if (!stored) {
            localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
        }
    }

    // Data Access
    getProgressData() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }

    saveProgressData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // Session Management
    startSession() {
        const session = {
            id: Date.now().toString(),
            startTime: new Date().toISOString(),
            endTime: null,
            questions: [],
            totalQuestions: 0,
            correctAnswers: 0,
            timeSpent: 0,
            categories: {},
            difficulties: {}
        };

        sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
        return session;
    }

    updateSession(questionData) {
        const session = JSON.parse(sessionStorage.getItem(this.sessionStorageKey) || '{}');
        
        if (!session.id) {
            return this.startSession();
        }

        session.questions.push(questionData);
        session.totalQuestions++;
        
        if (questionData.isCorrect) {
            session.correctAnswers++;
        }
        
        session.timeSpent += questionData.timeSpent || 0;
        
        // Update category stats
        const category = questionData.question.category;
        if (!session.categories[category]) {
            session.categories[category] = { total: 0, correct: 0 };
        }
        session.categories[category].total++;
        if (questionData.isCorrect) {
            session.categories[category].correct++;
        }

        // Update difficulty stats
        const difficulty = questionData.question.difficulty;
        if (!session.difficulties[difficulty]) {
            session.difficulties[difficulty] = { total: 0, correct: 0 };
        }
        session.difficulties[difficulty].total++;
        if (questionData.isCorrect) {
            session.difficulties[difficulty].correct++;
        }

        sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
        return session;
    }

    endSession() {
        const session = JSON.parse(sessionStorage.getItem(this.sessionStorageKey) || '{}');
        
        if (!session.id) {
            return null;
        }

        session.endTime = new Date().toISOString();
        
        // Save to permanent storage
        this.saveSession(session);
        
        // Clear session storage
        sessionStorage.removeItem(this.sessionStorageKey);
        
        return session;
    }

    saveSession(session) {
        const data = this.getProgressData();
        
        // Add to sessions array
        data.sessions.push(session);
        
        // Update overall statistics
        data.statistics.totalQuestions += session.totalQuestions;
        data.statistics.correctAnswers += session.correctAnswers;
        data.statistics.totalTime += session.timeSpent;
        data.statistics.averageTime = data.statistics.totalTime / data.statistics.totalQuestions;
        
        // Update category statistics
        Object.entries(session.categories).forEach(([category, stats]) => {
            if (!data.categories[category]) {
                data.categories[category] = { total: 0, correct: 0, sessions: 0 };
            }
            data.categories[category].total += stats.total;
            data.categories[category].correct += stats.correct;
            data.categories[category].sessions++;
        });

        // Update daily performance
        this.updateDailyPerformance(data, session);
        
        // Update study streak
        this.updateStudyStreakAfterSession(data);
        
        // Check achievements
        this.checkAchievements(data, session);
        
        // Save incorrect questions
        session.questions.forEach(q => {
            if (!q.isCorrect) {
                if (!data.incorrectQuestions.some(iq => iq.id === q.question.id)) {
                    data.incorrectQuestions.push({
                        id: q.question.id,
                        question: q.question,
                        attempts: 1,
                        lastAttempt: new Date().toISOString()
                    });
                } else {
                    const existing = data.incorrectQuestions.find(iq => iq.id === q.question.id);
                    existing.attempts++;
                    existing.lastAttempt = new Date().toISOString();
                }
            } else {
                // Remove from incorrect questions if answered correctly
                data.incorrectQuestions = data.incorrectQuestions.filter(iq => iq.id !== q.question.id);
            }
        });

        this.saveProgressData(data);
    }

    // Performance Tracking
    updateDailyPerformance(data, session) {
        const today = new Date().toISOString().split('T')[0];
        let todayPerformance = data.performance.daily.find(d => d.date === today);
        
        if (!todayPerformance) {
            todayPerformance = {
                date: today,
                questions: 0,
                correct: 0,
                timeSpent: 0,
                sessions: 0,
                accuracy: 0
            };
            data.performance.daily.push(todayPerformance);
        }
        
        todayPerformance.questions += session.totalQuestions;
        todayPerformance.correct += session.correctAnswers;
        todayPerformance.timeSpent += session.timeSpent;
        todayPerformance.sessions++;
        todayPerformance.accuracy = (todayPerformance.correct / todayPerformance.questions) * 100;
        
        // Keep only last 30 days
        data.performance.daily = data.performance.daily
            .filter(d => new Date(d.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Study Streak Management
    updateStudyStreak() {
        const data = this.getProgressData();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const todayActivity = data.performance.daily.find(d => d.date === today);
        const lastStudyDate = data.user.lastStudyDate;
        
        if (todayActivity && todayActivity.questions > 0) {
            // Studied today
            if (lastStudyDate === yesterday) {
                // Consecutive day - increment streak
                data.user.studyStreak++;
            } else if (lastStudyDate !== today) {
                // First time studying today, but not consecutive
                data.user.studyStreak = 1;
            }
            
            data.user.lastStudyDate = today;
            
            if (data.user.studyStreak > data.statistics.bestStreak) {
                data.statistics.bestStreak = data.user.studyStreak;
            }
        } else if (lastStudyDate && lastStudyDate < yesterday) {
            // Haven't studied recently - reset streak
            data.user.studyStreak = 0;
        }
        
        this.saveProgressData(data);
    }

    updateStudyStreakAfterSession(data) {
        const today = new Date().toISOString().split('T')[0];
        data.user.lastStudyDate = today;
        
        // This will be handled by updateStudyStreak() which runs daily
    }

    // Analytics and Statistics
    getOverallStats() {
        const data = this.getProgressData();
        const accuracy = data.statistics.totalQuestions > 0 
            ? (data.statistics.correctAnswers / data.statistics.totalQuestions) * 100 
            : 0;
            
        return {
            totalQuestions: data.statistics.totalQuestions,
            correctAnswers: data.statistics.correctAnswers,
            accuracy: Math.round(accuracy),
            totalTime: this.formatDuration(data.statistics.totalTime),
            studyStreak: data.user.studyStreak,
            bestStreak: data.statistics.bestStreak,
            sessions: data.sessions.length,
            averageTime: Math.round(data.statistics.averageTime),
            improvements: this.calculateImprovement(data)
        };
    }

    getCategoryStats() {
        const data = this.getProgressData();
        const categories = [];
        
        Object.entries(data.categories).forEach(([category, stats]) => {
            const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
            categories.push({
                name: category,
                total: stats.total,
                correct: stats.correct,
                accuracy: Math.round(accuracy),
                sessions: stats.sessions || 0,
                level: this.getCategoryLevel(stats.total, accuracy)
            });
        });
        
        return categories.sort((a, b) => b.total - a.total);
    }

    getCategoryLevel(total, accuracy) {
        if (total < 10) return 'Principiante';
        if (total < 50) return 'Intermedio';
        if (total < 100) return 'Avanzado';
        if (accuracy > 80) return 'Experto';
        return 'Maestro';
    }

    calculateImprovement(data) {
        const recent = data.performance.daily.slice(-7); // Last 7 days
        const previous = data.performance.daily.slice(-14, -7); // Previous 7 days
        
        const recentAvg = recent.length > 0 
            ? recent.reduce((sum, d) => sum + d.accuracy, 0) / recent.length 
            : 0;
        const previousAvg = previous.length > 0 
            ? previous.reduce((sum, d) => sum + d.accuracy, 0) / previous.length 
            : 0;
            
        return {
            trend: recentAvg > previousAvg ? 'up' : recentAvg < previousAvg ? 'down' : 'stable',
            change: Math.abs(recentAvg - previousAvg),
            recentAccuracy: Math.round(recentAvg),
            previousAccuracy: Math.round(previousAvg)
        };
    }

    // Chart Generation
    updateProgressCharts() {
        this.createSpecialtyChart();
        this.createWeeklyChart();
        this.createPerformanceChart();
    }

    createSpecialtyChart() {
        const canvas = document.getElementById('specialty-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const categoryStats = this.getCategoryStats();
        
        if (this.charts.specialty) {
            this.charts.specialty.destroy();
        }

        this.charts.specialty = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryStats.map(c => c.name),
                datasets: [{
                    data: categoryStats.map(c => c.total),
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
                        '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
                        '#ec4899', '#6366f1'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const category = categoryStats[context.dataIndex];
                                return `${context.label}: ${context.parsed} preguntas (${category.accuracy}% precisión)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createWeeklyChart() {
        const canvas = document.getElementById('weekly-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.getProgressData();
        const last7Days = data.performance.daily.slice(-7);
        
        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        this.charts.weekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(d => this.formatDateForChart(d.date)),
                datasets: [
                    {
                        label: 'Preguntas respondidas',
                        data: last7Days.map(d => d.questions),
                        borderColor: '#3b82f6',
                        backgroundColor: '#3b82f620',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Precisión (%)',
                        data: last7Days.map(d => d.accuracy),
                        borderColor: '#10b981',
                        backgroundColor: '#10b98120',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        max: 100,
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    createPerformanceChart() {
        // Create additional performance visualizations as needed
        this.updateProgressDisplay();
    }

    // UI Update Methods
    updateProgressDisplay() {
        const stats = this.getOverallStats();
        
        this.updateElement('total-answered', stats.totalQuestions);
        this.updateElement('overall-accuracy', `${stats.accuracy}%`);
        this.updateElement('study-streak', stats.studyStreak);
        this.updateElement('total-study-time', stats.totalTime);
        
        this.updateSpecialtyTable();
    }

    updateSpecialtyTable() {
        const tbody = document.getElementById('specialty-stats');
        if (!tbody) return;

        const categoryStats = this.getCategoryStats();
        
        tbody.innerHTML = categoryStats.map(category => `
            <tr>
                <td>${category.name}</td>
                <td>${category.total}</td>
                <td>${category.correct}</td>
                <td>
                    <span class="accuracy-badge ${this.getAccuracyClass(category.accuracy)}">
                        ${category.accuracy}%
                    </span>
                </td>
                <td>${category.sessions > 0 ? this.getRelativeTime(new Date()) : 'Nunca'}</td>
            </tr>
        `).join('');
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Achievement System
    checkAchievements(data, session) {
        const achievements = [];
        
        // First question achievement
        if (data.statistics.totalQuestions === 1) {
            achievements.push({
                id: 'first-question',
                title: '¡Primer Paso!',
                description: 'Respondiste tu primera pregunta',
                icon: '🎯',
                date: new Date().toISOString()
            });
        }
        
        // Perfect session
        if (session.totalQuestions >= 5 && session.correctAnswers === session.totalQuestions) {
            achievements.push({
                id: 'perfect-session',
                title: 'Sesión Perfecta',
                description: 'Respondiste todas las preguntas correctamente',
                icon: '⭐',
                date: new Date().toISOString()
            });
        }
        
        // Study streak milestones
        if (data.user.studyStreak === 7) {
            achievements.push({
                id: 'week-streak',
                title: 'Semana Completa',
                description: 'Estudiaste 7 días consecutivos',
                icon: '🔥',
                date: new Date().toISOString()
            });
        }
        
        // Question milestones
        const milestones = [10, 50, 100, 500, 1000];
        milestones.forEach(milestone => {
            if (data.statistics.totalQuestions === milestone) {
                achievements.push({
                    id: `questions-${milestone}`,
                    title: `${milestone} Preguntas`,
                    description: `Has respondido ${milestone} preguntas`,
                    icon: '📚',
                    date: new Date().toISOString()
                });
            }
        });
        
        // Add new achievements to data
        achievements.forEach(achievement => {
            if (!data.achievements.some(a => a.id === achievement.id)) {
                data.achievements.push(achievement);
                this.showAchievementNotification(achievement);
            }
        });
    }

    showAchievementNotification(achievement) {
        // Create achievement toast notification
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            animation: slideInAchievement 0.5s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutAchievement 0.5s ease-out';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // Utility Methods
    formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}min`;
    }

    formatDateForChart(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    }

    getRelativeTime(date) {
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Hace unos minutos';
        if (diffInHours < 24) return `Hace ${diffInHours} horas`;
        if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)} días`;
        return `Hace ${Math.floor(diffInHours / 168)} semanas`;
    }

    getAccuracyClass(accuracy) {
        if (accuracy >= 80) return 'accuracy-excellent';
        if (accuracy >= 70) return 'accuracy-good';
        if (accuracy >= 60) return 'accuracy-fair';
        return 'accuracy-poor';
    }

    // Data Export/Import
    exportProgress() {
        const data = this.getProgressData();
        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `enarm-progress-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    importProgress(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!importedData.statistics || !importedData.categories) {
                        throw new Error('Invalid progress file format');
                    }
                    
                    // Merge with existing data or replace
                    const confirmReplace = confirm('¿Deseas reemplazar todos tus datos actuales con los importados?');
                    
                    if (confirmReplace) {
                        localStorage.setItem(this.storageKey, JSON.stringify(importedData));
                        this.updateProgressCharts();
                        resolve('Datos importados correctamente');
                    } else {
                        reject('Importación cancelada');
                    }
                } catch (error) {
                    reject('Error al importar: ' + error.message);
                }
            };
            
            reader.onerror = () => reject('Error al leer el archivo');
            reader.readAsText(file);
        });
    }

    // Reset Methods
    resetProgress() {
        if (confirm('¿Estás seguro de que deseas eliminar todo tu progreso? Esta acción no se puede deshacer.')) {
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.sessionStorageKey);
            this.initializeProgressData();
            this.updateProgressCharts();
            location.reload();
        }
    }

    resetSession() {
        sessionStorage.removeItem(this.sessionStorageKey);
    }
}

// Add CSS for achievements
const achievementStyles = `
    @keyframes slideInAchievement {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutAchievement {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .achievement-icon {
        font-size: 2rem;
        flex-shrink: 0;
    }
    
    .achievement-title {
        font-weight: 600;
        margin-bottom: 4px;
    }
    
    .achievement-description {
        font-size: 0.875rem;
        opacity: 0.9;
    }
    
    .accuracy-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .accuracy-excellent { background-color: #10b981; color: white; }
    .accuracy-good { background-color: #f59e0b; color: white; }
    .accuracy-fair { background-color: #ef4444; color: white; }
    .accuracy-poor { background-color: #6b7280; color: white; }
`;

// Inject achievement styles
const styleSheet = document.createElement('style');
styleSheet.textContent = achievementStyles;
document.head.appendChild(styleSheet);

// Initialize progress manager
document.addEventListener('DOMContentLoaded', () => {
    window.progressManager = new ProgressManager();
});