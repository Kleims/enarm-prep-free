// ENARM Prep - Lightweight Testing Framework
class TestFramework {
    constructor() {
        this.tests = [];
        this.suites = new Map();
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            startTime: null,
            endTime: null,
            duration: 0
        };
        this.hooks = {
            beforeAll: [],
            afterAll: [],
            beforeEach: [],
            afterEach: []
        };
        this.currentSuite = null;
        this.mocks = new Map();
        this.spies = new Map();
    }

    // Test Suite Management
    describe(description, testFn) {
        const suite = {
            description,
            tests: [],
            hooks: {
                beforeAll: [],
                afterAll: [],
                beforeEach: [],
                afterEach: []
            },
            parent: this.currentSuite
        };

        this.suites.set(description, suite);
        const previousSuite = this.currentSuite;
        this.currentSuite = suite;

        try {
            testFn();
        } finally {
            this.currentSuite = previousSuite;
        }

        return suite;
    }

    // Individual Test Cases
    it(description, testFn) {
        const test = {
            description,
            fn: testFn,
            suite: this.currentSuite,
            status: 'pending',
            error: null,
            duration: 0,
            async: testFn.length > 0 || this.isAsyncFunction(testFn)
        };

        if (this.currentSuite) {
            this.currentSuite.tests.push(test);
        } else {
            this.tests.push(test);
        }

        return test;
    }

    // Skip tests
    xit(description, testFn) {
        const test = this.it(description, testFn);
        test.status = 'skipped';
        return test;
    }

    // Focus on specific tests
    fit(description, testFn) {
        const test = this.it(description, testFn);
        test.focused = true;
        return test;
    }

    // Test Hooks
    beforeAll(hookFn) {
        if (this.currentSuite) {
            this.currentSuite.hooks.beforeAll.push(hookFn);
        } else {
            this.hooks.beforeAll.push(hookFn);
        }
    }

    afterAll(hookFn) {
        if (this.currentSuite) {
            this.currentSuite.hooks.afterAll.push(hookFn);
        } else {
            this.hooks.afterAll.push(hookFn);
        }
    }

    beforeEach(hookFn) {
        if (this.currentSuite) {
            this.currentSuite.hooks.beforeEach.push(hookFn);
        } else {
            this.hooks.beforeEach.push(hookFn);
        }
    }

    afterEach(hookFn) {
        if (this.currentSuite) {
            this.currentSuite.hooks.afterEach.push(hookFn);
        } else {
            this.hooks.afterEach.push(hookFn);
        }
    }

    // Test Execution
    async runTests() {
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            details: []
        };

        console.log('🧪 Starting ENARM Test Suite...\n');

        try {
            // Run global beforeAll hooks
            await this.runHooks(this.hooks.beforeAll);

            // Run tests in suites
            for (const [description, suite] of this.suites) {
                await this.runSuite(suite);
            }

            // Run standalone tests
            for (const test of this.tests) {
                await this.runTest(test);
            }

            // Run global afterAll hooks
            await this.runHooks(this.hooks.afterAll);

        } catch (error) {
            console.error('❌ Test framework error:', error);
        }

        this.results.endTime = Date.now();
        this.results.duration = this.results.endTime - this.results.startTime;

        this.printResults();
        return this.results;
    }

    async runSuite(suite) {
        console.log(`📁 ${suite.description}`);

        try {
            // Run suite beforeAll hooks
            await this.runHooks(suite.hooks.beforeAll);

            for (const test of suite.tests) {
                if (test.status === 'skipped') {
                    this.results.skipped++;
                    this.results.total++;
                    console.log(`  ⏭️  ${test.description} (skipped)`);
                    continue;
                }

                await this.runTest(test, suite);
            }

            // Run suite afterAll hooks
            await this.runHooks(suite.hooks.afterAll);

        } catch (error) {
            console.error(`❌ Suite error in "${suite.description}":`, error);
        }

        console.log(''); // Empty line after suite
    }

    async runTest(test, suite = null) {
        const startTime = Date.now();
        this.results.total++;

        try {
            // Run beforeEach hooks
            await this.runHooks(this.hooks.beforeEach);
            if (suite) {
                await this.runHooks(suite.hooks.beforeEach);
            }

            // Run the test
            if (test.async) {
                await test.fn();
            } else {
                test.fn();
            }

            // Test passed
            test.status = 'passed';
            test.duration = Date.now() - startTime;
            this.results.passed++;
            
            const prefix = suite ? '  ' : '';
            console.log(`${prefix}✅ ${test.description} (${test.duration}ms)`);

        } catch (error) {
            // Test failed
            test.status = 'failed';
            test.error = error;
            test.duration = Date.now() - startTime;
            this.results.failed++;
            
            const prefix = suite ? '  ' : '';
            console.log(`${prefix}❌ ${test.description}`);
            console.log(`${prefix}   ${error.message}`);
            if (error.stack) {
                console.log(`${prefix}   ${error.stack.split('\n')[1]}`);
            }

        } finally {
            // Run afterEach hooks
            try {
                if (suite) {
                    await this.runHooks(suite.hooks.afterEach);
                }
                await this.runHooks(this.hooks.afterEach);
            } catch (hookError) {
                console.error('❌ AfterEach hook error:', hookError);
            }

            this.results.details.push({
                description: test.description,
                status: test.status,
                duration: test.duration,
                error: test.error,
                suite: suite ? suite.description : null
            });
        }
    }

    async runHooks(hooks) {
        for (const hook of hooks) {
            try {
                if (this.isAsyncFunction(hook) || hook.length > 0) {
                    await hook();
                } else {
                    hook();
                }
            } catch (error) {
                console.error('❌ Hook error:', error);
                throw error;
            }
        }
    }

    // Assertions
    expect(actual) {
        return new Assertion(actual);
    }

    // Mock System
    mock(obj, method, implementation) {
        const originalMethod = obj[method];
        const mockId = `${obj.constructor.name}.${method}`;
        
        this.mocks.set(mockId, {
            object: obj,
            method,
            original: originalMethod,
            calls: []
        });

        obj[method] = (...args) => {
            this.mocks.get(mockId).calls.push({
                args,
                timestamp: Date.now()
            });
            
            if (implementation) {
                return implementation(...args);
            }
        };

        return this.mocks.get(mockId);
    }

    spy(obj, method) {
        const originalMethod = obj[method];
        const spyId = `${obj.constructor.name}.${method}`;
        
        this.spies.set(spyId, {
            object: obj,
            method,
            original: originalMethod,
            calls: []
        });

        obj[method] = (...args) => {
            const spy = this.spies.get(spyId);
            spy.calls.push({
                args,
                timestamp: Date.now()
            });
            
            return originalMethod.apply(obj, args);
        };

        return this.spies.get(spyId);
    }

    restoreMocks() {
        for (const [id, mock] of this.mocks) {
            mock.object[mock.method] = mock.original;
        }
        this.mocks.clear();
    }

    restoreSpies() {
        for (const [id, spy] of this.spies) {
            spy.object[spy.method] = spy.original;
        }
        this.spies.clear();
    }

    // Test Data Helpers
    createMockQuestion(overrides = {}) {
        return {
            id: `test_question_${Date.now()}`,
            category: 'Medicina Interna',
            difficulty: 'intermedio',
            question: 'Test question text',
            options: {
                A: 'Option A',
                B: 'Option B',
                C: 'Option C',
                D: 'Option D',
                E: 'Option E'
            },
            correct: 'B',
            explanation: 'Test explanation',
            reference: 'Test reference',
            ...overrides
        };
    }

    createMockSession(overrides = {}) {
        return {
            id: `test_session_${Date.now()}`,
            startTime: new Date().toISOString(),
            endTime: null,
            questions: [],
            results: [],
            config: {
                mode: 'study',
                questionsCount: 10,
                specialty: '',
                difficulty: ''
            },
            ...overrides
        };
    }

    createMockProgress(overrides = {}) {
        return {
            user: {
                startDate: new Date().toISOString(),
                studyStreak: 0,
                preferences: {
                    dailyGoal: 20
                }
            },
            statistics: {
                totalQuestions: 0,
                correctAnswers: 0,
                totalTime: 0
            },
            categories: {},
            sessions: [],
            answers: [],
            ...overrides
        };
    }

    // Utility Methods
    isAsyncFunction(fn) {
        return fn.constructor.name === 'AsyncFunction';
    }

    printResults() {
        console.log('\n📊 Test Results:');
        console.log(`   Total: ${this.results.total}`);
        console.log(`   ✅ Passed: ${this.results.passed}`);
        console.log(`   ❌ Failed: ${this.results.failed}`);
        console.log(`   ⏭️  Skipped: ${this.results.skipped}`);
        console.log(`   ⏱️  Duration: ${this.results.duration}ms`);
        
        const successRate = this.results.total > 0 ? 
            Math.round((this.results.passed / this.results.total) * 100) : 0;
        
        if (successRate === 100) {
            console.log(`\n🎉 All tests passed! (${successRate}%)`);
        } else if (successRate >= 80) {
            console.log(`\n⚠️  Most tests passed (${successRate}%)`);
        } else {
            console.log(`\n🚨 Many tests failed (${successRate}%)`);
        }

        if (this.results.failed > 0) {
            console.log('\n❌ Failed tests:');
            this.results.details
                .filter(test => test.status === 'failed')
                .forEach(test => {
                    console.log(`   • ${test.description}`);
                    console.log(`     ${test.error.message}`);
                });
        }
    }

    // Export results
    exportResults() {
        return {
            ...this.results,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }

    // Reset framework
    reset() {
        this.tests = [];
        this.suites.clear();
        this.currentSuite = null;
        this.restoreMocks();
        this.restoreSpies();
        this.hooks = {
            beforeAll: [],
            afterAll: [],
            beforeEach: [],
            afterEach: []
        };
    }
}

// Assertion Class
class Assertion {
    constructor(actual) {
        this.actual = actual;
        this.isNegated = false;
    }

    get not() {
        this.isNegated = !this.isNegated;
        return this;
    }

    toBe(expected) {
        const passed = this.actual === expected;
        if (this.isNegated ? passed : !passed) {
            throw new Error(`Expected ${this.actual} ${this.isNegated ? 'not ' : ''}to be ${expected}`);
        }
    }

    toEqual(expected) {
        const passed = JSON.stringify(this.actual) === JSON.stringify(expected);
        if (this.isNegated ? passed : !passed) {
            throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNegated ? 'not ' : ''}to equal ${JSON.stringify(expected)}`);
        }
    }

    toBeTruthy() {
        const passed = !!this.actual;
        if (this.isNegated ? passed : !passed) {
            throw new Error(`Expected ${this.actual} ${this.isNegated ? 'not ' : ''}to be truthy`);
        }
    }

    toBeFalsy() {
        const passed = !this.actual;
        if (this.isNegated ? passed : !passed) {
            throw new Error(`Expected ${this.actual} ${this.isNegated ? 'not ' : ''}to be falsy`);
        }
    }

    toBeNull() {
        const passed = this.actual === null;
        if (this.isNegated ? passed : !passed) {
            throw new Error(`Expected ${this.actual} ${this.isNegated ? 'not ' : ''}to be null`);
        }
    }

    toBeUndefined() {
        const passed = this.actual === undefined;
        if (this.isNegated ? passed : !passed) {
            throw new Error(`Expected ${this.actual} ${this.isNegated ? 'not ' : ''}to be undefined`);
        }
    }

    toContain(expected) {
        const passed = Array.isArray(this.actual) ? 
            this.actual.includes(expected) :
            this.actual.toString().includes(expected);
        if (this.isNegated ? passed : !passed) {
            throw new Error(`Expected ${this.actual} ${this.isNegated ? 'not ' : ''}to contain ${expected}`);
        }
    }

    toHaveLength(expected) {
        const passed = this.actual.length === expected;
        if (this.isNegated ? passed : !passed) {
            throw new Error(`Expected ${this.actual} ${this.isNegated ? 'not ' : ''}to have length ${expected}, but got ${this.actual.length}`);
        }
    }

    toThrow(expected) {
        let threw = false;
        let error = null;

        try {
            if (typeof this.actual === 'function') {
                this.actual();
            }
        } catch (e) {
            threw = true;
            error = e;
        }

        if (this.isNegated) {
            if (threw) {
                throw new Error(`Expected function not to throw, but it threw: ${error.message}`);
            }
        } else {
            if (!threw) {
                throw new Error('Expected function to throw, but it did not');
            }
            
            if (expected && !error.message.includes(expected)) {
                throw new Error(`Expected function to throw "${expected}", but it threw: ${error.message}`);
            }
        }
    }

    toBeInstanceOf(expectedClass) {
        const passed = this.actual instanceof expectedClass;
        if (this.isNegated ? passed : !passed) {
            throw new Error(`Expected ${this.actual} ${this.isNegated ? 'not ' : ''}to be instance of ${expectedClass.name}`);
        }
    }

    toHaveProperty(property, value = undefined) {
        const hasProperty = this.actual.hasOwnProperty(property);
        if (this.isNegated ? hasProperty : !hasProperty) {
            throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNegated ? 'not ' : ''}to have property ${property}`);
        }

        if (value !== undefined) {
            const propertyValue = this.actual[property];
            const valuesMatch = propertyValue === value;
            if (this.isNegated ? valuesMatch : !valuesMatch) {
                throw new Error(`Expected property ${property} ${this.isNegated ? 'not ' : ''}to be ${value}, but got ${propertyValue}`);
            }
        }
    }

    toBeCloseTo(expected, precision = 2) {
        const passed = Math.abs(this.actual - expected) < Math.pow(10, -precision) / 2;
        if (this.isNegated ? passed : !passed) {
            throw new Error(`Expected ${this.actual} ${this.isNegated ? 'not ' : ''}to be close to ${expected}`);
        }
    }
}

// Create global test framework instance
const testFramework = new TestFramework();

// Export global functions
window.describe = testFramework.describe.bind(testFramework);
window.it = testFramework.it.bind(testFramework);
window.xit = testFramework.xit.bind(testFramework);
window.fit = testFramework.fit.bind(testFramework);
window.beforeAll = testFramework.beforeAll.bind(testFramework);
window.afterAll = testFramework.afterAll.bind(testFramework);
window.beforeEach = testFramework.beforeEach.bind(testFramework);
window.afterEach = testFramework.afterEach.bind(testFramework);
window.expect = testFramework.expect.bind(testFramework);

// Export test framework
window.TestFramework = testFramework;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testFramework;
}