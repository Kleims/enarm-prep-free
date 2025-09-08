// ENARM Prep - Application Constants
class AppConstants {
    static get STORAGE_KEYS() {
        return {
            THEME: 'enarm-theme',
            PROGRESS: 'enarm-progress',
            SESSION: 'enarm-session',
            BOOKMARKS: 'enarm-bookmarks'
        };
    }

    static get TIMER() {
        return {
            DEFAULT_QUESTION_TIME: 150, // 2:30 minutes
            WARNING_THRESHOLD: 30, // 30 seconds
            UPDATE_INTERVAL: 1000 // 1 second
        };
    }

    static get QUESTION() {
        return {
            OPTIONS: ['A', 'B', 'C', 'D', 'E'],
            DIFFICULTIES: ['basico', 'intermedio', 'avanzado'],
            DEFAULT_SESSION_SIZE: 10,
            MAX_OPTION_LENGTH: 100,
            MAX_QUESTION_LENGTH: 200,
            MAX_EXPLANATION_LENGTH: 500
        };
    }

    static get UI() {
        return {
            TOAST_DURATION: 3000, // 3 seconds
            ANIMATION_DURATION: 300, // 0.3 seconds
            MOBILE_BREAKPOINT: 768,
            TABLET_BREAKPOINT: 1024
        };
    }

    static get THEMES() {
        return {
            LIGHT: 'light',
            DARK: 'dark'
        };
    }

    static get PAGES() {
        return {
            HOME: 'home',
            PRACTICE: 'practice',
            PROGRESS: 'progress',
            STUDY_GUIDES: 'study-guides',
            FLASHCARDS: 'flashcards'
        };
    }

    static get CATEGORIES() {
        return [
            'Cardiología',
            'Neurología',
            'Pediatría',
            'Ginecología y Obstetricia',
            'Medicina Interna',
            'Cirugía General',
            'Medicina Familiar',
            'Urgencias Médicas',
            'Gastroenterología',
            'Endocrinología'
        ];
    }

    static get PRACTICE_MODES() {
        return {
            STUDY: 'study',
            EXAM: 'exam',
            REVIEW: 'review',
            RANDOM: 'random'
        };
    }

    static get USER_PREFERENCES() {
        return {
            DEFAULT_DAILY_GOAL: 20,
            MIN_DAILY_GOAL: 5,
            MAX_DAILY_GOAL: 100
        };
    }

    static get STATISTICS() {
        return {
            MIN_ACCURACY_FOR_GOOD: 70,
            MIN_ACCURACY_FOR_EXCELLENT: 85,
            DEFAULT_STUDY_STREAK: 0,
            MAX_SESSIONS_STORED: 100
        };
    }

    static get SERVICE_WORKER() {
        return {
            PATH: '/enarm-prep/sw.js',
            MAX_CACHE_SIZE: 50,
            CACHE_VERSION: 'v1.0.0'
        };
    }

    static get MEDICAL_CALCULATORS() {
        return {
            BMI: {
                UNDERWEIGHT: 18.5,
                NORMAL: 24.9,
                OVERWEIGHT: 29.9,
                OBESE: 30
            },
            CREATININE_CLEARANCE: {
                MALE_FACTOR: 1.0,
                FEMALE_FACTOR: 0.85,
                AGE_FACTOR: 0.01
            },
            CARDIOVASCULAR_RISK: {
                LOW_RISK: 10,
                MODERATE_RISK: 20,
                HIGH_RISK: 30
            }
        };
    }

    static get VALIDATION() {
        return {
            REQUIRED_QUESTION_FIELDS: ['id', 'category', 'difficulty', 'question', 'options', 'correct', 'explanation'],
            EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            MIN_PASSWORD_LENGTH: 8
        };
    }

    static get MESSAGES() {
        return {
            ERRORS: {
                QUESTION_NOT_SELECTED: 'Por favor selecciona una respuesta.',
                NO_QUESTIONS_AVAILABLE: 'No hay preguntas disponibles con los filtros seleccionados.',
                QUESTION_LOAD_FAILED: 'Error al cargar las preguntas.',
                SESSION_SAVE_FAILED: 'Error al guardar la sesión.',
                INVALID_QUESTION: 'La pregunta no es válida.',
                DUPLICATE_QUESTION_ID: 'El ID de la pregunta ya existe.'
            },
            SUCCESS: {
                NEWSLETTER_SUBSCRIBED: '¡Gracias por suscribirte! Recibirás noticias pronto.',
                QUESTION_BOOKMARKED: 'Pregunta guardada en marcadores.',
                QUESTION_UNBOOKMARKED: 'Pregunta removida de marcadores.',
                SESSION_COMPLETED: '¡Sesión completada exitosamente!',
                PROGRESS_SAVED: 'Progreso guardado correctamente.'
            },
            INFO: {
                LOADING: 'Cargando...',
                SAVING: 'Guardando...',
                PROCESSING: 'Procesando...'
            }
        };
    }

    static get KEYBOARD_SHORTCUTS() {
        return {
            OPTION_KEYS: ['1', '2', '3', '4', '5'],
            SUBMIT_KEY: 'Enter',
            BOOKMARK_KEY: ' ', // Space with Ctrl
            SEARCH_KEY: 'k' // Ctrl + K
        };
    }

    static get CHART_COLORS() {
        return {
            PRIMARY: '#2563eb',
            SUCCESS: '#10b981',
            WARNING: '#f59e0b',
            ERROR: '#ef4444',
            INFO: '#3b82f6',
            SECONDARY: '#64748b'
        };
    }
}

// Export as global constant
window.AppConstants = AppConstants;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConstants;
}