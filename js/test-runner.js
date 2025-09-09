// ENARM Prep - Comprehensive Test Runner for Security & Performance
class TestRunner {
    constructor() {
        this.testResults = [];
        this.suites = [];
        this.isRunning = false;
        this.startTime = null;
        this.endTime = null;
        
        this.init();
    }

    init() {
        this.setupTestSuites();
        this.createTestInterface();
    }

    setupTestSuites() {
        this.suites = [
            {
                name: 'Security Tests',
                tests: this.getSecurityTests()
            },
            {
                name: 'Performance Tests', 
                tests: this.getPerformanceTests()
            },
            {
                name: 'Data Validation Tests',
                tests: this.getValidationTests()
            },
            {
                name: 'Integration Tests',
                tests: this.getIntegrationTests()
            }
        ];
    }

    getSecurityTests() {
        return [
            {
                name: 'XSS Prevention - Script Tags',
                test: () => {
                    if (!window.DataValidator) return { skip: true, reason: 'DataValidator not available' };
                    
                    const maliciousInput = '<script>alert("XSS")</script>';
                    const sanitized = window.DataValidator.sanitizeText(maliciousInput);
                    
                    return {
                        passed: !sanitized.includes('<script>'),
                        message: sanitized.includes('<script>') ? 'Script tags not sanitized' : 'Script tags properly sanitized',
                        actual: sanitized,
                        expected: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
                    };
                }
            },
            {
                name: 'XSS Prevention - Event Handlers',
                test: () => {
                    if (!window.DataValidator) return { skip: true };
                    
                    const maliciousInput = '<img src="x" onerror="alert(1)">';
                    const sanitized = window.DataValidator.sanitizeHTML(maliciousInput);
                    
                    return {
                        passed: !sanitized.includes('onerror'),
                        message: sanitized.includes('onerror') ? 'Event handlers not removed' : 'Event handlers properly removed',
                        actual: sanitized
                    };
                }
            },
            {
                name: 'Question Data Validation',
                test: () => {
                    if (!window.DataValidator) return { skip: true };
                    
                    const invalidQuestion = {
                        id: '',  // Invalid - empty
                        question: 'Test',  // Invalid - too short
                        options: { A: 'Option A' },  // Invalid - missing B, C, D
                        correct: 'F'  // Invalid - not in A-E range
                    };
                    
                    const result = window.DataValidator.validateQuestion(invalidQuestion);
                    
                    return {
                        passed: !result.valid && result.errors.length > 0,
                        message: result.valid ? 'Invalid question passed validation' : `Properly rejected with ${result.errors.length} errors`,
                        actual: result.errors
                    };
                }
            },
            {
                name: 'Safe DOM Operations',
                test: () => {
                    const testElement = document.createElement('div');
                    const safeText = 'Safe <text> content';
                    
                    if (window.safeSetText) {
                        window.safeSetText(testElement, safeText);
                        
                        return {
                            passed: testElement.textContent === safeText && testElement.innerHTML === 'Safe &lt;text&gt; content',
                            message: 'Safe text setting working correctly',
                            actual: testElement.innerHTML
                        };
                    }
                    
                    return { skip: true, reason: 'Safe DOM operations not available' };
                }
            },
            {
                name: 'Storage Data Sanitization',
                test: () => {
                    if (!window.DataValidator) return { skip: true };
                    
                    const unsafeData = {
                        userInput: '<script>evil()</script>',
                        nested: {
                            html: '<img onerror="bad()" src="x">'
                        }
                    };
                    
                    const sanitized = window.DataValidator.sanitizeForStorage(unsafeData);
                    
                    return {
                        passed: !JSON.stringify(sanitized).includes('<script>') && !JSON.stringify(sanitized).includes('onerror'),
                        message: 'Storage data properly sanitized',
                        actual: sanitized
                    };
                }
            }
        ];
    }

    getPerformanceTests() {
        return [
            {
                name: 'Question Lazy Loading',
                test: async () => {
                    if (!window.PerformanceOptimizer || !window.QuestionManager) {
                        return { skip: true, reason: 'Performance components not available' };
                    }
                    
                    // Mock questions data
                    const mockQuestions = Array.from({ length: 200 }, (_, i) => ({
                        id: `test_${i}`,
                        category: 'Test',
                        difficulty: 'basico',
                        question: `Test question ${i}`,
                        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
                        correct: 'A',
                        explanation: 'Test explanation'
                    }));
                    
                    const loader = window.PerformanceOptimizer.createQuestionLoader();
                    await loader.init(mockQuestions);
                    
                    const initial = loader.getLoadedQuestions().length;
                    
                    return {
                        passed: initial <= 50 && initial > 0,
                        message: `Lazy loading working: ${initial} questions loaded initially (expected ≤50)`,
                        actual: initial,
                        expected: '≤50'
                    };
                }
            },
            {
                name: 'Debouncing Functionality',
                test: () => {
                    if (!window.PerformanceOptimizer) return { skip: true };
                    
                    let callCount = 0;
                    const testFunction = () => { callCount++; };
                    
                    const debounced = window.PerformanceOptimizer.debounce(testFunction, 100, 'test-debounce');
                    
                    // Call multiple times rapidly
                    debounced();
                    debounced();
                    debounced();
                    
                    return {
                        passed: callCount === 0, // Should not have called yet
                        message: callCount === 0 ? 'Debouncing working correctly' : `Debouncing failed: ${callCount} calls executed`,
                        actual: callCount,
                        expected: 0
                    };
                }
            },
            {
                name: 'DOM Batch Operations',
                test: () => {
                    if (!window.PerformanceOptimizer) return { skip: true };
                    
                    let executionCount = 0;
                    const startTime = performance.now();
                    
                    // Queue multiple DOM operations
                    for (let i = 0; i < 10; i++) {
                        window.PerformanceOptimizer.batchDOM(() => {
                            executionCount++;
                        });
                    }
                    
                    // Check that operations are queued, not executed immediately
                    const immediateCount = executionCount;
                    
                    return {
                        passed: immediateCount === 0,
                        message: immediateCount === 0 ? 'DOM operations properly batched' : `Operations executed immediately: ${immediateCount}`,
                        actual: immediateCount,
                        expected: 0
                    };
                }
            },
            {
                name: 'Storage Quota Handling',
                test: () => {
                    if (!window.DataValidator) return { skip: true };
                    
                    // Test large data validation
                    const largeData = 'x'.repeat(6 * 1024 * 1024); // 6MB string
                    const validation = window.DataValidator.validateStorageData('test', largeData);
                    
                    return {
                        passed: !validation.valid,
                        message: validation.valid ? 'Large data incorrectly allowed' : 'Large data properly rejected',
                        actual: validation.valid,
                        expected: false
                    };
                }
            },
            {
                name: 'Memory Usage Monitoring',
                test: () => {
                    if (!window.PerformanceOptimizer) return { skip: true };
                    
                    // Record a test metric
                    window.PerformanceOptimizer.recordMetric('test', 100, 'test-details');
                    const metrics = window.PerformanceOptimizer.getMetrics('test');
                    
                    return {
                        passed: Array.isArray(metrics) && metrics.length > 0,
                        message: metrics.length > 0 ? 'Performance metrics recording' : 'Performance metrics not recording',
                        actual: metrics.length,
                        expected: '>0'
                    };
                }
            }
        ];
    }

    getValidationTests() {
        return [
            {
                name: 'Session Configuration Validation',
                test: () => {
                    if (!window.DataValidator) return { skip: true };
                    
                    const invalidConfig = {
                        mode: 'invalid_mode',
                        questionsCount: -5,
                        timeLimit: -100
                    };
                    
                    const result = window.DataValidator.validateSessionConfig(invalidConfig);
                    
                    return {
                        passed: !result.valid && result.errors.length >= 3,
                        message: `Configuration validation: ${result.errors.length} errors found`,
                        actual: result.errors,
                        expected: '>=3 errors'
                    };
                }
            },
            {
                name: 'User Input Validation',
                test: () => {
                    if (!window.DataValidator) return { skip: true };
                    
                    const tests = [
                        { input: 'invalid-email', type: 'email', shouldPass: false },
                        { input: 'test@example.com', type: 'email', shouldPass: true },
                        { input: 'F', type: 'answer', shouldPass: false },
                        { input: 'A', type: 'answer', shouldPass: true }
                    ];
                    
                    const results = tests.map(test => {
                        const result = window.DataValidator.validateUserInput(test.input, test.type);
                        return result.valid === test.shouldPass;
                    });
                    
                    const passed = results.every(r => r);
                    
                    return {
                        passed,
                        message: passed ? 'All input validation tests passed' : 'Some input validation tests failed',
                        actual: results,
                        expected: [true, true, true, true]
                    };
                }
            },
            {
                name: 'Question Bank Validation',
                test: () => {
                    if (!window.DataValidator) return { skip: true };
                    
                    const mixedQuestions = [
                        {
                            id: 'valid1',
                            category: 'Medicina Interna',
                            difficulty: 'basico',
                            question: 'Valid question with sufficient length?',
                            options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
                            correct: 'A',
                            explanation: 'Valid explanation'
                        },
                        {
                            id: 'invalid1',
                            // Missing required fields
                        }
                    ];
                    
                    const result = window.DataValidator.validateQuestionBank(mixedQuestions);
                    
                    return {
                        passed: result.stats.valid === 1 && result.stats.invalid === 1,
                        message: `Question bank validation: ${result.stats.valid} valid, ${result.stats.invalid} invalid`,
                        actual: result.stats,
                        expected: { valid: 1, invalid: 1 }
                    };
                }
            }
        ];
    }

    getIntegrationTests() {
        return [
            {
                name: 'Service Dependencies',
                test: () => {
                    const services = [
                        'DataValidator',
                        'PerformanceOptimizer', 
                        'StorageService',
                        'ErrorHandler',
                        'CommonUtils'
                    ];
                    
                    const available = services.map(service => ({
                        service,
                        available: !!window[service]
                    }));
                    
                    const allAvailable = available.every(s => s.available);
                    
                    return {
                        passed: allAvailable,
                        message: allAvailable ? 'All core services available' : 'Some services missing',
                        actual: available,
                        expected: 'all services available'
                    };
                }
            },
            {
                name: 'Safe DOM Wrappers',
                test: () => {
                    const wrappers = ['safeSetText', 'safeSetHTML', 'safeSetAttribute'];
                    const available = wrappers.map(wrapper => ({
                        wrapper,
                        available: typeof window[wrapper] === 'function'
                    }));
                    
                    const allAvailable = available.every(w => w.available);
                    
                    return {
                        passed: allAvailable,
                        message: allAvailable ? 'All safe DOM wrappers available' : 'Some wrappers missing',
                        actual: available
                    };
                }
            },
            {
                name: 'Error Handling Integration',
                test: () => {
                    if (!window.ErrorHandler) return { skip: true };
                    
                    const initialErrorCount = window.ErrorHandler.getErrors().length;
                    
                    // Trigger a test error
                    window.ErrorHandler.logError('Test error for integration test', 'test-context');
                    
                    const finalErrorCount = window.ErrorHandler.getErrors().length;
                    
                    return {
                        passed: finalErrorCount > initialErrorCount,
                        message: 'Error handling working correctly',
                        actual: finalErrorCount - initialErrorCount,
                        expected: 1
                    };
                }
            },
            {
                name: 'Storage Service Integration',
                test: () => {
                    if (!window.StorageService) return { skip: true };
                    
                    const testKey = 'integration-test';
                    const testData = { test: true, timestamp: Date.now() };
                    
                    // Test write
                    const writeResult = window.StorageService.setItem(testKey, testData);
                    
                    // Test read
                    const readResult = window.StorageService.getItem(testKey);
                    
                    // Cleanup
                    window.StorageService.removeItem(testKey);
                    
                    return {
                        passed: writeResult && readResult && readResult.test === true,
                        message: 'Storage service working correctly',
                        actual: readResult,
                        expected: testData
                    };
                }
            }
        ];
    }

    createTestInterface() {
        // Create simple test UI if not in production
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const style = document.createElement('style');
            style.textContent = `
                .test-runner {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    background: white;
                    border: 2px solid #ccc;
                    border-radius: 8px;
                    padding: 10px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    max-width: 300px;
                    font-family: monospace;
                    font-size: 12px;
                }
                .test-runner button {
                    background: #007cba;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 4px;
                }
                .test-runner button:hover {
                    background: #005a87;
                }
                .test-results {
                    max-height: 200px;
                    overflow-y: auto;
                    margin-top: 10px;
                    padding: 8px;
                    background: #f5f5f5;
                    border-radius: 4px;
                }
                .test-pass { color: green; }
                .test-fail { color: red; }
                .test-skip { color: orange; }
            `;
            document.head.appendChild(style);
        }
    }

    async runAllTests() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = performance.now();
        this.testResults = [];
        
        console.log('🧪 Starting comprehensive test suite...');
        
        for (const suite of this.suites) {
            console.group(`📋 ${suite.name}`);
            
            for (const testCase of suite.tests) {
                try {
                    const result = await this.runTest(testCase);
                    this.testResults.push({
                        suite: suite.name,
                        test: testCase.name,
                        ...result
                    });
                    
                    this.logTestResult(testCase.name, result);
                } catch (error) {
                    const errorResult = {
                        passed: false,
                        error: error.message,
                        message: `Test threw error: ${error.message}`
                    };
                    
                    this.testResults.push({
                        suite: suite.name,
                        test: testCase.name,
                        ...errorResult
                    });
                    
                    this.logTestResult(testCase.name, errorResult);
                }
            }
            
            console.groupEnd();
        }
        
        this.endTime = performance.now();
        this.isRunning = false;
        
        this.generateReport();
    }

    async runTest(testCase) {
        const startTime = performance.now();
        const result = await testCase.test();
        const endTime = performance.now();
        
        return {
            ...result,
            duration: endTime - startTime
        };
    }

    logTestResult(testName, result) {
        if (result.skip) {
            console.log(`⏭️  ${testName} - SKIPPED: ${result.reason}`);
        } else if (result.passed) {
            console.log(`✅ ${testName} - PASSED: ${result.message}`);
        } else {
            console.error(`❌ ${testName} - FAILED: ${result.message}`);
            if (result.actual !== undefined) {
                console.log('   Actual:', result.actual);
            }
            if (result.expected !== undefined) {
                console.log('   Expected:', result.expected);
            }
        }
    }

    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed && !r.skip).length;
        const failedTests = this.testResults.filter(r => !r.passed && !r.skip).length;
        const skippedTests = this.testResults.filter(r => r.skip).length;
        const totalDuration = this.endTime - this.startTime;
        
        console.log('\n📊 TEST SUMMARY');
        console.log('================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`⏭️  Skipped: ${skippedTests}`);
        console.log(`⏱️  Duration: ${totalDuration.toFixed(2)}ms`);
        console.log(`📈 Success Rate: ${((passedTests / (totalTests - skippedTests)) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(r => !r.passed && !r.skip)
                .forEach(r => {
                    console.log(`   • ${r.suite} > ${r.test}: ${r.message}`);
                });
        }
        
        // Store results for monitoring dashboard
        if (window.StorageService) {
            window.StorageService.setItem('test-results', {
                timestamp: Date.now(),
                summary: { totalTests, passedTests, failedTests, skippedTests, totalDuration },
                details: this.testResults
            });
        }
        
        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            totalDuration,
            successRate: (passedTests / (totalTests - skippedTests)) * 100
        };
    }

    // Quick security test for production
    runSecurityCheck() {
        const criticalTests = [
            'XSS Prevention - Script Tags',
            'XSS Prevention - Event Handlers', 
            'Safe DOM Operations'
        ];
        
        console.log('🔒 Running critical security checks...');
        
        return Promise.all(
            this.getSecurityTests()
                .filter(test => criticalTests.includes(test.name))
                .map(test => this.runTest(test))
        ).then(results => {
            const allPassed = results.every(r => r.passed || r.skip);
            
            if (allPassed) {
                console.log('✅ All critical security tests passed');
            } else {
                console.error('❌ Critical security tests failed');
                results.forEach((result, i) => {
                    if (!result.passed && !result.skip) {
                        console.error(`   Failed: ${criticalTests[i]}`);
                    }
                });
            }
            
            return allPassed;
        });
    }
}

// Create singleton instance
const testRunner = new TestRunner();

// Export as global
window.TestRunner = testRunner;

// Auto-run security check in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Run after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            testRunner.runSecurityCheck();
        }, 2000);
    });
}

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testRunner;
}