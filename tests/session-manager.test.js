// ENARM Prep - SessionManager Unit Tests
describe('SessionManager', () => {
    let sessionManager;
    let mockProgressData;
    let mockQuestions;

    beforeAll(() => {
        // Initialize test environment
        sessionManager = window.SessionManager;
    });

    beforeEach(() => {
        // Reset SessionManager state
        sessionManager.resetSession();
        
        // Create mock data
        mockProgressData = TestFramework.createMockProgress();
        mockQuestions = [
            TestFramework.createMockQuestion({ 
                id: 'q1', 
                category: 'Cardiología',
                difficulty: 'basico' 
            }),
            TestFramework.createMockQuestion({ 
                id: 'q2', 
                category: 'Neurología',
                difficulty: 'intermedio' 
            }),
            TestFramework.createMockQuestion({ 
                id: 'q3', 
                category: 'Pediatría',
                difficulty: 'avanzado' 
            })
        ];

        // Mock question bank
        window.questionBank = mockQuestions;
    });

    afterEach(() => {
        TestFramework.restoreMocks();
        TestFramework.restoreSpies();
    });

    describe('Session Configuration', () => {
        it('should configure session with default values', () => {
            const config = sessionManager.configureSession({});
            
            expect(config).toHaveProperty('specialty');
            expect(config).toHaveProperty('difficulty');
            expect(config).toHaveProperty('questionsCount', 10);
            expect(config).toHaveProperty('timeLimit', 0);
            expect(config).toHaveProperty('mode', 'study');
        });

        it('should override default configuration', () => {
            const customConfig = {
                specialty: 'Cardiología',
                difficulty: 'intermedio',
                questionsCount: 20,
                timeLimit: 1800,
                mode: 'exam_simulation'
            };

            const config = sessionManager.configureSession(customConfig);
            
            expect(config.specialty).toBe('Cardiología');
            expect(config.difficulty).toBe('intermedio');
            expect(config.questionsCount).toBe(20);
            expect(config.timeLimit).toBe(1800);
            expect(config.mode).toBe('exam_simulation');
        });

        it('should validate session configuration', () => {
            const invalidConfig = { questionsCount: -5 };
            const validation = sessionManager.validateSessionConfig(invalidConfig);
            
            expect(validation.valid).toBeFalsy();
            expect(validation.errors).toHaveLength(1);
            expect(validation.errors[0]).toContain('between 1 and 500');
        });
    });

    describe('Session Lifecycle', () => {
        it('should start a new session successfully', () => {
            const result = sessionManager.startSession(mockQuestions);
            
            expect(result.success).toBeTruthy();
            expect(result.session).toHaveProperty('id');
            expect(result.session).toHaveProperty('startTime');
            expect(result.session.status).toBe('active');
            expect(result.session.questions).toHaveLength(3);
        });

        it('should fail to start session with no questions', () => {
            const result = sessionManager.startSession([]);
            
            expect(result.success).toBeFalsy();
            expect(result.error).toContain('No questions available');
        });

        it('should end session and calculate summary', () => {
            // Start session
            sessionManager.startSession(mockQuestions);
            
            // Submit some answers
            sessionManager.submitAnswer('B');
            sessionManager.nextQuestion();
            sessionManager.submitAnswer('A');
            
            // End session
            const result = sessionManager.endSession();
            
            expect(result.success).toBeTruthy();
            expect(result.session.status).toBe('completed');
            expect(result.session).toHaveProperty('endTime');
            expect(result.summary).toHaveProperty('totalQuestions');
            expect(result.summary).toHaveProperty('correctAnswers');
            expect(result.summary).toHaveProperty('accuracy');
        });

        it('should handle session end without active session', () => {
            const result = sessionManager.endSession();
            
            expect(result.success).toBeFalsy();
            expect(result.error).toBe('No active session');
        });
    });

    describe('Question Management', () => {
        beforeEach(() => {
            sessionManager.configureSession({ questionsCount: 2 });
            sessionManager.startSession(mockQuestions);
        });

        it('should show current question', () => {
            const result = sessionManager.showCurrentQuestion();
            
            expect(result.success).toBeTruthy();
            expect(result.questionData).toHaveProperty('question');
            expect(result.questionData).toHaveProperty('index', 0);
            expect(result.questionData).toHaveProperty('total', 2);
        });

        it('should submit answer and record result', () => {
            const result = sessionManager.submitAnswer('B');
            
            expect(result.success).toBeTruthy();
            expect(result.result).toHaveProperty('selectedAnswer', 'B');
            expect(result.result).toHaveProperty('isCorrect');
            expect(result.result).toHaveProperty('timeSpent');
        });

        it('should reject invalid answer submission', () => {
            const result = sessionManager.submitAnswer('');
            
            expect(result.success).toBeFalsy();
            expect(result.error).toContain('Invalid question or answer');
        });

        it('should navigate to next question', () => {
            sessionManager.submitAnswer('B');
            const result = sessionManager.nextQuestion();
            
            // Should show next question
            const currentInfo = sessionManager.getCurrentSessionInfo();
            expect(currentInfo.currentQuestionIndex).toBe(1);
        });

        it('should end session when reaching last question', () => {
            // Answer all questions
            sessionManager.submitAnswer('B');
            sessionManager.nextQuestion();
            sessionManager.submitAnswer('B');
            
            const result = sessionManager.nextQuestion();
            
            // Session should end
            expect(result.session).toBeTruthy();
            expect(result.session.status).toBe('completed');
        });
    });

    describe('Question Filtering', () => {
        beforeEach(() => {
            sessionManager.configureSession({
                specialty: 'Cardiología',
                difficulty: 'basico'
            });
        });

        it('should filter questions by specialty', () => {
            const filtered = sessionManager.getFilteredQuestions();
            
            expect(filtered).toHaveLength(1);
            expect(filtered[0].category).toBe('Cardiología');
        });

        it('should filter questions by difficulty', () => {
            sessionManager.configureSession({
                specialty: '',
                difficulty: 'intermedio'
            });
            
            const filtered = sessionManager.getFilteredQuestions();
            
            expect(filtered).toHaveLength(1);
            expect(filtered[0].difficulty).toBe('intermedio');
        });

        it('should return all questions when no filters applied', () => {
            sessionManager.configureSession({
                specialty: '',
                difficulty: ''
            });
            
            const filtered = sessionManager.getFilteredQuestions();
            
            expect(filtered).toHaveLength(3);
        });
    });

    describe('Progress Integration', () => {
        let mockStorageService;

        beforeEach(() => {
            mockStorageService = TestFramework.mock(
                window.StorageService, 
                'setItem', 
                () => true
            );
            
            sessionManager.startSession([mockQuestions[0]]);
        });

        it('should record answer in progress', () => {
            sessionManager.submitAnswer('B');
            
            expect(mockStorageService.calls).toHaveLength(1);
            
            const callArgs = mockStorageService.calls[0].args;
            expect(callArgs[0]).toBe('enarm-progress');
            expect(callArgs[1]).toHaveProperty('answers');
        });

        it('should save session to progress on end', () => {
            sessionManager.submitAnswer('B');
            sessionManager.endSession();
            
            // Should have called setItem multiple times
            expect(mockStorageService.calls.length).toBeGreaterThan(1);
        });
    });

    describe('Session Statistics', () => {
        beforeEach(() => {
            sessionManager.startSession(mockQuestions);
            
            // Submit answers with known results
            sessionManager.submitAnswer('B'); // Correct
            sessionManager.nextQuestion();
            sessionManager.submitAnswer('A'); // Incorrect
            sessionManager.nextQuestion();
            sessionManager.submitAnswer('B'); // Correct
        });

        it('should calculate correct session summary', () => {
            const summary = sessionManager.calculateSessionSummary();
            
            expect(summary.totalQuestions).toBe(3);
            expect(summary.correctAnswers).toBe(2);
            expect(summary.incorrectAnswers).toBe(1);
            expect(summary.accuracy).toBe(67); // 2/3 * 100, rounded
        });

        it('should calculate category breakdown', () => {
            const breakdown = sessionManager.getCategoryBreakdown();
            
            expect(breakdown).toHaveProperty('Cardiología');
            expect(breakdown).toHaveProperty('Neurología');
            expect(breakdown).toHaveProperty('Pediatría');
            
            expect(breakdown['Cardiología'].total).toBe(1);
            expect(breakdown['Neurología'].total).toBe(1);
            expect(breakdown['Pediatría'].total).toBe(1);
        });

        it('should calculate difficulty breakdown', () => {
            const breakdown = sessionManager.getDifficultyBreakdown();
            
            expect(breakdown).toHaveProperty('basico');
            expect(breakdown).toHaveProperty('intermedio');
            expect(breakdown).toHaveProperty('avanzado');
            
            expect(breakdown['basico'].total).toBe(1);
            expect(breakdown['intermedio'].total).toBe(1);
            expect(breakdown['avanzado'].total).toBe(1);
        });
    });

    describe('Random Question Mode', () => {
        it('should show random question', () => {
            const result = sessionManager.showRandomQuestion();
            
            expect(result.success).toBeTruthy();
            expect(result.question).toHaveProperty('id');
            expect(result.question).toHaveProperty('category');
        });

        it('should create single question session', () => {
            sessionManager.startSingleQuestionSession(mockQuestions[0]);
            
            const sessionInfo = sessionManager.getCurrentSessionInfo();
            expect(sessionInfo.totalQuestions).toBe(1);
            expect(sessionInfo.config.mode).toBe('single');
        });
    });

    describe('Event System', () => {
        let eventCallback;
        let receivedEvents;

        beforeEach(() => {
            receivedEvents = [];
            eventCallback = (data) => {
                receivedEvents.push(data);
            };
            
            sessionManager.addEventListener('sessionStart', eventCallback);
            sessionManager.addEventListener('answerSubmit', eventCallback);
        });

        afterEach(() => {
            sessionManager.removeEventListener('sessionStart', eventCallback);
            sessionManager.removeEventListener('answerSubmit', eventCallback);
        });

        it('should notify listeners on session start', () => {
            sessionManager.startSession(mockQuestions);
            
            expect(receivedEvents).toHaveLength(1);
            expect(receivedEvents[0]).toHaveProperty('session');
            expect(receivedEvents[0]).toHaveProperty('questionsCount', 3);
        });

        it('should notify listeners on answer submit', () => {
            sessionManager.startSession(mockQuestions);
            sessionManager.submitAnswer('B');
            
            expect(receivedEvents).toHaveLength(2); // sessionStart + answerSubmit
            
            const answerEvent = receivedEvents[1];
            expect(answerEvent).toHaveProperty('result');
            expect(answerEvent).toHaveProperty('explanation');
        });

        it('should remove event listeners', () => {
            sessionManager.removeEventListener('sessionStart', eventCallback);
            sessionManager.startSession(mockQuestions);
            
            // Should only have answerSubmit listener
            expect(receivedEvents).toHaveLength(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed question data gracefully', () => {
            const badQuestions = [{ invalid: 'question' }];
            
            expect(() => {
                sessionManager.startSession(badQuestions);
            }).not.toThrow();
        });

        it('should handle missing question bank', () => {
            window.questionBank = undefined;
            
            const result = sessionManager.showRandomQuestion();
            
            expect(result.success).toBeFalsy();
            expect(result.error).toContain('No questions available');
        });

        it('should handle storage errors gracefully', () => {
            TestFramework.mock(window.StorageService, 'setItem', () => {
                throw new Error('Storage error');
            });
            
            // Should not throw, but handle gracefully
            expect(() => {
                sessionManager.startSession(mockQuestions);
                sessionManager.submitAnswer('B');
            }).not.toThrow();
        });
    });
});