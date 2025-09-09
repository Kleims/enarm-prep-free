# ENARM Prep - Testing & Monitoring Guide

## Overview
This guide covers how to test and monitor the enhanced ENARM Prep application with the new security and performance features.

## Quick Start Testing

### 🚀 **Automatic Tests (Development)**
When running locally, the application automatically:
- Runs security checks after page load
- Shows monitoring dashboard (toggle with `📊` button)
- Enables keyboard shortcuts (`Ctrl+Shift+M` for monitor)

### 🔧 **Manual Testing Commands**
Open browser console and run:

```javascript
// Run all tests
TestRunner.runAllTests()

// Run only security tests  
TestRunner.runSecurityCheck()

// Show monitoring dashboard
MonitoringDashboard.toggleDashboard() // or window.monitor.show()

// Get performance report
MonitoringDashboard.getReport()

// Check feature compatibility
ProgressiveEnhancement.getStatus()
```

## Security Testing ✅

### XSS Prevention Tests
```javascript
// Test 1: Script tag sanitization
const malicious = '<script>alert("XSS")</script>';
const safe = DataValidator.sanitizeText(malicious);
console.assert(!safe.includes('<script>'), 'XSS test failed!');

// Test 2: Event handler removal  
const badHTML = '<img onerror="alert(1)" src="x">';
const clean = DataValidator.sanitizeHTML(badHTML);
console.assert(!clean.includes('onerror'), 'Event handler test failed!');

// Test 3: Safe DOM operations
const div = document.createElement('div');
safeSetText(div, '<script>bad</script>');
console.assert(div.textContent === '<script>bad</script>', 'Safe DOM test failed!');
```

### Input Validation Tests
```javascript
// Test question validation
const badQuestion = { id: '', question: 'x' }; // Invalid
const result = DataValidator.validateQuestion(badQuestion);
console.assert(!result.valid, 'Question validation test failed!');

// Test user input validation
const email = DataValidator.validateUserInput('bad-email', 'email');
console.assert(!email.valid, 'Email validation test failed!');
```

## Performance Testing ⚡

### Lazy Loading Tests
```javascript
// Check question loading progress
const progress = QuestionManager.getLoadingProgress();
console.log(`Questions loaded: ${progress.loaded}/${progress.total}`);

// Verify initial load is optimized (should be ≤50 questions)
console.assert(progress.loaded <= 50, 'Lazy loading not working!');
```

### Performance Metrics
```javascript
// Get current performance metrics
const metrics = PerformanceOptimizer.getMetrics();
console.log('Performance metrics:', metrics);

// Check memory usage
const memory = performance.memory;
if (memory) {
    const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
    console.log(`Memory usage: ${usedMB}MB`);
}
```

### DOM Performance Tests
```javascript
// Test debouncing
let callCount = 0;
const debouncedFn = PerformanceOptimizer.debounce(() => callCount++, 100, 'test');

debouncedFn();
debouncedFn();
debouncedFn(); // Should only execute once

setTimeout(() => {
    console.assert(callCount === 1, 'Debouncing test failed!');
}, 200);
```

## Browser Compatibility Testing 🌐

### Feature Detection
```javascript
// Check what features are available
const status = ProgressiveEnhancement.getStatus();
console.log('Enhancement level:', status.level);
console.log('Available capabilities:', status.capabilities);

// Check if fallbacks are working
if (!status.capabilities.localStorage) {
    console.log('Using localStorage fallback');
}

if (!status.capabilities.serviceWorker) {
    console.log('Service Worker not available - offline features disabled');
}
```

### Progressive Enhancement Levels
- **Advanced** (80%+ features): All optimizations active
- **Intermediate** (60-79% features): Some features with fallbacks  
- **Basic** (<60% features): Minimal features with extensive fallbacks

## Monitoring Dashboard 📊

### Development Mode Features
- **Real-time metrics**: Memory, performance, errors
- **Performance charts**: Visual representation of app performance
- **Alert system**: Warnings for performance issues
- **Keyboard shortcuts**: `Ctrl+Shift+M` to toggle

### Dashboard Metrics
1. **Memory Usage**: JavaScript heap size and percentage
2. **Application Stats**: Questions loaded, sessions completed, uptime
3. **Performance**: Long tasks count, batch operations, errors
4. **Recent Alerts**: Performance warnings and errors

### Dashboard Commands (Console)
```javascript
// Show/hide dashboard
window.monitor.show()

// Get detailed report
window.monitor.report()

// Clear alerts
window.monitor.clear()
```

## Service Worker Testing 🔄

### Cache Verification
```javascript
// Check what's cached
caches.keys().then(names => console.log('Cache names:', names));

// Check cache contents
caches.open('enarm-prep-static-v2.0.0').then(cache => {
    cache.keys().then(keys => console.log('Cached files:', keys.map(k => k.url)));
});
```

### Offline Testing
1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Reload page - should work offline
4. Check Network tab - requests should come from cache

### Question Cache Testing
```javascript
// Test question caching
fetch('./data/questions.json').then(response => {
    console.log('Questions from:', response.headers.get('sw-fallback') ? 'fallback' : 'cache/network');
});
```

## Error Testing 🐛

### Error Handling Tests
```javascript
// Trigger test error
ErrorHandler.logError('Test error message', 'manual-test');

// Check error storage
const errors = ErrorHandler.getErrors();
console.log(`Total errors logged: ${errors.length}`);

// Check error stats
const stats = ErrorHandler.getErrorStats();
console.log('Error stats:', stats);
```

### Error Recovery Tests
```javascript
// Test async error handling
ErrorHandler.tryAsync(async () => {
    throw new Error('Test async error');
}).catch(err => console.log('Async error caught:', err.message));

// Test sync error handling with fallback
const result = ErrorHandler.trySyncWithFallback(
    () => { throw new Error('Test sync error'); },
    'fallback value',
    'manual-test'
);
console.log('Fallback result:', result);
```

## Production Testing 🚀

### Performance Checklist
- [ ] Initial load time < 3 seconds
- [ ] Memory usage < 50MB after 10 minutes
- [ ] No XSS vulnerabilities
- [ ] All inputs sanitized
- [ ] Questions load in chunks (≤50 initial)
- [ ] Offline functionality works
- [ ] Progressive enhancement active

### Quick Production Test
```javascript
// Run critical tests only (safe for production)
TestRunner.runSecurityCheck().then(passed => {
    if (passed) {
        console.log('✅ Security tests passed');
    } else {
        console.error('❌ Security tests failed - check implementation');
    }
});
```

## Troubleshooting 🔧

### Common Issues

**1. Service Worker not updating**
```javascript
// Force service worker update
navigator.serviceWorker.ready.then(registration => {
    registration.update();
});
```

**2. Performance issues**
```javascript
// Check for memory leaks
setInterval(() => {
    if (performance.memory) {
        const mb = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        console.log(`Memory: ${mb}MB`);
    }
}, 10000);
```

**3. Features not loading**
```javascript
// Check if services are available
const services = ['DataValidator', 'PerformanceOptimizer', 'StorageService'];
services.forEach(service => {
    console.log(`${service}:`, window[service] ? '✅' : '❌');
});
```

### Debug Mode
Add `?dev=true` to URL to enable:
- Monitoring dashboard
- Test runner
- Verbose console logging
- Additional debugging tools

## Automated Testing

### CI/CD Integration
For automated testing in CI/CD pipelines:

```javascript
// Headless testing script
if (typeof window !== 'undefined' && window.TestRunner) {
    TestRunner.runAllTests().then(report => {
        if (report.failedTests === 0) {
            console.log('All tests passed ✅');
            process.exit(0);
        } else {
            console.error(`${report.failedTests} tests failed ❌`);
            process.exit(1);
        }
    });
}
```

## Performance Benchmarks

### Target Metrics
- **Initial Load**: < 3 seconds
- **Time to Interactive**: < 5 seconds  
- **Memory Usage**: < 50MB sustained
- **Long Tasks**: < 5 per minute
- **Error Rate**: < 1%

### Measuring Performance
```javascript
// Measure page load performance
window.addEventListener('load', () => {
    const perfData = performance.timing;
    const loadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log(`Page load time: ${loadTime}ms`);
});
```

This comprehensive testing approach ensures the application maintains high security and performance standards while providing excellent user experience across all browsers and devices.