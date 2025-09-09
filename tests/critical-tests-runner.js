// Critical Priority Tests - Master Test Runner
class CriticalTestsRunner {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    async runAllCriticalTests() {
        console.log('🚨 Running CRITICAL PRIORITY Tests for ENARM Application');
        console.log('=' .repeat(60));
        
        const startTime = performance.now();
        
        try {
            // Test 1: Question Management System
            await this.runTestSuite('Question Management System', QuestionManagerTests);
            
            // Test 2: Progress Tracking & Data Persistence
            await this.runTestSuite('Progress Tracking & Data Persistence', ProgressManagerTests);
            
            // Test 3: Core User Flows
            await this.runTestSuite('Core User Flows', CoreUserFlowsTests);
            
        } catch (error) {
            console.error('❌ Critical test runner error:', error);
        }
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        this.printFinalResults(duration);
        return this.generateTestReport();
    }

    async runTestSuite(suiteName, TestClass) {
        console.log(`\n📋 Testing: ${suiteName}`);
        console.log('-'.repeat(40));
        
        try {
            const testInstance = new TestClass();
            const results = await testInstance.runAllTests();
            
            results.forEach(result => {
                this.totalTests++;
                if (result.status === 'passed') {
                    this.passedTests++;
                    console.log(`✅ ${result.name}`);
                } else {
                    this.failedTests++;
                    console.log(`❌ ${result.name}`);
                    console.log(`   ${result.message}`);
                }
                
                this.testResults.push({
                    suite: suiteName,
                    ...result
                });
            });
            
        } catch (error) {
            console.error(`❌ Test suite "${suiteName}" failed to run:`, error);
            this.failedTests++;
            this.totalTests++;
        }
    }

    printFinalResults(duration) {
        console.log('\n' + '='.repeat(60));
        console.log('🏁 CRITICAL TESTS SUMMARY');
        console.log('='.repeat(60));
        
        const successRate = this.totalTests > 0 ? 
            Math.round((this.passedTests / this.totalTests) * 100) : 0;
        
        console.log(`📊 Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (successRate === 100) {
            console.log('\n🎉 ALL CRITICAL TESTS PASSED!');
            console.log('✨ The ENARM application core functionality is working correctly.');
        } else if (successRate >= 80) {
            console.log('\n⚠️  MOST CRITICAL TESTS PASSED');
            console.log('🔧 Some issues need attention before production deployment.');
        } else {
            console.log('\n🚨 CRITICAL TESTS FAILED');
            console.log('❗ Significant issues found. DO NOT DEPLOY until fixed.');
        }
        
        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS REQUIRING IMMEDIATE ATTENTION:');
            this.testResults
                .filter(test => test.status === 'failed')
                .forEach(test => {
                    console.log(`   • ${test.suite}: ${test.name}`);
                    console.log(`     ${test.message}`);
                });
        }
        
        console.log('\n' + '='.repeat(60));
    }

    generateTestReport() {
        return {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.totalTests,
                passed: this.passedTests,
                failed: this.failedTests,
                successRate: this.totalTests > 0 ? Math.round((this.passedTests / this.totalTests) * 100) : 0
            },
            results: this.testResults,
            recommendations: this.generateRecommendations(),
            nextSteps: this.generateNextSteps()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.failedTests === 0) {
            recommendations.push('✅ All critical tests pass - ready for high priority testing phase');
            recommendations.push('📋 Proceed with PWA and UI/UX testing');
            recommendations.push('🔄 Set up automated test runs');
        } else {
            recommendations.push('🔧 Fix all failing critical tests before proceeding');
            recommendations.push('📝 Review question format validation (A-D options only)');
            recommendations.push('💾 Verify data persistence mechanisms');
            recommendations.push('🔄 Test core user flows end-to-end');
        }
        
        return recommendations;
    }

    generateNextSteps() {
        const nextSteps = [];
        
        if (this.failedTests === 0) {
            nextSteps.push('Implement High Priority Tests (PWA, UI/UX)');
            nextSteps.push('Set up continuous integration');
            nextSteps.push('Prepare for user acceptance testing');
        } else {
            nextSteps.push('Address all critical test failures');
            nextSteps.push('Re-run critical tests to verify fixes');
            nextSteps.push('Document any breaking changes');
        }
        
        return nextSteps;
    }
}

// Auto-run when loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for all dependencies to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const runner = new CriticalTestsRunner();
    const report = await runner.runAllCriticalTests();
    
    // Store report for external access
    window.criticalTestReport = report;
});

// Export for manual execution
window.CriticalTestsRunner = CriticalTestsRunner;