// ENARM Prep - Question Display Controller
class QuestionDisplayController {
    constructor() {
        this.currentQuestionData = null;
        this.elements = this.initializeElements();
        this.state = {
            isAnswered: false,
            selectedAnswer: null,
            showingExplanation: false
        };
        
        this.setupEventListeners();
    }

    // DOM Element References
    initializeElements() {
        return {
            // Containers
            questionContainer: document.getElementById('question-container'),
            practiceResults: document.getElementById('practice-results'),
            configPanel: document.getElementById('config-panel'),
            practiceModesGrid: document.querySelector('.practice-modes-grid'),
            
            // Question Meta
            currentQuestion: document.getElementById('current-question'),
            totalQuestions: document.getElementById('total-questions-practice'),
            questionDifficulty: document.getElementById('question-difficulty'),
            questionCategory: document.getElementById('question-category'),
            
            // Question Content
            questionText: document.getElementById('question-text'),
            questionOptions: document.getElementById('question-options'),
            
            // Timers
            timerDisplay: document.getElementById('timer-display'),
            sessionTimer: document.getElementById('session-timer'),
            sessionTimerDisplay: document.getElementById('session-timer-display'),
            
            // Buttons
            submitAnswer: document.getElementById('submit-answer'),
            nextQuestion: document.getElementById('next-question'),
            bookmarkQuestion: document.getElementById('bookmark-question'),
            bookmarkIcon: document.getElementById('bookmark-icon'),
            
            // Answer Explanation
            answerExplanation: document.getElementById('answer-explanation'),
            resultIndicator: document.getElementById('result-indicator'),
            correctAnswerLetter: document.getElementById('correct-answer-letter'),
            explanationText: document.getElementById('explanation-text'),
            explanationReference: document.getElementById('explanation-reference'),
            
            // Results
            correctAnswers: document.getElementById('correct-answers'),
            incorrectAnswers: document.getElementById('incorrect-answers'),
            accuracyPercentage: document.getElementById('accuracy-percentage'),
            timeSpent: document.getElementById('time-spent'),
            
            // Result Actions
            startNewPractice: document.getElementById('start-new-practice'),
            reviewIncorrect: document.getElementById('review-incorrect'),
            viewDetailedResults: document.getElementById('view-detailed-results')
        };
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Question interaction
        if (this.elements.submitAnswer) {
            this.elements.submitAnswer.addEventListener('click', () => this.handleSubmitAnswer());
        }
        
        if (this.elements.nextQuestion) {
            this.elements.nextQuestion.addEventListener('click', () => this.handleNextQuestion());
        }
        
        if (this.elements.bookmarkQuestion) {
            this.elements.bookmarkQuestion.addEventListener('click', () => this.handleBookmarkToggle());
        }

        // Result actions
        if (this.elements.startNewPractice) {
            this.elements.startNewPractice.addEventListener('click', () => this.handleStartNewPractice());
        }
        
        if (this.elements.reviewIncorrect) {
            this.elements.reviewIncorrect.addEventListener('click', () => this.handleReviewIncorrect());
        }

        // Option selection
        document.addEventListener('click', (e) => {
            if (e.target.matches('input[name="answer"]')) {
                this.handleOptionSelect(e.target.value);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    // Question Display Methods
    displayQuestion(questionData) {
        try {
            this.currentQuestionData = questionData;
            this.resetQuestionState();
            
            this.showQuestionContainer();
            this.hideResultsContainer();
            
            this.updateQuestionMeta(questionData);
            this.updateQuestionContent(questionData.question);
            this.updateQuestionOptions(questionData.question);
            this.updateBookmarkStatus(questionData.question);
            
            this.resetAnswerExplanation();
            this.resetButtons();
            
            return { success: true };
        } catch (error) {
            ErrorHandler.logError(error, 'QuestionDisplayController.displayQuestion');
            return { success: false, error: error.message };
        }
    }

    updateQuestionMeta(questionData) {
        if (this.elements.currentQuestion) {
            this.elements.currentQuestion.textContent = questionData.index + 1;
        }
        
        if (this.elements.totalQuestions) {
            this.elements.totalQuestions.textContent = questionData.total;
        }
        
        if (this.elements.questionDifficulty) {
            this.elements.questionDifficulty.textContent = CommonUtils.capitalize(questionData.question.difficulty);
        }
        
        if (this.elements.questionCategory) {
            this.elements.questionCategory.textContent = questionData.question.category;
        }
    }

    updateQuestionContent(question) {
        if (this.elements.questionText) {
            // Use safe text setting to prevent XSS
            if (window.DataValidator) {
                this.elements.questionText.textContent = window.DataValidator.sanitizeText(question.question);
            } else {
                this.elements.questionText.textContent = question.question;
            }
        }
    }

    updateQuestionOptions(question) {
        if (!this.elements.questionOptions) return;
        
        // Use performance optimizer for batch DOM updates
        if (window.PerformanceOptimizer) {
            window.PerformanceOptimizer.batchDOM(() => {
                this.renderQuestionOptions(question);
            });
        } else {
            this.renderQuestionOptions(question);
        }
    }

    renderQuestionOptions(question) {
        // Clear existing options safely
        while (this.elements.questionOptions.firstChild) {
            this.elements.questionOptions.removeChild(this.elements.questionOptions.firstChild);
        }
        
        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        Object.entries(question.options).forEach(([letter, text]) => {
            const label = document.createElement('label');
            label.className = 'option-label';
            
            // Create elements safely without innerHTML
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'answer';
            input.value = letter;
            
            const letterSpan = document.createElement('span');
            letterSpan.className = 'option-letter';
            letterSpan.textContent = `${letter})`;
            
            const textSpan = document.createElement('span');
            textSpan.className = 'option-text';
            // Sanitize option text
            if (window.DataValidator) {
                textSpan.textContent = window.DataValidator.sanitizeText(text);
            } else {
                textSpan.textContent = text;
            }
            
            label.appendChild(input);
            label.appendChild(letterSpan);
            label.appendChild(textSpan);
            
            fragment.appendChild(label);
        });
        
        this.elements.questionOptions.appendChild(fragment);
    }

    // Answer Handling
    handleSubmitAnswer() {
        const selectedAnswer = this.getSelectedAnswer();
        if (!selectedAnswer) {
            CommonUtils.createToast('Por favor selecciona una respuesta.', 'warning');
            return;
        }

        // Submit through SessionManager
        const result = SessionManager.submitAnswer(selectedAnswer);
        if (result.success) {
            this.displayAnswerResult(result.result);
        }
    }

    getSelectedAnswer() {
        const selectedInput = document.querySelector('input[name="answer"]:checked');
        return selectedInput ? selectedInput.value : null;
    }

    handleOptionSelect(value) {
        this.state.selectedAnswer = value;
    }

    displayAnswerResult(result) {
        this.state.isAnswered = true;
        this.state.showingExplanation = true;
        
        this.showAnswerExplanation(result);
        this.updateButtonsAfterAnswer();
        this.highlightCorrectAnswer(result);
    }

    showAnswerExplanation(result) {
        if (!this.elements.answerExplanation) return;
        
        // Update result indicator
        if (this.elements.resultIndicator) {
            this.elements.resultIndicator.textContent = result.isCorrect ? '✅ Correcto' : '❌ Incorrecto';
            this.elements.resultIndicator.className = `result-indicator ${result.isCorrect ? 'correct' : 'incorrect'}`;
        }
        
        // Update correct answer
        if (this.elements.correctAnswerLetter) {
            this.elements.correctAnswerLetter.textContent = result.correctAnswer;
        }
        
        // Update explanation text
        if (this.elements.explanationText) {
            this.elements.explanationText.textContent = result.question.explanation;
        }
        
        // Update reference
        if (this.elements.explanationReference && result.question.reference) {
            this.elements.explanationReference.textContent = `Referencia: ${result.question.reference}`;
        }
        
        this.elements.answerExplanation.style.display = 'block';
    }

    highlightCorrectAnswer(result) {
        const options = document.querySelectorAll('input[name="answer"]');
        options.forEach(input => {
            const label = input.closest('.option-label');
            if (input.value === result.correctAnswer) {
                label.classList.add('correct-answer');
            } else if (input.value === result.selectedAnswer && !result.isCorrect) {
                label.classList.add('incorrect-answer');
            }
            input.disabled = true;
        });
    }

    // Navigation Methods
    handleNextQuestion() {
        const result = SessionManager.nextQuestion();
        if (!result.success && result.session) {
            // Session ended, show results
            this.displaySessionResults(result.session, result.summary);
        }
    }

    handleStartNewPractice() {
        this.resetDisplay();
        // This would trigger the practice mode selection UI
        this.showPracticeModeSelection();
    }

    handleReviewIncorrect() {
        // Start review mode with incorrect questions
        PracticeModeController.startReviewMode();
    }

    // Display State Management
    showQuestionContainer() {
        if (this.elements.questionContainer) {
            this.elements.questionContainer.style.display = 'block';
        }
        if (this.elements.practiceModesGrid) {
            this.elements.practiceModesGrid.style.display = 'none';
        }
    }

    hideQuestionContainer() {
        if (this.elements.questionContainer) {
            this.elements.questionContainer.style.display = 'none';
        }
    }

    showResultsContainer() {
        if (this.elements.practiceResults) {
            this.elements.practiceResults.style.display = 'block';
        }
    }

    hideResultsContainer() {
        if (this.elements.practiceResults) {
            this.elements.practiceResults.style.display = 'none';
        }
    }

    showPracticeModeSelection() {
        if (this.elements.practiceModesGrid) {
            this.elements.practiceModesGrid.style.display = 'grid';
        }
        this.hideQuestionContainer();
        this.hideResultsContainer();
    }

    showConfigPanel() {
        if (this.elements.configPanel) {
            this.elements.configPanel.style.display = 'block';
        }
    }

    hideConfigPanel() {
        if (this.elements.configPanel) {
            this.elements.configPanel.style.display = 'none';
        }
    }

    // Session Results Display
    displaySessionResults(session, summary) {
        this.hideQuestionContainer();
        this.showResultsContainer();
        
        this.updateResultsDisplay(summary);
        this.setupResultActions();
    }

    updateResultsDisplay(summary) {
        if (this.elements.correctAnswers) {
            this.elements.correctAnswers.textContent = summary.correctAnswers;
        }
        
        if (this.elements.incorrectAnswers) {
            this.elements.incorrectAnswers.textContent = summary.incorrectAnswers;
        }
        
        if (this.elements.accuracyPercentage) {
            this.elements.accuracyPercentage.textContent = `${summary.accuracy}%`;
        }
        
        if (this.elements.timeSpent) {
            this.elements.timeSpent.textContent = CommonUtils.formatTime(summary.totalTime);
        }
    }

    setupResultActions() {
        // Event listeners are already set up in constructor
        // This method can be used for dynamic result actions if needed
    }

    // Bookmark Management
    handleBookmarkToggle() {
        if (!this.currentQuestionData) return;
        
        const question = this.currentQuestionData.question;
        const bookmarks = StorageService.getItem(AppConstants.STORAGE_KEYS.BOOKMARKS, []);
        const questionId = question.id;
        const index = bookmarks.indexOf(questionId);
        
        if (index === -1) {
            bookmarks.push(questionId);
            CommonUtils.createToast('Pregunta guardada en marcadores', 'success');
        } else {
            bookmarks.splice(index, 1);
            CommonUtils.createToast('Pregunta removida de marcadores', 'info');
        }
        
        StorageService.setItem(AppConstants.STORAGE_KEYS.BOOKMARKS, bookmarks);
        this.updateBookmarkStatus(question);
    }

    updateBookmarkStatus(question) {
        const bookmarks = StorageService.getItem(AppConstants.STORAGE_KEYS.BOOKMARKS, []);
        const isBookmarked = bookmarks.includes(question.id);
        
        if (this.elements.bookmarkIcon) {
            this.elements.bookmarkIcon.textContent = isBookmarked ? '🔖' : '📋';
        }
        
        if (this.elements.bookmarkQuestion) {
            const textSpan = this.elements.bookmarkQuestion.querySelector('span:last-child');
            if (textSpan) {
                textSpan.textContent = isBookmarked ? 'Guardado' : 'Guardar';
            }
        }
    }

    // Button State Management
    resetButtons() {
        if (this.elements.submitAnswer) {
            this.elements.submitAnswer.style.display = 'inline-flex';
            this.elements.submitAnswer.disabled = false;
        }
        
        if (this.elements.nextQuestion) {
            this.elements.nextQuestion.style.display = 'none';
        }
    }

    updateButtonsAfterAnswer() {
        if (this.elements.submitAnswer) {
            this.elements.submitAnswer.style.display = 'none';
        }
        
        if (this.elements.nextQuestion) {
            this.elements.nextQuestion.style.display = 'inline-flex';
        }
    }

    // Reset Methods
    resetQuestionState() {
        this.state = {
            isAnswered: false,
            selectedAnswer: null,
            showingExplanation: false
        };
    }

    resetAnswerExplanation() {
        if (this.elements.answerExplanation) {
            this.elements.answerExplanation.style.display = 'none';
        }
        
        // Remove answer highlighting
        const options = document.querySelectorAll('.option-label');
        options.forEach(label => {
            label.classList.remove('correct-answer', 'incorrect-answer');
        });
        
        // Re-enable inputs
        const inputs = document.querySelectorAll('input[name="answer"]');
        inputs.forEach(input => {
            input.disabled = false;
            input.checked = false;
        });
    }

    resetDisplay() {
        this.hideQuestionContainer();
        this.hideResultsContainer();
        this.hideConfigPanel();
        this.showPracticeModeSelection();
        this.resetQuestionState();
    }

    // Timer Display Updates
    updateTimerDisplay(timeRemaining) {
        if (this.elements.timerDisplay) {
            const timeString = CommonUtils.formatTime(timeRemaining);
            this.elements.timerDisplay.textContent = timeString;
            
            // Apply warning styles
            const isWarning = timeRemaining <= AppConstants.TIMER.WARNING_THRESHOLD;
            this.elements.timerDisplay.style.color = isWarning ? 'var(--error-color)' : 'var(--primary-color)';
        }
    }

    updateSessionTimerDisplay(timeRemaining) {
        if (this.elements.sessionTimer) {
            const hours = Math.floor(timeRemaining / 3600);
            const minutes = Math.floor((timeRemaining % 3600) / 60);
            const seconds = timeRemaining % 60;
            
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            this.elements.sessionTimer.textContent = timeString;
        }
    }

    showSessionTimer() {
        if (this.elements.sessionTimerDisplay) {
            this.elements.sessionTimerDisplay.style.display = 'block';
        }
    }

    hideSessionTimer() {
        if (this.elements.sessionTimerDisplay) {
            this.elements.sessionTimerDisplay.style.display = 'none';
        }
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(event) {
        if (!this.currentQuestionData) return;
        
        // Number keys for options (1-5 -> A-E)
        if (event.key >= '1' && event.key <= '5') {
            const optionIndex = parseInt(event.key) - 1;
            const options = ['A', 'B', 'C', 'D', 'E'];
            if (options[optionIndex]) {
                const radio = document.querySelector(`input[value="${options[optionIndex]}"]`);
                if (radio && !radio.disabled) {
                    radio.checked = true;
                    this.handleOptionSelect(options[optionIndex]);
                }
            }
        }
        
        // Enter to submit/next
        if (event.key === 'Enter') {
            if (!this.state.isAnswered) {
                this.handleSubmitAnswer();
            } else {
                this.handleNextQuestion();
            }
        }
        
        // Space + Ctrl for bookmark
        if (event.key === ' ' && event.ctrlKey) {
            event.preventDefault();
            this.handleBookmarkToggle();
        }
    }

    // Loading States
    showLoading(message = 'Cargando...') {
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.classList.add('active');
            const loadingText = loadingSpinner.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
        }
    }

    hideLoading() {
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.classList.remove('active');
        }
    }

    // Utility Methods
    getCurrentState() {
        return {
            currentQuestion: this.currentQuestionData,
            state: this.state,
            isQuestionVisible: this.elements.questionContainer?.style.display !== 'none',
            isResultsVisible: this.elements.practiceResults?.style.display !== 'none'
        };
    }

    // Error Display
    showError(message, type = 'error') {
        CommonUtils.createToast(message, type);
    }
}

// Create singleton instance
const questionDisplayController = new QuestionDisplayController();

// Export as global
window.QuestionDisplayController = questionDisplayController;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = questionDisplayController;
}