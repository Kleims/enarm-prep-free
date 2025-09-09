// ENARM Prep - Performance Monitoring Dashboard
class MonitoringDashboard {
    constructor() {
        this.metrics = {};
        this.alerts = [];
        this.isVisible = false;
        this.updateInterval = null;
        this.thresholds = {
            domBatchDuration: 16, // 16ms for 60fps
            longTaskDuration: 50, // Long task threshold
            memoryUsage: 50 * 1024 * 1024, // 50MB
            errorRate: 0.05, // 5% error rate
            loadTime: 3000 // 3 seconds
        };
        
        this.init();
    }

    init() {
        this.collectInitialMetrics();
        this.setupPerformanceObserver();
        this.createDashboardUI();
        this.startMonitoring();
        
        // Show dashboard in development
        if (this.isDevelopment()) {
            this.setupDevelopmentMode();
        }
    }

    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    collectInitialMetrics() {
        // Collect baseline metrics
        this.metrics = {
            performance: {
                navigation: this.getNavigationMetrics(),
                memory: this.getMemoryMetrics(),
                timing: this.getTimingMetrics()
            },
            application: {
                loadTime: Date.now(),
                questionsLoaded: 0,
                sessionsCompleted: 0,
                errorsCount: 0
            },
            security: {
                xssAttempts: 0,
                validationFailures: 0,
                sanitizationCalls: 0
            },
            optimization: {
                lazyLoadHits: 0,
                debounceSaves: 0,
                batchOperations: 0
            }
        };
    }

    getNavigationMetrics() {
        if (!performance.timing) return {};
        
        const timing = performance.timing;
        const navigation = performance.navigation;
        
        return {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
            loadComplete: timing.loadEventEnd - timing.loadEventStart,
            domInteractive: timing.domInteractive - timing.domLoading,
            connectTime: timing.connectEnd - timing.connectStart,
            requestTime: timing.responseEnd - timing.requestStart,
            navigationType: navigation.type,
            redirectCount: navigation.redirectCount
        };
    }

    getMemoryMetrics() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            };
        }
        return {};
    }

    getTimingMetrics() {
        if (performance.getEntriesByType) {
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            
            return {
                firstPaint: firstPaint ? firstPaint.startTime : 0,
                firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0
            };
        }
        return {};
    }

    setupPerformanceObserver() {
        if (!('PerformanceObserver' in window)) return;

        // Observe long tasks
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric('longTask', {
                        duration: entry.duration,
                        startTime: entry.startTime,
                        name: entry.name
                    });
                    
                    if (entry.duration > this.thresholds.longTaskDuration) {
                        this.addAlert('warning', `Long task detected: ${entry.duration.toFixed(2)}ms`);
                    }
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            console.log('Long task monitoring not supported');
        }

        // Observe resource loading
        try {
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name.includes('.js') || entry.name.includes('.css')) {
                        this.recordMetric('resourceLoad', {
                            name: entry.name,
                            duration: entry.duration,
                            size: entry.transferSize,
                            cached: entry.transferSize === 0
                        });
                    }
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
        } catch (e) {
            console.log('Resource monitoring not supported');
        }
    }

    recordMetric(category, data) {
        if (!this.metrics.custom) {
            this.metrics.custom = {};
        }
        
        if (!this.metrics.custom[category]) {
            this.metrics.custom[category] = [];
        }
        
        this.metrics.custom[category].push({
            ...data,
            timestamp: Date.now()
        });
        
        // Keep only recent metrics
        if (this.metrics.custom[category].length > 100) {
            this.metrics.custom[category] = this.metrics.custom[category].slice(-100);
        }
        
        this.checkThresholds(category, data);
    }

    checkThresholds(category, data) {
        let alertMessage = null;
        
        switch (category) {
            case 'longTask':
                if (data.duration > this.thresholds.longTaskDuration) {
                    alertMessage = `Long task: ${data.duration.toFixed(2)}ms (threshold: ${this.thresholds.longTaskDuration}ms)`;
                }
                break;
                
            case 'domBatch':
                if (data.duration > this.thresholds.domBatchDuration) {
                    alertMessage = `Slow DOM batch: ${data.duration.toFixed(2)}ms (threshold: ${this.thresholds.domBatchDuration}ms)`;
                }
                break;
                
            case 'memory':
                if (data.used > this.thresholds.memoryUsage) {
                    alertMessage = `High memory usage: ${(data.used / 1024 / 1024).toFixed(2)}MB`;
                }
                break;
        }
        
        if (alertMessage) {
            this.addAlert('warning', alertMessage);
        }
    }

    addAlert(type, message) {
        const alert = {
            id: Date.now(),
            type, // 'info', 'warning', 'error'
            message,
            timestamp: Date.now()
        };
        
        this.alerts.unshift(alert);
        
        // Keep only recent alerts
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(0, 50);
        }
        
        // Log to console based on type
        switch (type) {
            case 'error':
                console.error(`🚨 ${message}`);
                break;
            case 'warning':
                console.warn(`⚠️ ${message}`);
                break;
            default:
                console.log(`ℹ️ ${message}`);
        }
        
        this.updateUI();
    }

    createDashboardUI() {
        if (!this.isDevelopment()) return;
        
        const style = document.createElement('style');
        style.id = 'monitoring-dashboard-styles';
        style.textContent = `
            .monitoring-dashboard {
                position: fixed;
                top: 10px;
                left: 10px;
                z-index: 10000;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                border-radius: 8px;
                padding: 15px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                width: 320px;
                max-height: 400px;
                overflow-y: auto;
                transition: transform 0.3s ease;
                transform: translateX(-100%);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            
            .monitoring-dashboard.visible {
                transform: translateX(0);
            }
            
            .monitoring-dashboard h3 {
                margin: 0 0 10px 0;
                color: #00ff00;
                border-bottom: 1px solid #333;
                padding-bottom: 5px;
            }
            
            .metric-group {
                margin: 10px 0;
                padding: 8px;
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
            }
            
            .metric-item {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
                padding: 2px 0;
            }
            
            .metric-label {
                color: #ccc;
            }
            
            .metric-value {
                color: #00ff00;
                font-weight: bold;
            }
            
            .metric-value.warning {
                color: #ff9900;
            }
            
            .metric-value.error {
                color: #ff0000;
            }
            
            .alert {
                padding: 5px 8px;
                margin: 3px 0;
                border-radius: 3px;
                font-size: 11px;
            }
            
            .alert.info {
                background: rgba(0, 123, 255, 0.2);
                border-left: 3px solid #007bff;
            }
            
            .alert.warning {
                background: rgba(255, 193, 7, 0.2);
                border-left: 3px solid #ffc107;
            }
            
            .alert.error {
                background: rgba(220, 53, 69, 0.2);
                border-left: 3px solid #dc3545;
            }
            
            .dashboard-toggle {
                position: fixed;
                top: 15px;
                left: 15px;
                z-index: 10001;
                background: #007cba;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 12px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
            
            .dashboard-toggle:hover {
                background: #005a87;
            }
            
            .performance-chart {
                height: 60px;
                margin: 8px 0;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                position: relative;
                overflow: hidden;
            }
            
            .chart-bar {
                position: absolute;
                bottom: 0;
                background: #00ff00;
                width: 2px;
                margin-right: 1px;
                transition: height 0.3s ease;
            }
            
            .chart-bar.warning {
                background: #ff9900;
            }
            
            .chart-bar.error {
                background: #ff0000;
            }
        `;
        document.head.appendChild(style);
        
        // Create toggle button
        const toggle = document.createElement('button');
        toggle.className = 'dashboard-toggle';
        toggle.textContent = '📊';
        toggle.title = 'Toggle Monitoring Dashboard';
        toggle.onclick = () => this.toggleDashboard();
        document.body.appendChild(toggle);
        
        // Create dashboard container
        const dashboard = document.createElement('div');
        dashboard.className = 'monitoring-dashboard';
        dashboard.id = 'monitoring-dashboard';
        document.body.appendChild(dashboard);
        
        this.dashboardElement = dashboard;
        this.updateUI();
    }

    toggleDashboard() {
        this.isVisible = !this.isVisible;
        if (this.dashboardElement) {
            this.dashboardElement.classList.toggle('visible', this.isVisible);
        }
        
        if (this.isVisible) {
            this.updateUI();
        }
    }

    updateUI() {
        if (!this.isDevelopment() || !this.dashboardElement) return;
        
        const currentMemory = this.getMemoryMetrics();
        const recentAlerts = this.alerts.slice(0, 5);
        
        this.dashboardElement.innerHTML = `
            <h3>📊 Performance Monitor</h3>
            
            <div class="metric-group">
                <strong>Memory Usage</strong>
                ${currentMemory.used ? `
                <div class="metric-item">
                    <span class="metric-label">Used:</span>
                    <span class="metric-value ${currentMemory.percentage > 80 ? 'error' : currentMemory.percentage > 60 ? 'warning' : ''}">
                        ${(currentMemory.used / 1024 / 1024).toFixed(1)}MB (${currentMemory.percentage.toFixed(1)}%)
                    </span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Limit:</span>
                    <span class="metric-value">${(currentMemory.limit / 1024 / 1024).toFixed(0)}MB</span>
                </div>
                ` : '<div class="metric-item">Memory API not available</div>'}
            </div>
            
            <div class="metric-group">
                <strong>Application Metrics</strong>
                <div class="metric-item">
                    <span class="metric-label">Questions Loaded:</span>
                    <span class="metric-value">${this.getQuestionCount()}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Sessions:</span>
                    <span class="metric-value">${this.getSessionCount()}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Uptime:</span>
                    <span class="metric-value">${this.getUptime()}</span>
                </div>
            </div>
            
            <div class="metric-group">
                <strong>Performance</strong>
                <div class="metric-item">
                    <span class="metric-label">Long Tasks:</span>
                    <span class="metric-value ${this.getLongTaskCount() > 5 ? 'warning' : ''}">${this.getLongTaskCount()}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Batch Ops:</span>
                    <span class="metric-value">${this.metrics.optimization.batchOperations}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Errors:</span>
                    <span class="metric-value ${this.getErrorCount() > 0 ? 'error' : ''}">${this.getErrorCount()}</span>
                </div>
            </div>
            
            ${recentAlerts.length > 0 ? `
            <div class="metric-group">
                <strong>Recent Alerts</strong>
                ${recentAlerts.map(alert => `
                    <div class="alert ${alert.type}">
                        ${alert.message}
                        <br><small>${new Date(alert.timestamp).toLocaleTimeString()}</small>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="metric-group">
                <strong>Performance Chart</strong>
                <div class="performance-chart" id="perf-chart">
                    ${this.generatePerformanceChart()}
                </div>
            </div>
        `;
    }

    generatePerformanceChart() {
        const longTasks = this.metrics.custom?.longTask || [];
        const recentTasks = longTasks.slice(-30); // Last 30 measurements
        
        return recentTasks.map((task, index) => {
            const height = Math.min((task.duration / 100) * 60, 60); // Scale to chart height
            const className = task.duration > 50 ? 'error' : task.duration > 20 ? 'warning' : '';
            
            return `<div class="chart-bar ${className}" style="left: ${index * 3}px; height: ${height}px;"></div>`;
        }).join('');
    }

    getQuestionCount() {
        if (window.QuestionManager) {
            const progress = window.QuestionManager.getLoadingProgress();
            return `${progress.loaded}/${progress.total}`;
        }
        return 'N/A';
    }

    getSessionCount() {
        if (window.StorageService) {
            const progress = window.StorageService.getItem('enarm-progress', {});
            return (progress.sessions || []).length;
        }
        return 0;
    }

    getUptime() {
        const uptime = Date.now() - this.metrics.application.loadTime;
        const minutes = Math.floor(uptime / 60000);
        const seconds = Math.floor((uptime % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    getLongTaskCount() {
        return this.metrics.custom?.longTask?.length || 0;
    }

    getErrorCount() {
        if (window.ErrorHandler) {
            return window.ErrorHandler.getErrors().length;
        }
        return this.metrics.application.errorsCount;
    }

    startMonitoring() {
        // Update metrics every 5 seconds
        this.updateInterval = setInterval(() => {
            this.collectRuntimeMetrics();
            
            if (this.isVisible) {
                this.updateUI();
            }
        }, 5000);
        
        // Set up integrations
        this.setupIntegrations();
    }

    collectRuntimeMetrics() {
        // Update memory metrics
        const memory = this.getMemoryMetrics();
        if (memory.used) {
            this.recordMetric('memory', memory);
        }
        
        // Check for performance issues
        this.performHealthCheck();
    }

    performHealthCheck() {
        const checks = [];
        
        // Memory check
        const memory = this.getMemoryMetrics();
        if (memory.percentage > 80) {
            checks.push({ type: 'error', message: 'High memory usage detected' });
        } else if (memory.percentage > 60) {
            checks.push({ type: 'warning', message: 'Moderate memory usage' });
        }
        
        // Error rate check
        const errorCount = this.getErrorCount();
        if (errorCount > 10) {
            checks.push({ type: 'error', message: `High error count: ${errorCount}` });
        }
        
        // Long task check
        const longTaskCount = this.getLongTaskCount();
        if (longTaskCount > 10) {
            checks.push({ type: 'warning', message: `Multiple long tasks detected: ${longTaskCount}` });
        }
        
        // Add alerts for issues
        checks.forEach(check => {
            // Only add if not recently alerted
            const recentAlert = this.alerts.find(alert => 
                alert.message === check.message && 
                Date.now() - alert.timestamp < 60000 // 1 minute
            );
            
            if (!recentAlert) {
                this.addAlert(check.type, check.message);
            }
        });
    }

    setupIntegrations() {
        // Integrate with PerformanceOptimizer
        if (window.PerformanceOptimizer) {
            const originalRecordMetric = window.PerformanceOptimizer.recordMetric;
            window.PerformanceOptimizer.recordMetric = (type, value, details) => {
                originalRecordMetric.call(window.PerformanceOptimizer, type, value, details);
                this.recordMetric(type, { value, details });
            };
        }
        
        // Integrate with DataValidator
        if (window.DataValidator) {
            const originalSanitize = window.DataValidator.sanitizeText;
            window.DataValidator.sanitizeText = (input) => {
                this.metrics.security.sanitizationCalls++;
                return originalSanitize.call(window.DataValidator, input);
            };
        }
        
        // Integrate with ErrorHandler
        if (window.ErrorHandler) {
            window.ErrorHandler.addErrorListener((errorInfo) => {
                this.metrics.application.errorsCount++;
                this.addAlert('error', `Error: ${errorInfo.message}`);
            });
        }
    }

    getReport() {
        return {
            timestamp: Date.now(),
            metrics: this.metrics,
            alerts: this.alerts.slice(0, 10),
            performance: {
                memory: this.getMemoryMetrics(),
                uptime: Date.now() - this.metrics.application.loadTime,
                longTasks: this.getLongTaskCount(),
                errors: this.getErrorCount()
            },
            recommendations: this.getRecommendations()
        };
    }

    getRecommendations() {
        const recommendations = [];
        const memory = this.getMemoryMetrics();
        
        if (memory.percentage > 80) {
            recommendations.push('Consider clearing old session data to free memory');
        }
        
        if (this.getLongTaskCount() > 5) {
            recommendations.push('Long tasks detected - consider breaking up complex operations');
        }
        
        if (this.getErrorCount() > 5) {
            recommendations.push('Multiple errors detected - check error logs');
        }
        
        return recommendations;
    }

    setupDevelopmentMode() {
        // Add keyboard shortcut to toggle dashboard
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                this.toggleDashboard();
            }
        });
        
        // Add console commands
        window.monitor = {
            show: () => this.toggleDashboard(),
            report: () => console.log(this.getReport()),
            clear: () => {
                this.alerts = [];
                this.updateUI();
            }
        };
        
        console.log('🔧 Development mode: Press Ctrl+Shift+M to toggle monitor, or use window.monitor commands');
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.dashboardElement) {
            this.dashboardElement.remove();
        }
        
        const style = document.getElementById('monitoring-dashboard-styles');
        if (style) {
            style.remove();
        }
        
        const toggle = document.querySelector('.dashboard-toggle');
        if (toggle) {
            toggle.remove();
        }
    }
}

// Create singleton instance
const monitoringDashboard = new MonitoringDashboard();

// Export as global
window.MonitoringDashboard = monitoringDashboard;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = monitoringDashboard;
}