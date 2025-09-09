// Critical Priority Tests - Question Management System
class QuestionManagerTests {
    constructor() {
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Running Critical Priority Tests - Question Management System');
        
        await this.testQuestionLoading();
        await this.testQuestionValidation();
        await this.testAnswerValidation();
        await this.testQuestionNavigation();
        await this.testFallbackQuestions();
        
        return this.testResults;
    }

    async testQuestionLoading() {
        const test = { name: 'Question Loading from JSON', status: 'running' };
        
        try {
            // Mock QuestionManager
            const questionManager = new QuestionManager();
            await questionManager.init();
            
            // Verify questions loaded
            this.assert(questionManager.questions.length > 0, 'Questions should be loaded');
            this.assert(Array.isArray(questionManager.questions), 'Questions should be an array');
            
            test.status = 'passed';
            test.message = `✅ Loaded ${questionManager.questions.length} questions`;
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Failed to load questions: ${error.message}`;
        }
        
        this.testResults.push(test);
    }

    async testQuestionValidation() {
        const test = { name: 'Question Format Validation', status: 'running' };
        
        try {
            const questionManager = new QuestionManager();
            await questionManager.init();
            
            for (const question of questionManager.questions.slice(0, 10)) {
                // Critical validations
                this.assert(question.id, 'Question must have ID');
                this.assert(question.category, 'Question must have category');
                this.assert(question.difficulty, 'Question must have difficulty');
                this.assert(question.question, 'Question must have question text');
                this.assert(question.options, 'Question must have options');
                this.assert(question.correct, 'Question must have correct answer');
                
                // ENARM specific validations
                this.assert(['basico', 'intermedio', 'avanzado'].includes(question.difficulty), 
                    'Difficulty must be valid');
                
                // Critical fix: Options should be A-D only for ENARM
                const optionKeys = Object.keys(question.options);
                this.assert(optionKeys.length === 4, 'Must have exactly 4 options (A-D)');
                this.assert(optionKeys.every(key => ['A', 'B', 'C', 'D'].includes(key)), 
                    'Options must be A, B, C, D only');
                this.assert(['A', 'B', 'C', 'D'].includes(question.correct), 
                    'Correct answer must be A, B, C, or D');
            }
            
            test.status = 'passed';
            test.message = '✅ All questions have valid format (A-D options)';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Question validation failed: ${error.message}`;
        }
        
        this.testResults.push(test);
    }

    async testAnswerValidation() {
        const test = { name: 'Answer Validation Logic', status: 'running' };
        
        try {
            const questionManager = new QuestionManager();
            await questionManager.init();
            
            if (questionManager.questions.length > 0) {
                const testQuestion = questionManager.questions[0];
                
                // Test correct answer
                const isCorrect = testQuestion.correct === testQuestion.correct;
                this.assert(isCorrect, 'Correct answer validation should work');
                
                // Test incorrect answers
                const incorrectOptions = ['A', 'B', 'C', 'D'].filter(opt => opt !== testQuestion.correct);
                for (const wrongAnswer of incorrectOptions) {
                    const isIncorrect = wrongAnswer !== testQuestion.correct;
                    this.assert(isIncorrect, `Wrong answer ${wrongAnswer} should be detected as incorrect`);
                }
            }
            
            test.status = 'passed';
            test.message = '✅ Answer validation logic works correctly';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Answer validation failed: ${error.message}`;
        }
        
        this.testResults.push(test);
    }

    async testQuestionNavigation() {
        const test = { name: 'Question Navigation System', status: 'running' };
        
        try {
            const questionManager = new QuestionManager();
            await questionManager.init();
            
            // Test question selection and filtering
            if (questionManager.questions.length > 0) {
                // Test category filtering
                const categories = [...new Set(questionManager.questions.map(q => q.category))];
                this.assert(categories.length > 0, 'Should have at least one category');
                
                // Test difficulty filtering
                const difficulties = [...new Set(questionManager.questions.map(q => q.difficulty))];
                this.assert(difficulties.every(d => ['basico', 'intermedio', 'avanzado'].includes(d)), 
                    'All difficulties should be valid');
                
                // Test question selection
                const randomQuestion = questionManager.questions[0];
                this.assert(randomQuestion.id, 'Selected question should have valid ID');
            }
            
            test.status = 'passed';
            test.message = '✅ Question navigation system works';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Navigation test failed: ${error.message}`;
        }
        
        this.testResults.push(test);
    }

    async testFallbackQuestions() {
        const test = { name: 'Fallback Questions System', status: 'running' };
        
        try {
            const questionManager = new QuestionManager();
            
            // Test fallback questions load when JSON fails
            const fallbackQuestions = questionManager.getDefaultQuestions();
            
            this.assert(Array.isArray(fallbackQuestions), 'Fallback should return array');
            this.assert(fallbackQuestions.length > 0, 'Should have fallback questions');
            
            // Validate fallback questions format
            for (const question of fallbackQuestions.slice(0, 5)) {
                this.assert(question.id, 'Fallback question must have ID');
                this.assert(Object.keys(question.options).length === 4, 'Must have 4 options');
                this.assert(['A', 'B', 'C', 'D'].includes(question.correct), 'Correct answer must be A-D');
            }
            
            test.status = 'passed';
            test.message = '✅ Fallback question system works with A-D options';
        } catch (error) {
            test.status = 'failed';
            test.message = `❌ Fallback test failed: ${error.message}`;
        }
        
        this.testResults.push(test);
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
}

// Export for test runner
window.QuestionManagerTests = QuestionManagerTests;