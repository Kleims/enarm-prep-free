// ENARM Prep - Main Application Logic
class ENARMApp {
    constructor() {
        this.currentPage = 'home';
        this.currentTheme = 'light';
        this.currentQuestion = null;
        this.currentQuestionIndex = 0;
        this.sessionQuestions = [];
        this.sessionResults = [];
        this.timer = null;
        this.timeRemaining = 0;
        this.freemiumManager = null;
        
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.loadProgress();
        this.setupServiceWorker();
        this.initFreemium();
        this.showPage('home');
    }
    
    initFreemium() {
        this.freemiumManager = new FreemiumManager();
        this.freemiumManager.init();
    }

    // Theme Management
    loadTheme() {
        const savedTheme = localStorage.getItem('enarm-theme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('enarm-theme', theme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = theme === 'dark' ? '☀️' : '🌙';
            themeToggle.querySelector('.theme-icon').textContent = icon;
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

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

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Mobile navigation
        const navHamburger = document.getElementById('nav-hamburger');
        const navMenu = document.getElementById('nav-menu');
        if (navHamburger && navMenu) {
            navHamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navHamburger.classList.toggle('active');
            });
        }

        // Practice controls
        this.setupPracticeControls();
        
        // Newsletter form
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSubmission(e.target);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    setupPracticeControls() {
        const startPractice = document.getElementById('start-practice');
        const randomQuestion = document.getElementById('random-question');
        const submitAnswer = document.getElementById('submit-answer');
        const nextQuestion = document.getElementById('next-question');
        const bookmarkQuestion = document.getElementById('bookmark-question');

        if (startPractice) {
            startPractice.addEventListener('click', () => this.startPracticeSession());
        }
        
        if (randomQuestion) {
            randomQuestion.addEventListener('click', () => this.showRandomQuestion());
        }
        
        if (submitAnswer) {
            submitAnswer.addEventListener('click', () => this.submitAnswer());
        }
        
        if (nextQuestion) {
            nextQuestion.addEventListener('click', () => this.nextQuestion());
        }
        
        if (bookmarkQuestion) {
            bookmarkQuestion.addEventListener('click', () => this.toggleBookmark());
        }

        // Tab system for study guides
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.showTab(tabId);
            });
        });
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
        const progress = this.getOverallProgress();
        const totalQuestionsElement = document.getElementById('total-questions');
        const userProgressElement = document.getElementById('user-progress');
        
        if (totalQuestionsElement) {
            totalQuestionsElement.textContent = `${window.questionBank ? window.questionBank.length : 500}+`;
        }
        
        if (userProgressElement) {
            userProgressElement.textContent = `${Math.round(progress.overallAccuracy)}%`;
        }
    }

    initializePracticePage() {
        this.resetQuestionInterface();
    }

    initializeProgressPage() {
        this.loadProgressCharts();
        this.updateProgressStats();
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
                if (this.freemiumManager.canStartExam()) {
                    this.showPage('practice');
                    setTimeout(() => this.startPracticeSession(), 100);
                } else {
                    this.freemiumManager.showUpgradeModal('daily-limit');
                }
                break;
            case 'view-progress':
                this.showPage('progress');
                break;
            case 'show-pricing':
                this.freemiumManager.showUpgradeModal('general');
                break;
        }
    }

    // Practice Session Management
    startPracticeSession() {
        // Increment exam count for freemium tracking
        this.freemiumManager.incrementExamCount();
        
        this.showLoading(true);
        
        // Get filter settings
        const specialty = document.getElementById('specialty-filter')?.value || '';
        const difficulty = document.getElementById('difficulty-filter')?.value || '';
        const mode = document.getElementById('question-mode')?.value || 'study';
        
        // Filter questions
        let questions = this.getFilteredQuestions(specialty, difficulty, mode);
        
        // Shuffle questions
        questions = CommonUtils.shuffleArray(questions);
        
        // Take first batch for practice session
        this.sessionQuestions = questions.slice(0, AppConstants.QUESTION.DEFAULT_SESSION_SIZE);
        this.sessionResults = [];
        this.currentQuestionIndex = 0;
        
        this.showLoading(false);
        
        if (this.sessionQuestions.length > 0) {
            this.showQuestion(this.sessionQuestions[0]);
        } else {
            this.showMessage('No hay preguntas disponibles con los filtros seleccionados.');
        }
    }

    showRandomQuestion() {
        this.showLoading(true);
        
        const questions = window.questionBank || [];
        if (questions.length > 0) {
            const randomIndex = Math.floor(Math.random() * questions.length);
            const question = questions[randomIndex];
            
            this.sessionQuestions = [question];
            this.sessionResults = [];
            this.currentQuestionIndex = 0;
            
            this.showQuestion(question);
        }
        
        this.showLoading(false);
    }

    showQuestion(question) {
        if (!question) return;
        
        this.currentQuestion = question;
        
        // Show question container
        const questionContainer = document.getElementById('question-container');
        if (questionContainer) {
            questionContainer.style.display = 'block';
        }
        
        // Hide results
        const practiceResults = document.getElementById('practice-results');
        if (practiceResults) {
            practiceResults.style.display = 'none';
        }
        
        // Update question meta
        this.updateQuestionMeta(question);
        
        // Update question content
        const questionText = document.getElementById('question-text');
        if (questionText) {
            questionText.textContent = question.question;
        }
        
        // Update options
        this.updateQuestionOptions(question);
        
        // Reset answer explanation
        const answerExplanation = document.getElementById('answer-explanation');
        if (answerExplanation) {
            answerExplanation.style.display = 'none';
        }
        
        // Reset buttons
        const submitButton = document.getElementById('submit-answer');
        const nextButton = document.getElementById('next-question');
        if (submitButton) submitButton.style.display = 'inline-flex';
        if (nextButton) nextButton.style.display = 'none';
        
        // Start timer
        this.startTimer();
        
        // Update bookmark status
        this.updateBookmarkStatus(question);
    }

    updateQuestionMeta(question) {
        const currentQuestionElement = document.getElementById('current-question');
        const totalQuestionsElement = document.getElementById('total-questions-practice');
        const difficultyElement = document.getElementById('question-difficulty');
        const categoryElement = document.getElementById('question-category');
        
        if (currentQuestionElement) {
            currentQuestionElement.textContent = this.currentQuestionIndex + 1;
        }
        
        if (totalQuestionsElement) {
            totalQuestionsElement.textContent = this.sessionQuestions.length;
        }
        
        if (difficultyElement) {
            difficultyElement.textContent = CommonUtils.capitalize(question.difficulty);
        }
        
        if (categoryElement) {
            categoryElement.textContent = question.category;
        }
    }

    updateQuestionOptions(question) {
        const optionsContainer = document.getElementById('question-options');
        if (!optionsContainer) return;
        
        optionsContainer.innerHTML = '';
        
        Object.entries(question.options).forEach(([letter, text]) => {
            const label = document.createElement('label');
            label.className = 'option-label';
            
            label.innerHTML = `
                <input type="radio" name="answer" value="${letter}">
                <span class="option-letter">${letter})</span>
                <span class="option-text">${text}</span>
            `;
            
            optionsContainer.appendChild(label);
        });
    }

    submitAnswer() {
        const selectedAnswer = document.querySelector('input[name="answer"]:checked');
        if (!selectedAnswer) {
            this.showMessage('Por favor selecciona una respuesta.');
            return;
        }
        
        const answer = selectedAnswer.value;
        const isCorrect = answer === this.currentQuestion.correct;
        
        // Record result
        const result = {
            question: this.currentQuestion,
            selectedAnswer: answer,
            isCorrect: isCorrect,
            timeSpent: this.getTimeSpent()
        };
        
        this.sessionResults.push(result);
        
        // Save to progress tracking
        this.recordAnswer(this.currentQuestion, isCorrect);
        
        // Show explanation
        this.showAnswerExplanation(isCorrect, answer);
        
        // Update buttons
        const submitButton = document.getElementById('submit-answer');
        const nextButton = document.getElementById('next-question');
        if (submitButton) submitButton.style.display = 'none';
        if (nextButton) nextButton.style.display = 'inline-flex';
        
        // Stop timer
        this.stopTimer();
    }

    showAnswerExplanation(isCorrect, selectedAnswer) {
        const answerExplanation = document.getElementById('answer-explanation');
        if (!answerExplanation) return;
        
        const resultIndicator = document.getElementById('result-indicator');
        const correctAnswerLetter = document.getElementById('correct-answer-letter');
        const explanationText = document.getElementById('explanation-text');
        const explanationReference = document.getElementById('explanation-reference');
        
        if (resultIndicator) {
            resultIndicator.textContent = isCorrect ? '✅ Correcto' : '❌ Incorrecto';
            resultIndicator.className = `result-indicator ${isCorrect ? 'correct' : 'incorrect'}`;
        }
        
        if (correctAnswerLetter) {
            correctAnswerLetter.textContent = this.currentQuestion.correct;
        }
        
        if (explanationText) {
            explanationText.textContent = this.currentQuestion.explanation;
        }
        
        if (explanationReference && this.currentQuestion.reference) {
            explanationReference.textContent = `Referencia: ${this.currentQuestion.reference}`;
        }
        
        answerExplanation.style.display = 'block';
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex < this.sessionQuestions.length) {
            this.showQuestion(this.sessionQuestions[this.currentQuestionIndex]);
        } else {
            this.showSessionResults();
        }
    }

    showSessionResults() {
        const questionContainer = document.getElementById('question-container');
        const practiceResults = document.getElementById('practice-results');
        
        if (questionContainer) {
            questionContainer.style.display = 'none';
        }
        
        if (practiceResults) {
            practiceResults.style.display = 'block';
            this.updateResultsDisplay();
        }
    }

    updateResultsDisplay() {
        const correctAnswers = this.sessionResults.filter(r => r.isCorrect).length;
        const incorrectAnswers = this.sessionResults.length - correctAnswers;
        const accuracy = Math.round((correctAnswers / this.sessionResults.length) * 100);
        const totalTime = this.sessionResults.reduce((sum, r) => sum + r.timeSpent, 0);
        
        document.getElementById('correct-answers').textContent = correctAnswers;
        document.getElementById('incorrect-answers').textContent = incorrectAnswers;
        document.getElementById('accuracy-percentage').textContent = `${accuracy}%`;
        document.getElementById('time-spent').textContent = CommonUtils.formatTime(totalTime);
        
        // Setup result actions
        this.setupResultActions();
    }

    setupResultActions() {
        const startNewPractice = document.getElementById('start-new-practice');
        const reviewIncorrect = document.getElementById('review-incorrect');
        
        if (startNewPractice) {
            startNewPractice.onclick = () => this.startPracticeSession();
        }
        
        if (reviewIncorrect) {
            reviewIncorrect.onclick = () => this.reviewIncorrectAnswers();
        }
    }

    // Timer Management
    startTimer() {
        this.timeRemaining = AppConstants.TIMER.DEFAULT_QUESTION_TIME;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.submitAnswer();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (this.timeRemaining <= AppConstants.TIMER.WARNING_THRESHOLD) {
                timerDisplay.style.color = 'var(--error-color)';
            } else {
                timerDisplay.style.color = 'var(--primary-color)';
            }
        }
    }

    getTimeSpent() {
        return AppConstants.TIMER.DEFAULT_QUESTION_TIME - this.timeRemaining;
    }

    // Utility Methods
    getFilteredQuestions(specialty, difficulty, mode) {
        let questions = [...(window.questionBank || [])];
        
        if (specialty) {
            questions = questions.filter(q => q.category.toLowerCase().includes(specialty.toLowerCase()));
        }
        
        if (difficulty) {
            questions = questions.filter(q => q.difficulty === difficulty);
        }
        
        if (mode === 'review') {
            const incorrectQuestions = this.getIncorrectQuestions();
            questions = questions.filter(q => incorrectQuestions.includes(q.id));
        }
        
        return questions;
    }

    // Utility methods now available in CommonUtils

    // Progress Tracking
    recordAnswer(question, isCorrect) {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        
        if (!progress.answers) {
            progress.answers = [];
        }
        
        if (!progress.categories) {
            progress.categories = {};
        }
        
        const answerRecord = {
            questionId: question.id,
            category: question.category,
            difficulty: question.difficulty,
            isCorrect: isCorrect,
            timestamp: new Date().toISOString()
        };
        
        progress.answers.push(answerRecord);
        
        // Update category stats
        if (!progress.categories[question.category]) {
            progress.categories[question.category] = {
                total: 0,
                correct: 0
            };
        }
        
        progress.categories[question.category].total++;
        if (isCorrect) {
            progress.categories[question.category].correct++;
        }
        
        StorageService.setItem(AppConstants.STORAGE_KEYS.PROGRESS, progress);
    }

    loadProgress() {
        const progress = StorageService.getItem(AppConstants.STORAGE_KEYS.PROGRESS, {});
        return progress;
    }

    getOverallProgress() {
        const progress = this.loadProgress();
        const totalAnswers = progress.answers ? progress.answers.length : 0;
        const correctAnswers = progress.answers ? progress.answers.filter(a => a.isCorrect).length : 0;
        
        return {
            totalAnswers,
            correctAnswers,
            overallAccuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
        };
    }

    getIncorrectQuestions() {
        const progress = this.loadProgress();
        if (!progress.answers) return [];
        
        return progress.answers
            .filter(a => !a.isCorrect)
            .map(a => a.questionId);
    }

    // Bookmark Management
    toggleBookmark() {
        if (!this.currentQuestion) return;
        
        const bookmarks = StorageService.getItem(AppConstants.STORAGE_KEYS.BOOKMARKS, []);
        const questionId = this.currentQuestion.id;
        const index = bookmarks.indexOf(questionId);
        
        if (index === -1) {
            bookmarks.push(questionId);
        } else {
            bookmarks.splice(index, 1);
        }
        
        StorageService.setItem(AppConstants.STORAGE_KEYS.BOOKMARKS, bookmarks);
        this.updateBookmarkStatus(this.currentQuestion);
    }

    updateBookmarkStatus(question) {
        const bookmarks = StorageService.getItem(AppConstants.STORAGE_KEYS.BOOKMARKS, []);
        const isBookmarked = bookmarks.includes(question.id);
        
        const bookmarkButton = document.getElementById('bookmark-question');
        const bookmarkIcon = document.getElementById('bookmark-icon');
        
        if (bookmarkButton && bookmarkIcon) {
            bookmarkIcon.textContent = isBookmarked ? '🔖' : '📋';
            bookmarkButton.querySelector('span:last-child').textContent = isBookmarked ? 'Guardado' : 'Guardar';
        }
    }

    // UI Utilities
    showLoading(show) {
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.classList.toggle('active', show);
        }
    }

    showMessage(message, type = 'info') {
        CommonUtils.createToast(message, type);
    }

    resetQuestionInterface() {
        const questionContainer = document.getElementById('question-container');
        const practiceResults = document.getElementById('practice-results');
        
        if (questionContainer) {
            questionContainer.style.display = 'none';
        }
        
        if (practiceResults) {
            practiceResults.style.display = 'none';
        }
        
        this.stopTimer();
    }

    // Newsletter
    handleNewsletterSubmission(form) {
        const email = form.querySelector('input[type="email"]').value;
        
        // Simulate newsletter subscription
        this.showMessage('¡Gracias por suscribirte! Recibirás noticias pronto.', 'success');
        form.reset();
    }

    // Keyboard Shortcuts
    handleKeyboard(event) {
        if (this.currentPage === 'practice' && this.currentQuestion) {
            // Number keys for options
            if (event.key >= '1' && event.key <= '5') {
                const optionIndex = parseInt(event.key) - 1;
                const options = ['A', 'B', 'C', 'D', 'E'];
                if (options[optionIndex]) {
                    const radio = document.querySelector(`input[value="${options[optionIndex]}"]`);
                    if (radio) {
                        radio.checked = true;
                    }
                }
            }
            
            // Enter to submit
            if (event.key === 'Enter') {
                const submitButton = document.getElementById('submit-answer');
                const nextButton = document.getElementById('next-question');
                
                if (submitButton && submitButton.style.display !== 'none') {
                    this.submitAnswer();
                } else if (nextButton && nextButton.style.display !== 'none') {
                    this.nextQuestion();
                }
            }
            
            // Space for bookmark
            if (event.key === ' ' && event.ctrlKey) {
                event.preventDefault();
                this.toggleBookmark();
            }
        }
    }

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