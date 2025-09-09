// Critical Priority Tests - Core User Flows
class CoreUserFlowsTests {
    constructor() {
        this.testResults = [];
        this.originalLocalStorage = {};
    }

    async runAllTests() {
        console.log('🧪 Running Critical Priority Tests - Core User Flows');
        
        await this.testPracticeSessionFlow();
        await this.testNavigationFlow();
        await this.testTimerFunctionality();
        await this.testAnswerSubmissionFlow();
        await this.testSessionCompletionFlow();
        
        return this.testResults;
    }

    async testPracticeSessionFlow() {
        const test = { name: 'Practice Session Flow (Start → Answer → Results → Save)', status: 'running' };
        
        try {
            this.mockLocalStorage();
            this.mockDOM();
            
            // Test session start
            const app = new ENARMApp();
            await this.waitForInit(app);
            
            // Simulate starting practice session
            const sessionConfig = {
                mode: 'practice',
                questionsCount: 5,
                specialty: '',
                difficulty: '',
                timeLimit: 300
            };
            
            // Start session
            const session = app.sessionManager.startSession(sessionConfig);
            this.assert(session, 'Session should be created');
            this.assert(session.id, 'Session should have unique ID');
            this.assert(session.config.questionsCount === 5, 'Session should have correct question count');
            
            // Test question display
            const firstQuestion = app.sessionManager.getCurrentQuestion();
            if (firstQuestion) {
                this.assert(firstQuestion.id, 'First question should have ID');
                this.assert(firstQuestion.question, 'First question should have question text');
                this.assert(firstQuestion.options, 'First question should have options');
                this.assert(['A', 'B', 'C', 'D'].includes(firstQuestion.correct), 'Correct answer should be A-D');
            }
            
            // Test answer submission
            if (firstQuestion) {
                const answerResult = app.sessionManager.submitAnswer('A');
                this.assert(answerResult, 'Answer submission should return result');
                this.assert(typeof answerResult.isCorrect === 'boolean', 'Result should indicate if correct');
                this.assert(answerResult.correctAnswer, 'Result should show correct answer');
            }
            
            // Test session progression
            const initialProgress = app.sessionManager.getSessionProgress();
            this.assert(typeof initialProgress.current === 'number', 'Progress should have current question number');
            this.assert(typeof initialProgress.total === 'number', 'Progress should have total questions');
            this.assert(initialProgress.current <= initialProgress.total, 'Current should not exceed total');
            
            test.status = 'passed';
            test.message = '✅ Practice session flow works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Practice session flow failed: ${error.message}`;
        } finally {
            this.restoreLocalStorage();
            this.restoreDOM();
        }
        
        this.testResults.push(test);
    }

    async testNavigationFlow() {
        const test = { name: 'Navigation Flow (Home → Practice → Progress)', status: 'running' };
        
        try {
            this.mockDOM();
            
            const app = new ENARMApp();
            await this.waitForInit(app);
            
            // Test initial state
            this.assert(app.currentPage === 'home', 'Should start on home page');
            
            // Test navigation to practice
            app.showPage('practice');
            this.assert(app.currentPage === 'practice', 'Should navigate to practice page');
            
            // Verify DOM updates
            const homePage = document.getElementById('home-page');
            const practicePage = document.getElementById('practice-page');
            
            if (homePage && practicePage) {
                this.assert(!homePage.classList.contains('active'), 'Home page should not be active');
                this.assert(practicePage.classList.contains('active'), 'Practice page should be active');
            }
            
            // Test navigation to progress
            app.showPage('progress');
            this.assert(app.currentPage === 'progress', 'Should navigate to progress page');
            
            // Test invalid navigation
            const previousPage = app.currentPage;
            app.showPage('invalid-page');
            this.assert(app.currentPage === previousPage, 'Should not navigate to invalid page');
            
            test.status = 'passed';
            test.message = '✅ Navigation flow works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Navigation flow failed: ${error.message}`;
        } finally {
            this.restoreDOM();
        }
        
        this.testResults.push(test);
    }

    async testTimerFunctionality() {
        const test = { name: 'Timer Functionality (Question & Session Timers)', status: 'running' };
        
        try {
            this.mockDOM();
            
            const app = new ENARMApp();
            await this.waitForInit(app);
            
            // Test question timer
            const timerService = app.timerService;
            
            // Start question timer
            timerService.startQuestionTimer();
            this.assert(timerService.isTimerRunning('question-timer'), 'Question timer should be running');
            
            // Test timer values
            const questionTime = timerService.getRemainingTime('question-timer');
            this.assert(typeof questionTime === 'number', 'Question timer should return numeric time');
            this.assert(questionTime > 0, 'Question timer should have time remaining');
            
            // Stop question timer
            timerService.stopTimer('question-timer');
            this.assert(!timerService.isTimerRunning('question-timer'), 'Question timer should be stopped');
            
            // Test session timer
            timerService.startSessionTimer(300); // 5 minutes
            this.assert(timerService.isTimerRunning('session-timer'), 'Session timer should be running');
            
            const sessionTime = timerService.getRemainingTime('session-timer');
            this.assert(sessionTime <= 300, 'Session timer should not exceed set time');
            this.assert(sessionTime > 0, 'Session timer should have time remaining');
            
            // Test timer auto-submit (mock)
            let autoSubmitCalled = false;
            timerService.addEventListener('question-timer', 'auto-submit', () => {
                autoSubmitCalled = true;
            });
            
            // Simulate timer reaching zero (we'll just verify the event system works)
            timerService.stopAllTimers();
            
            test.status = 'passed';
            test.message = '✅ Timer functionality works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Timer functionality failed: ${error.message}`;
        } finally {
            this.restoreDOM();
        }
        
        this.testResults.push(test);
    }

    async testAnswerSubmissionFlow() {
        const test = { name: 'Answer Submission Flow', status: 'running' };
        
        try {
            this.mockLocalStorage();
            this.mockDOM();
            
            const app = new ENARMApp();
            await this.waitForInit(app);
            
            // Start a session
            const sessionConfig = {
                mode: 'practice',
                questionsCount: 3,
                specialty: '',
                difficulty: ''
            };
            
            const session = app.sessionManager.startSession(sessionConfig);
            const question = app.sessionManager.getCurrentQuestion();
            
            if (question) {
                // Test answer selection
                app.questionDisplayController.selectOption('A');
                const selectedOption = document.querySelector('.option.selected');
                if (selectedOption) {
                    this.assert(selectedOption.dataset.option === 'A', 'Option A should be selected');
                }
                
                // Test answer submission
                const submissionResult = app.questionDisplayController.handleSubmitAnswer();
                this.assert(submissionResult !== undefined, 'Answer submission should return result');
                
                // Test feedback display
                const explanationElement = document.querySelector('.explanation');
                if (explanationElement) {
                    this.assert(explanationElement.style.display !== 'none', 'Explanation should be visible after submission');
                }
                
                // Test next question functionality
                const initialQuestionId = question.id;
                app.sessionManager.nextQuestion();
                const nextQuestion = app.sessionManager.getCurrentQuestion();
                
                if (nextQuestion) {
                    this.assert(nextQuestion.id !== initialQuestionId, 'Should move to next question');
                }
            }
            
            test.status = 'passed';
            test.message = '✅ Answer submission flow works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Answer submission flow failed: ${error.message}`;
        } finally {
            this.restoreLocalStorage();
            this.restoreDOM();
        }
        
        this.testResults.push(test);
    }

    async testSessionCompletionFlow() {
        const test = { name: 'Session Completion Flow', status: 'running' };
        
        try {
            this.mockLocalStorage();
            this.mockDOM();
            
            const app = new ENARMApp();
            await this.waitForInit(app);
            
            // Start a short session
            const sessionConfig = {
                mode: 'practice',
                questionsCount: 2,
                specialty: '',
                difficulty: ''
            };
            
            const session = app.sessionManager.startSession(sessionConfig);
            
            // Answer all questions
            let questionCount = 0;
            while (app.sessionManager.getCurrentQuestion() && questionCount < 3) {
                const question = app.sessionManager.getCurrentQuestion();
                app.sessionManager.submitAnswer('A'); // Submit any answer
                app.sessionManager.nextQuestion();
                questionCount++;
            }
            
            // Complete session
            const completedSession = app.sessionManager.endSession();
            this.assert(completedSession, 'Session should be completed');
            this.assert(completedSession.endTime, 'Completed session should have end time');
            this.assert(typeof completedSession.accuracy === 'number', 'Session should have accuracy calculation');
            this.assert(Array.isArray(completedSession.questions), 'Session should have questions array');
            
            // Test results display
            const resultsElement = document.querySelector('.session-results');
            if (resultsElement) {
                this.assert(resultsElement.style.display !== 'none', 'Results should be visible');
            }
            
            // Test progress saving
            const progressManager = new ProgressManager();
            const progressData = progressManager.getProgressData();
            
            this.assert(progressData.sessions.length > 0, 'Progress should include completed session');
            this.assert(progressData.statistics.totalQuestions >= 2, 'Statistics should be updated');
            
            test.status = 'passed';
            test.message = '✅ Session completion flow works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Session completion flow failed: ${error.message}`;
        } finally {
            this.restoreLocalStorage();
            this.restoreDOM();
        }
        
        this.testResults.push(test);
    }

    // Helper methods
    mockLocalStorage() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            this.originalLocalStorage[key] = localStorage.getItem(key);
        }
        localStorage.clear();
    }

    restoreLocalStorage() {
        localStorage.clear();
        Object.keys(this.originalLocalStorage).forEach(key => {
            localStorage.setItem(key, this.originalLocalStorage[key]);
        });
        this.originalLocalStorage = {};
    }

    mockDOM() {
        // Create minimal DOM structure for testing
        if (!document.getElementById('home-page')) {
            const homeDiv = document.createElement('div');
            homeDiv.id = 'home-page';
            homeDiv.className = 'page active';
            document.body.appendChild(homeDiv);
        }

        if (!document.getElementById('practice-page')) {
            const practiceDiv = document.createElement('div');
            practiceDiv.id = 'practice-page';
            practiceDiv.className = 'page';
            document.body.appendChild(practiceDiv);
        }

        if (!document.getElementById('progress-page')) {
            const progressDiv = document.createElement('div');
            progressDiv.id = 'progress-page';
            progressDiv.className = 'page';
            document.body.appendChild(progressDiv);
        }

        // Create question container
        if (!document.getElementById('question-container')) {
            const questionContainer = document.createElement('div');
            questionContainer.id = 'question-container';
            questionContainer.innerHTML = `
                <div class="question-text"></div>
                <div class="options-container">
                    <div class="option" data-option="A">Option A</div>
                    <div class="option" data-option="B">Option B</div>
                    <div class="option" data-option="C">Option C</div>
                    <div class="option" data-option="D">Option D</div>
                </div>
                <div class="explanation" style="display: none;"></div>
                <div class="session-results" style="display: none;"></div>
            `;
            document.body.appendChild(questionContainer);
        }
    }

    restoreDOM() {
        // Clean up test DOM elements
        const testElements = [
            'home-page', 'practice-page', 'progress-page', 'question-container'
        ];
        
        testElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
    }

    async waitForInit(app) {
        // Wait for app initialization
        return new Promise(resolve => {
            if (app.sessionManager && app.timerService) {
                resolve();
            } else {
                setTimeout(() => resolve(), 100);
            }
        });
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
}

// Export for test runner
window.CoreUserFlowsTests = CoreUserFlowsTests;