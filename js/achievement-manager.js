// ENARM Prep - Achievement Management System
class AchievementManager {
    constructor() {
        this.achievements = new Map();
        this.userAchievements = [];
        this.listeners = [];
        this.init();
    }

    init() {
        this.setupAchievementDefinitions();
        this.loadUserAchievements();
    }

    // Achievement Definitions
    setupAchievementDefinitions() {
        const achievements = [
            // Milestone Achievements
            {
                id: 'first-question',
                title: '¡Primer Paso!',
                description: 'Respondiste tu primera pregunta',
                icon: '🎯',
                category: 'milestone',
                condition: (stats) => stats.totalQuestions >= 1,
                rarity: 'common',
                points: 10
            },
            {
                id: 'questions-10',
                title: 'Comenzando',
                description: 'Has respondido 10 preguntas',
                icon: '📚',
                category: 'milestone',
                condition: (stats) => stats.totalQuestions >= 10,
                rarity: 'common',
                points: 25
            },
            {
                id: 'questions-50',
                title: 'Estudiante Dedicado',
                description: 'Has respondido 50 preguntas',
                icon: '📖',
                category: 'milestone',
                condition: (stats) => stats.totalQuestions >= 50,
                rarity: 'uncommon',
                points: 50
            },
            {
                id: 'questions-100',
                title: 'Conocimiento Sólido',
                description: 'Has respondido 100 preguntas',
                icon: '🧠',
                category: 'milestone',
                condition: (stats) => stats.totalQuestions >= 100,
                rarity: 'uncommon',
                points: 100
            },
            {
                id: 'questions-500',
                title: 'Experto en Formación',
                description: 'Has respondido 500 preguntas',
                icon: '🏅',
                category: 'milestone',
                condition: (stats) => stats.totalQuestions >= 500,
                rarity: 'rare',
                points: 250
            },
            {
                id: 'questions-1000',
                title: 'Maestro ENARM',
                description: 'Has respondido 1000 preguntas',
                icon: '👑',
                category: 'milestone',
                condition: (stats) => stats.totalQuestions >= 1000,
                rarity: 'legendary',
                points: 500
            },

            // Performance Achievements
            {
                id: 'perfect-session-5',
                title: 'Sesión Perfecta',
                description: 'Respondiste correctamente todas las preguntas en una sesión de al menos 5 preguntas',
                icon: '⭐',
                category: 'performance',
                condition: (stats, sessionData) => {
                    return sessionData && sessionData.totalQuestions >= 5 && 
                           sessionData.accuracy === 100;
                },
                rarity: 'uncommon',
                points: 75
            },
            {
                id: 'perfect-session-10',
                title: 'Perfección Absoluta',
                description: 'Sesión perfecta con 10 o más preguntas',
                icon: '💫',
                category: 'performance',
                condition: (stats, sessionData) => {
                    return sessionData && sessionData.totalQuestions >= 10 && 
                           sessionData.accuracy === 100;
                },
                rarity: 'rare',
                points: 150
            },
            {
                id: 'accuracy-90',
                title: 'Precisión Excepcional',
                description: 'Mantén una precisión del 90% o más con al menos 50 preguntas',
                icon: '🎯',
                category: 'performance',
                condition: (stats) => stats.totalQuestions >= 50 && stats.accuracy >= 90,
                rarity: 'rare',
                points: 200
            },
            {
                id: 'speed-demon',
                title: 'Velocidad Mental',
                description: 'Responde correctamente 10 preguntas en menos de 5 minutos',
                icon: '⚡',
                category: 'performance',
                condition: (stats, sessionData) => {
                    return sessionData && sessionData.correctAnswers >= 10 &&
                           sessionData.totalTime <= 300; // 5 minutes
                },
                rarity: 'rare',
                points: 175
            },

            // Streak Achievements
            {
                id: 'streak-3',
                title: 'Constancia',
                description: 'Estudia 3 días consecutivos',
                icon: '🔥',
                category: 'streak',
                condition: (stats) => stats.studyStreak >= 3,
                rarity: 'common',
                points: 30
            },
            {
                id: 'streak-7',
                title: 'Semana Completa',
                description: 'Estudia 7 días consecutivos',
                icon: '🔥',
                category: 'streak',
                condition: (stats) => stats.studyStreak >= 7,
                rarity: 'uncommon',
                points: 75
            },
            {
                id: 'streak-30',
                title: 'Mes de Dedicación',
                description: 'Estudia 30 días consecutivos',
                icon: '🔥',
                category: 'streak',
                condition: (stats) => stats.studyStreak >= 30,
                rarity: 'rare',
                points: 300
            },
            {
                id: 'streak-100',
                title: 'Disciplina de Hierro',
                description: 'Estudia 100 días consecutivos',
                icon: '🔥',
                category: 'streak',
                condition: (stats) => stats.studyStreak >= 100,
                rarity: 'legendary',
                points: 1000
            },

            // Category Mastery
            {
                id: 'cardiology-master',
                title: 'Corazón de Oro',
                description: 'Logra 85%+ de precisión en Cardiología con al menos 20 preguntas',
                icon: '❤️',
                category: 'mastery',
                condition: (stats) => this.checkCategoryMastery(stats, 'Cardiología', 85, 20),
                rarity: 'rare',
                points: 150
            },
            {
                id: 'pediatrics-master',
                title: 'Especialista Pediátrico',
                description: 'Logra 85%+ de precisión en Pediatría con al menos 25 preguntas',
                icon: '👶',
                category: 'mastery',
                condition: (stats) => this.checkCategoryMastery(stats, 'Pediatría', 85, 25),
                rarity: 'rare',
                points: 150
            },
            {
                id: 'neurology-master',
                title: 'Mente Brillante',
                description: 'Logra 85%+ de precisión en Neurología con al menos 20 preguntas',
                icon: '🧠',
                category: 'mastery',
                condition: (stats) => this.checkCategoryMastery(stats, 'Neurología', 85, 20),
                rarity: 'rare',
                points: 150
            },

            // Special Achievements
            {
                id: 'night-owl',
                title: 'Búho Nocturno',
                description: 'Completa una sesión después de las 11 PM',
                icon: '🦉',
                category: 'special',
                condition: (stats, sessionData) => {
                    if (!sessionData || !sessionData.endTime) return false;
                    const endHour = new Date(sessionData.endTime).getHours();
                    return endHour >= 23 || endHour <= 5;
                },
                rarity: 'uncommon',
                points: 50
            },
            {
                id: 'early-bird',
                title: 'Madrugador',
                description: 'Completa una sesión antes de las 7 AM',
                icon: '🌅',
                category: 'special',
                condition: (stats, sessionData) => {
                    if (!sessionData || !sessionData.startTime) return false;
                    const startHour = new Date(sessionData.startTime).getHours();
                    return startHour <= 7;
                },
                rarity: 'uncommon',
                points: 50
            },
            {
                id: 'weekend-warrior',
                title: 'Guerrero de Fin de Semana',
                description: 'Completa sesiones en sábado y domingo',
                icon: '⚔️',
                category: 'special',
                condition: (stats, sessionData) => {
                    // This would need to track weekend sessions over time
                    return false; // Placeholder for complex logic
                },
                rarity: 'uncommon',
                points: 75
            },

            // Exam Simulation
            {
                id: 'exam-completed',
                title: 'Simulacro Completado',
                description: 'Completa tu primera simulación de examen completa',
                icon: '🏆',
                category: 'exam',
                condition: (stats, sessionData) => {
                    return sessionData && sessionData.config && 
                           sessionData.config.mode === 'exam_simulation' &&
                           sessionData.totalQuestions >= 200;
                },
                rarity: 'rare',
                points: 300
            },
            {
                id: 'exam-master',
                title: 'Maestro del Examen',
                description: 'Logra 80%+ en una simulación completa de examen',
                icon: '👨‍⚕️',
                category: 'exam',
                condition: (stats, sessionData) => {
                    return sessionData && sessionData.config && 
                           sessionData.config.mode === 'exam_simulation' &&
                           sessionData.totalQuestions >= 200 &&
                           sessionData.accuracy >= 80;
                },
                rarity: 'legendary',
                points: 500
            }
        ];

        achievements.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
    }

    // Achievement Checking
    checkAchievements(userStats, sessionData = null) {
        const newAchievements = [];

        for (const [id, achievement] of this.achievements) {
            if (this.hasAchievement(id)) continue;

            try {
                if (achievement.condition(userStats, sessionData)) {
                    const earnedAchievement = {
                        ...achievement,
                        earnedAt: new Date().toISOString(),
                        sessionId: sessionData?.id || null
                    };

                    this.userAchievements.push(earnedAchievement);
                    newAchievements.push(earnedAchievement);
                }
            } catch (error) {
                ErrorHandler.logError(error, `AchievementManager.checkAchievements.${id}`);
            }
        }

        if (newAchievements.length > 0) {
            this.saveUserAchievements();
            this.notifyAchievements(newAchievements);
        }

        return newAchievements;
    }

    checkCategoryMastery(stats, category, minAccuracy, minQuestions) {
        if (!stats.categories || !stats.categories[category]) return false;
        
        const categoryStats = stats.categories[category];
        const accuracy = categoryStats.total > 0 ? 
            (categoryStats.correct / categoryStats.total) * 100 : 0;
        
        return categoryStats.total >= minQuestions && accuracy >= minAccuracy;
    }

    // Achievement Queries
    hasAchievement(achievementId) {
        return this.userAchievements.some(a => a.id === achievementId);
    }

    getUserAchievements() {
        return this.userAchievements.sort((a, b) => 
            new Date(b.earnedAt) - new Date(a.earnedAt)
        );
    }

    getAchievementsByCategory(category) {
        return this.userAchievements.filter(a => a.category === category);
    }

    getAchievementProgress() {
        const totalAchievements = this.achievements.size;
        const earnedAchievements = this.userAchievements.length;
        const progress = (earnedAchievements / totalAchievements) * 100;

        return {
            total: totalAchievements,
            earned: earnedAchievements,
            percentage: Math.round(progress),
            remaining: totalAchievements - earnedAchievements
        };
    }

    getTotalPoints() {
        return this.userAchievements.reduce((total, achievement) => 
            total + (achievement.points || 0), 0
        );
    }

    getAchievementsByRarity() {
        const byRarity = {
            common: [],
            uncommon: [],
            rare: [],
            legendary: []
        };

        this.userAchievements.forEach(achievement => {
            const rarity = achievement.rarity || 'common';
            if (byRarity[rarity]) {
                byRarity[rarity].push(achievement);
            }
        });

        return byRarity;
    }

    // Storage Management
    loadUserAchievements() {
        this.userAchievements = StorageService.getItem('user-achievements', []);
    }

    saveUserAchievements() {
        StorageService.setItem('user-achievements', this.userAchievements);
    }

    // Notifications
    notifyAchievements(achievements) {
        achievements.forEach(achievement => {
            this.showAchievementNotification(achievement);
            this.notifyListeners('achievementEarned', achievement);
        });
    }

    showAchievementNotification(achievement) {
        const toast = document.createElement('div');
        toast.className = `achievement-toast rarity-${achievement.rarity}`;
        
        toast.innerHTML = `
            <div class="achievement-glow"></div>
            <div class="achievement-content">
                <div class="achievement-header">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-rarity">${achievement.rarity.toUpperCase()}</div>
                </div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-points">+${achievement.points} puntos</div>
            </div>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1.5rem;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            z-index: 1001;
            min-width: 320px;
            border: 2px solid rgba(255,255,255,0.2);
            animation: achievementSlideIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;

        // Add rarity-specific styling
        const rarityColors = {
            common: 'linear-gradient(135deg, #6b7280, #4b5563)',
            uncommon: 'linear-gradient(135deg, #10b981, #059669)',
            rare: 'linear-gradient(135deg, #3b82f6, #1e40af)',
            legendary: 'linear-gradient(135deg, #f59e0b, #d97706)'
        };

        if (rarityColors[achievement.rarity]) {
            toast.style.background = rarityColors[achievement.rarity];
        }

        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'achievementSlideOut 0.5s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 500);
        }, 5000);

        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.animation = 'achievementSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        });
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
                ErrorHandler.logError(error, `AchievementManager.${event}Listener`);
            }
        });
    }

    // Admin/Debug Methods
    resetAchievements() {
        if (confirm('¿Estás seguro de que quieres reiniciar todos los logros? Esta acción no se puede deshacer.')) {
            this.userAchievements = [];
            this.saveUserAchievements();
            CommonUtils.createToast('Logros reiniciados', 'info');
        }
    }

    debugGrantAchievement(achievementId) {
        if (!this.achievements.has(achievementId)) {
            console.warn(`Achievement ${achievementId} not found`);
            return;
        }

        if (this.hasAchievement(achievementId)) {
            console.warn(`Achievement ${achievementId} already earned`);
            return;
        }

        const achievement = this.achievements.get(achievementId);
        const earnedAchievement = {
            ...achievement,
            earnedAt: new Date().toISOString(),
            sessionId: 'debug'
        };

        this.userAchievements.push(earnedAchievement);
        this.saveUserAchievements();
        this.showAchievementNotification(earnedAchievement);
        console.log(`Granted achievement: ${achievement.title}`);
    }

    getAchievementStats() {
        const stats = {
            total: this.achievements.size,
            earned: this.userAchievements.length,
            totalPoints: this.getTotalPoints(),
            byCategory: {},
            byRarity: { common: 0, uncommon: 0, rare: 0, legendary: 0 }
        };

        this.userAchievements.forEach(achievement => {
            // By category
            const category = achievement.category || 'other';
            if (!stats.byCategory[category]) {
                stats.byCategory[category] = 0;
            }
            stats.byCategory[category]++;

            // By rarity
            const rarity = achievement.rarity || 'common';
            if (stats.byRarity[rarity] !== undefined) {
                stats.byRarity[rarity]++;
            }
        });

        return stats;
    }
}

// Add achievement animation styles
const achievementStyles = `
    @keyframes achievementSlideIn {
        from {
            transform: translateX(100%) scale(0.8);
            opacity: 0;
        }
        to {
            transform: translateX(0) scale(1);
            opacity: 1;
        }
    }
    
    @keyframes achievementSlideOut {
        from {
            transform: translateX(0) scale(1);
            opacity: 1;
        }
        to {
            transform: translateX(100%) scale(0.8);
            opacity: 0;
        }
    }
    
    .achievement-toast {
        position: relative;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .achievement-toast:hover {
        transform: scale(1.02);
    }
    
    .achievement-glow {
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
        border-radius: 16px;
        z-index: -1;
    }
    
    .achievement-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
    }
    
    .achievement-icon {
        font-size: 2rem;
        flex-shrink: 0;
    }
    
    .achievement-rarity {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 1px;
        opacity: 0.8;
    }
    
    .achievement-title {
        font-weight: 700;
        font-size: 1.1rem;
        margin-bottom: 4px;
    }
    
    .achievement-description {
        font-size: 0.9rem;
        opacity: 0.9;
        margin-bottom: 8px;
        line-height: 1.3;
    }
    
    .achievement-points {
        font-size: 0.8rem;
        font-weight: 600;
        opacity: 0.8;
        text-align: right;
    }
    
    .rarity-legendary {
        border: 2px solid #fbbf24 !important;
        box-shadow: 0 0 30px rgba(251, 191, 36, 0.3) !important;
    }
    
    .rarity-rare {
        border: 2px solid #60a5fa !important;
        box-shadow: 0 0 20px rgba(96, 165, 250, 0.2) !important;
    }
`;

// Inject achievement styles
const achievementStyleSheet = document.createElement('style');
achievementStyleSheet.textContent = achievementStyles;
document.head.appendChild(achievementStyleSheet);

// Create singleton instance
const achievementManager = new AchievementManager();

// Export as global
window.AchievementManager = achievementManager;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = achievementManager;
}