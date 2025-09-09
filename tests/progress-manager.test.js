// Critical Priority Tests - Progress Tracking & Data Persistence
class ProgressManagerTests {
    constructor() {
        this.testResults = [];
        this.originalLocalStorage = {};
    }

    async runAllTests() {
        console.log('🧪 Running Critical Priority Tests - Progress Tracking & Data Persistence');
        
        await this.testSessionManagement();
        await this.testDataPersistence();
        await this.testStatisticsCalculation();
        await this.testProgressTracking();
        await this.testDataMigration();
        
        return this.testResults;
    }

    async testSessionManagement() {
        const test = { name: 'Session Management', status: 'running' };
        
        try {
            // Create mock progress manager
            const progressManager = new ProgressManager();
            
            // Test session start
            const session = progressManager.startSession();
            this.assert(session.id, 'Session should have unique ID');
            this.assert(session.startTime, 'Session should have start time');
            this.assert(Array.isArray(session.questions), 'Session should have questions array');
            this.assert(session.totalQuestions === 0, 'New session should start with 0 questions');
            this.assert(session.correctAnswers === 0, 'New session should start with 0 correct answers');
            
            // Test adding question to session
            const mockQuestion = {
                id: 'test001',
                question: 'Test question',
                userAnswer: 'A',
                correctAnswer: 'B',
                isCorrect: false,
                timeSpent: 45
            };
            
            const currentSession = progressManager.getCurrentSession();
            if (currentSession) {
                progressManager.addQuestionToSession(mockQuestion);
                
                this.assert(currentSession.questions.length === 1, 'Question should be added to session');
                this.assert(currentSession.totalQuestions === 1, 'Total questions should increment');
            }
            
            test.status = 'passed';
            test.message = '✅ Session management works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Session management failed: ${error.message}`;
        }
        
        this.testResults.push(test);
    }

    async testDataPersistence() {
        const test = { name: 'Data Persistence (localStorage)', status: 'running' };
        
        try {
            // Mock localStorage for testing
            this.mockLocalStorage();
            
            const progressManager = new ProgressManager();
            
            // Test initial data creation
            const initialData = progressManager.getProgressData();
            this.assert(initialData.user, 'Progress data should have user section');
            this.assert(initialData.statistics, 'Progress data should have statistics section');
            this.assert(initialData.categories, 'Progress data should have categories section');
            this.assert(Array.isArray(initialData.sessions), 'Sessions should be an array');
            
            // Test data saving
            const testData = {
                ...initialData,
                user: { ...initialData.user, name: 'Test User' },
                statistics: { ...initialData.statistics, totalQuestions: 50 }
            };
            
            progressManager.saveProgressData(testData);
            
            // Test data loading
            const loadedData = progressManager.getProgressData();
            this.assert(loadedData.user.name === 'Test User', 'User data should persist');
            this.assert(loadedData.statistics.totalQuestions === 50, 'Statistics should persist');
            
            // Test data structure validation
            this.assert(loadedData.user.preferences, 'User preferences should exist');
            this.assert(loadedData.user.preferences.dailyGoal, 'Daily goal should exist');
            this.assert(typeof loadedData.statistics.totalQuestions === 'number', 'Statistics should be numeric');
            
            test.status = 'passed';
            test.message = '✅ Data persistence works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Data persistence failed: ${error.message}`;
        } finally {
            this.restoreLocalStorage();
        }
        
        this.testResults.push(test);
    }

    async testStatisticsCalculation() {
        const test = { name: 'Statistics Calculation', status: 'running' };
        
        try {
            this.mockLocalStorage();
            const progressManager = new ProgressManager();
            
            // Test session completion with statistics
            const session = progressManager.startSession();
            
            // Add multiple questions with different results
            const questions = [
                { id: 'q1', userAnswer: 'A', correctAnswer: 'A', isCorrect: true, timeSpent: 30 },
                { id: 'q2', userAnswer: 'B', correctAnswer: 'C', isCorrect: false, timeSpent: 45 },
                { id: 'q3', userAnswer: 'D', correctAnswer: 'D', isCorrect: true, timeSpent: 25 },
                { id: 'q4', userAnswer: 'A', correctAnswer: 'B', isCorrect: false, timeSpent: 60 }
            ];
            
            questions.forEach(q => progressManager.addQuestionToSession(q));
            
            // Complete session and check calculations
            const completedSession = progressManager.completeSession();
            
            this.assert(completedSession.totalQuestions === 4, 'Total questions should be 4');
            this.assert(completedSession.correctAnswers === 2, 'Correct answers should be 2');
            this.assert(completedSession.accuracy === 50, 'Accuracy should be 50%');
            this.assert(completedSession.timeSpent === 160, 'Total time should be 160 seconds');
            
            // Check progress data update
            const progressData = progressManager.getProgressData();
            this.assert(progressData.statistics.totalQuestions >= 4, 'Global statistics should update');
            this.assert(progressData.statistics.correctAnswers >= 2, 'Global correct answers should update');
            
            test.status = 'passed';
            test.message = '✅ Statistics calculation works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Statistics calculation failed: ${error.message}`;
        } finally {
            this.restoreLocalStorage();
        }
        
        this.testResults.push(test);
    }

    async testProgressTracking() {
        const test = { name: 'Progress Tracking', status: 'running' };
        
        try {
            this.mockLocalStorage();
            const progressManager = new ProgressManager();
            
            // Test study streak calculation
            const initialData = progressManager.getProgressData();
            
            // Simulate study activity
            const today = new Date().toISOString().split('T')[0];
            progressManager.updateStudyStreak();
            
            const updatedData = progressManager.getProgressData();
            this.assert(typeof updatedData.user.studyStreak === 'number', 'Study streak should be a number');
            
            // Test category tracking
            const categoryStats = progressManager.getCategoryStats('Medicina Interna');
            this.assert(typeof categoryStats === 'object', 'Category stats should return object');
            
            // Test performance tracking
            const performance = progressManager.getPerformanceData();
            this.assert(Array.isArray(performance.daily), 'Daily performance should be array');
            this.assert(Array.isArray(performance.weekly), 'Weekly performance should be array');
            this.assert(Array.isArray(performance.monthly), 'Monthly performance should be array');
            
            test.status = 'passed';
            test.message = '✅ Progress tracking works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Progress tracking failed: ${error.message}`;
        } finally {
            this.restoreLocalStorage();
        }
        
        this.testResults.push(test);
    }

    async testDataMigration() {
        const test = { name: 'Data Migration & Compatibility', status: 'running' };
        
        try {
            this.mockLocalStorage();
            
            // Test with old data format
            const oldFormatData = {
                totalQuestions: 100,
                correctAnswers: 75,
                // Missing new fields that should be migrated
            };
            
            localStorage.setItem('enarm-progress', JSON.stringify(oldFormatData));
            
            const progressManager = new ProgressManager();
            const migratedData = progressManager.getProgressData();
            
            // Verify migration worked
            this.assert(migratedData.user, 'Migrated data should have user section');
            this.assert(migratedData.statistics, 'Migrated data should have statistics section');
            this.assert(migratedData.categories, 'Migrated data should have categories section');
            this.assert(Array.isArray(migratedData.sessions), 'Migrated data should have sessions array');
            
            // Test with corrupted data
            localStorage.setItem('enarm-progress', 'invalid-json');
            
            const progressManager2 = new ProgressManager();
            const defaultData = progressManager2.getProgressData();
            
            this.assert(defaultData.user, 'Should fallback to default data structure');
            this.assert(defaultData.statistics.totalQuestions === 0, 'Should reset to default values');
            
            test.status = 'passed';
            test.message = '✅ Data migration and compatibility works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Data migration failed: ${error.message}`;
        } finally {
            this.restoreLocalStorage();
        }
        
        this.testResults.push(test);
    }

    // Helper methods
    mockLocalStorage() {
        // Save original localStorage data
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

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
}

// Export for test runner
window.ProgressManagerTests = ProgressManagerTests;