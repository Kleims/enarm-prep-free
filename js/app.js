// ENARM Prep - Main Application Logic (Refactored)
class ENARMApp {
    constructor() {
        this.currentPage = 'home';
        this.freemiumManager = null;
        
        // Services (will be injected)
        this.sessionManager = null;
        this.timerService = null;
        this.practiceModeController = null;
        this.questionDisplayController = null;
        this.themeManager = null;
        
        this.init();
    }

    init() {
        this.injectServices();
        this.setupServiceIntegration();
        this.setupEventListeners();
        this.setupServiceWorker();
        this.initFreemium();
        this.showPage('home');
    }
    
    injectServices() {
        // Inject all the new services
        this.sessionManager = window.SessionManager;
        this.timerService = window.TimerService;
        this.practiceModeController = window.PracticeModeController;
        this.questionDisplayController = window.QuestionDisplayController;
        this.themeManager = window.ThemeManager;
    }
    
    setupServiceIntegration() {
        // Set up communication between services
        this.sessionManager.addEventListener('sessionStart', (data) => {
            this.handleSessionStart(data);
        });
        
        this.sessionManager.addEventListener('questionShow', (data) => {
            this.questionDisplayController.displayQuestion(data);
            if (data.question) {
                this.timerService.startQuestionTimer();
            }
        });
        
        this.sessionManager.addEventListener('answerSubmit', (data) => {
            this.timerService.stopTimer('question-timer');
        });
        
        this.sessionManager.addEventListener('sessionEnd', (data) => {
            this.handleSessionEnd(data);
        });
        
        // Timer integration
        this.timerService.addEventListener('question-timer', 'auto-submit', () => {
            this.questionDisplayController.handleSubmitAnswer();
        });
        
        this.timerService.addEventListener('session-timer', 'auto-end', () => {
            this.practiceModeController.endCurrentSession();
        });
        
        // Practice mode controller integration
        this.practiceModeController.addEventListener((event) => {
            this.handlePracticeModeEvent(event);
        });
    }
    
    handleSessionStart(data) {
        this.questionDisplayController.showQuestionContainer();
        if (this.freemiumManager) {
            this.freemiumManager.incrementExamCount();
        }
    }
    
    handleSessionEnd(data) {
        this.timerService.stopAllTimers();
        this.questionDisplayController.displaySessionResults(data.session, data.summary);
    }
    
    handlePracticeModeEvent(event) {
        switch (event.event) {
            case 'sessionStarted':
                this.questionDisplayController.hideConfigPanel();
                break;
            case 'sessionEnded':
                this.questionDisplayController.showPracticeModeSelection();
                break;
        }
    }
    
    initFreemium() {
        try {
            if (typeof FreemiumManager !== 'undefined') {
                this.freemiumManager = new FreemiumManager();
                this.freemiumManager.init();
            } else {
                console.warn('FreemiumManager not available');
                this.freemiumManager = null;
            }
        } catch (error) {
            console.error('Error initializing FreemiumManager:', error);
            this.freemiumManager = null;
        }
    }

    // Theme management now handled by ThemeManager service

    // Navigation Management
    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.showPage(page);
            }
            
            if (e.target.matches('[data-action]')) {
                e.preventDefault();
                const action = e.target.getAttribute('data-action');
                this.handleAction(action);
            }
        });

        // Theme toggle handled by ThemeManager

        // Mobile navigation
        const navHamburger = document.getElementById('nav-hamburger');
        const navMenu = document.getElementById('nav-menu');
        if (navHamburger && navMenu) {
            navHamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navHamburger.classList.toggle('active');
            });
        }

        // Practice mode selection
        document.addEventListener('click', (e) => {
            if (e.target.matches('.mode-select-btn')) {
                const modeCard = e.target.closest('.practice-mode-card');
                const mode = modeCard.getAttribute('data-mode');
                this.selectPracticeMode(mode);
            }
        });

        // Configuration panel
        const startSessionBtn = document.getElementById('start-session');
        if (startSessionBtn) {
            startSessionBtn.addEventListener('click', () => this.startConfiguredSession());
        }

        const cancelConfigBtn = document.getElementById('cancel-config');
        if (cancelConfigBtn) {
            cancelConfigBtn.addEventListener('click', () => this.cancelConfiguration());
        }

        // Practice controls now handled by QuestionDisplayController and PracticeModeController
        
        // Newsletter form
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSubmission(e.target);
            });
        }

        // Keyboard shortcuts handled by QuestionDisplayController
    }

    setupPracticeControls() {
        const startPractice = document.getElementById('start-practice');
        const randomQuestion = document.getElementById('random-question');

        if (startPractice) {
            startPractice.addEventListener('click', () => this.startBasicPractice());
        }
        
        if (randomQuestion) {
            randomQuestion.addEventListener('click', () => this.practiceModeController.startRandomQuestion());
        }

        // Tab system for study guides
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.showTab(tabId);
            });
        });
    }
    
    startBasicPractice() {
        // Default practice mode
        const config = {
            specialty: document.getElementById('specialty-filter')?.value || '',
            difficulty: document.getElementById('difficulty-filter')?.value || '',
            questionsCount: 10,
            timeLimit: 0
        };
        
        this.practiceModeController.startStudyMode(config);
    }

    // Page Navigation
    showPage(pageId) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeNavLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
            
            // Page-specific initialization
            this.initializePage(pageId);
        }

        // Close mobile menu
        const navMenu = document.getElementById('nav-menu');
        const navHamburger = document.getElementById('nav-hamburger');
        if (navMenu && navHamburger) {
            navMenu.classList.remove('active');
            navHamburger.classList.remove('active');
        }
    }

    initializePage(pageId) {
        switch (pageId) {
            case 'home':
                this.updateHomePage();
                break;
            case 'practice':
                this.initializePracticePage();
                break;
            case 'progress':
                this.initializeProgressPage();
                break;
            case 'study-guides':
                this.initializeStudyGuidesPage();
                break;
            case 'flashcards':
                this.initializeFlashcardsPage();
                break;
        }
    }

    updateHomePage() {
        const totalQuestionsElement = document.getElementById('total-questions');
        const userProgressElement = document.getElementById('user-progress');
        
        if (totalQuestionsElement) {
            totalQuestionsElement.textContent = `${window.questionBank ? window.questionBank.length : 500}+`;
        }
        
        if (userProgressElement && window.ProgressManager) {
            const stats = window.ProgressManager.getOverallStats();
            userProgressElement.textContent = `${stats.accuracy}%`;
        }
    }

    initializePracticePage() {
        this.questionDisplayController.resetDisplay();
    }

    initializeProgressPage() {
        if (window.ProgressManager) {
            window.ProgressManager.updateProgressCharts();
        }
    }

    initializeStudyGuidesPage() {
        this.loadStudyGuides();
    }

    initializeFlashcardsPage() {
        this.initializeFlashcards();
    }

    // Action Handlers
    handleAction(action) {
        switch (action) {
            case 'start-practice':
                // Check if user can start a practice session
                if (this.freemiumManager && this.freemiumManager.canStartExam()) {
                    this.showPage('practice');
                } else if (this.freemiumManager) {
                    this.freemiumManager.showUpgradeModal('daily-limit');
                } else {
                    // Fallback if freemium not available
                    this.showPage('practice');
                }
                break;
            case 'view-progress':
                this.showPage('progress');
                break;
            case 'show-pricing':
                if (this.freemiumManager) {
                    this.freemiumManager.showUpgradeModal('general');
                }
                break;
        }
    }

    // Practice Session Management (now delegated to services)
    startPracticeSession() {
        // Basic fallback method - modern approach uses PracticeModeController
        this.startBasicPractice();
    }

    // Random question now handled by PracticeModeController

    // Question display now handled by QuestionDisplayController

    // Question meta now handled by QuestionDisplayController

    // Question options now handled by QuestionDisplayController

    // Answer submission now handled by SessionManager and QuestionDisplayController

    // Answer explanation now handled by QuestionDisplayController

    // Next question now handled by SessionManager

    // Session results now handled by QuestionDisplayController

    // Results display now handled by QuestionDisplayController

    // Result actions now handled by QuestionDisplayController

    // Timer management now handled by TimerService

    // Question filtering now handled by SessionManager

    // Utility methods now available in CommonUtils and other services

    // Progress tracking now handled by SessionManager and ProgressManager

    // Bookmark management now handled by QuestionDisplayController

    // UI utilities now handled by QuestionDisplayController
    showLoading(show) {
        this.questionDisplayController.showLoading();
    }

    showMessage(message, type = 'info') {
        CommonUtils.createToast(message, type);
    }

    // Question interface reset now handled by QuestionDisplayController

    // Newsletter
    handleNewsletterSubmission(form) {
        const email = form.querySelector('input[type="email"]').value;
        
        // Simulate newsletter subscription
        this.showMessage('¡Gracias por suscribirte! Recibirás noticias pronto.', 'success');
        form.reset();
    }

    // Keyboard shortcuts now handled by QuestionDisplayController

    // Tab System
    showTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
    }

    // Practice Mode Management now handled by PracticeModeController
    selectPracticeMode(mode) {
        // Delegate to PracticeModeController
        this.practiceModeController.selectMode(mode);
        this.questionDisplayController.showConfigPanel();
    }
    
    cancelConfiguration() {
        this.questionDisplayController.hideConfigPanel();
    }
    
    startConfiguredSession() {
        const specialty = document.getElementById('specialty-filter')?.value || '';
        const difficulty = document.getElementById('difficulty-filter')?.value || '';
        const questionsCount = parseInt(document.getElementById('questions-count')?.value) || 10;
        const timeLimit = parseInt(document.getElementById('time-limit')?.value) || 0;
        
        const config = {
            specialty,
            difficulty,
            questionsCount,
            timeLimit
        };
        
        const currentMode = this.practiceModeController.getCurrentMode();
        if (currentMode) {
            switch(currentMode.id) {
                case AppConstants.PRACTICE_MODES.EXAM_SIMULATION:
                    this.practiceModeController.startExamSimulation(config);
                    break;
                case AppConstants.PRACTICE_MODES.TIMED_PRACTICE:
                    this.practiceModeController.startTimedPractice(config);
                    break;
                case AppConstants.PRACTICE_MODES.STUDY:
                    this.practiceModeController.startStudyMode(config);
                    break;
                case AppConstants.PRACTICE_MODES.REVIEW:
                    this.practiceModeController.startReviewMode(config);
                    break;
            }
        }
        
        this.questionDisplayController.hideConfigPanel();
    }

    // Service Worker
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/enarm-prep/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered successfully');
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed');
                });
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enarmApp = new ENARMApp();
});

// Add loading animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);