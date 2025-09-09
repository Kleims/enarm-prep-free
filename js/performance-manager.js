// ENARM Prep - Performance Optimization Manager
class PerformanceManager {
    constructor() {
        this.cache = new Map();
        this.observers = new Map();
        this.deferredTasks = [];
        this.performanceMetrics = {
            loadTimes: {},
            renderTimes: {},
            cacheHitRatio: { hits: 0, misses: 0 },
            memoryUsage: [],
            errorCounts: {}
        };
        
        this.config = {
            cacheTimeout: 10 * 60 * 1000, // 10 minutes
            maxCacheSize: 100,
            performanceLogging: true,
            lazyLoadThreshold: 0.1, // 10% from viewport
            deferredTasksDelay: 100,
            memoryMonitorInterval: 60000 // 1 minute
        };

        this.init();
    }

    init() {
        this.setupPerformanceMonitoring();
        this.setupLazyLoading();
        this.setupDeferredExecution();
        this.setupMemoryMonitoring();
        this.optimizeEventListeners();
    }

    // Caching System
    setCache(key, data, options = {}) {
        try {
            const timeout = options.timeout || this.config.cacheTimeout;
            const tags = options.tags || [];
            
            const cacheEntry = {
                data: this.deepClone(data),
                timestamp: Date.now(),
                expires: Date.now() + timeout,
                tags,
                hits: 0,
                size: this.estimateSize(data)
            };

            // Remove oldest entries if cache is full
            if (this.cache.size >= this.config.maxCacheSize) {
                this.evictOldestEntries(10);
            }

            this.cache.set(key, cacheEntry);
            this.logMetric('cache', 'set', key);
            
            return true;
        } catch (error) {
            ErrorHandler.logError(error, 'PerformanceManager.setCache');
            return false;
        }
    }

    getCache(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.performanceMetrics.cacheHitRatio.misses++;
            return null;
        }

        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            this.performanceMetrics.cacheHitRatio.misses++;
            return null;
        }

        entry.hits++;
        this.performanceMetrics.cacheHitRatio.hits++;
        return this.deepClone(entry.data);
    }

    invalidateCache(pattern) {
        if (typeof pattern === 'string') {
            // Simple string match
            for (const [key] of this.cache) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else if (pattern instanceof RegExp) {
            // Regex match
            for (const [key] of this.cache) {
                if (pattern.test(key)) {
                    this.cache.delete(key);
                }
            }
        }
    }

    invalidateCacheByTags(tags) {
        for (const [key, entry] of this.cache) {
            if (entry.tags.some(tag => tags.includes(tag))) {
                this.cache.delete(key);
            }
        }
    }

    clearCache() {
        this.cache.clear();
        this.logMetric('cache', 'clear');
    }

    evictOldestEntries(count = 10) {
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(0, count);

        entries.forEach(([key]) => {
            this.cache.delete(key);
        });
    }

    // Lazy Loading System
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: `${this.config.lazyLoadThreshold * 100}%`,
                    threshold: 0
                }
            );
        }
    }

    observeLazyElement(element, callback) {
        if (!this.intersectionObserver) {
            // Fallback for browsers without IntersectionObserver
            callback();
            return;
        }

        this.observers.set(element, callback);
        this.intersectionObserver.observe(element);
    }

    unobserveLazyElement(element) {
        if (this.intersectionObserver) {
            this.intersectionObserver.unobserve(element);
        }
        this.observers.delete(element);
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const callback = this.observers.get(entry.target);
                if (callback) {
                    callback();
                    this.unobserveLazyElement(entry.target);
                }
            }
        });
    }

    // Deferred Task Execution
    setupDeferredExecution() {
        // Use requestIdleCallback if available, otherwise setTimeout
        this.scheduleTask = window.requestIdleCallback ? 
            (callback, options) => window.requestIdleCallback(callback, options) :
            (callback) => setTimeout(callback, this.config.deferredTasksDelay);
    }

    deferTask(task, priority = 'normal') {
        const taskId = CommonUtils.generateId('task_');
        const taskWrapper = {
            id: taskId,
            fn: task,
            priority,
            created: Date.now()
        };

        this.deferredTasks.push(taskWrapper);
        
        // Sort by priority
        this.deferredTasks.sort((a, b) => {
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        this.scheduleTask(() => {
            this.processDeferredTasks();
        });

        return taskId;
    }

    processDeferredTasks() {
        const startTime = Date.now();
        const maxTime = 5; // 5ms max processing time per batch

        while (this.deferredTasks.length > 0 && (Date.now() - startTime) < maxTime) {
            const task = this.deferredTasks.shift();
            try {
                task.fn();
                this.logMetric('deferred', 'executed', task.id);
            } catch (error) {
                ErrorHandler.logError(error, `PerformanceManager.deferredTask.${task.id}`);
            }
        }

        // If there are more tasks, schedule another batch
        if (this.deferredTasks.length > 0) {
            this.scheduleTask(() => {
                this.processDeferredTasks();
            });
        }
    }

    cancelDeferredTask(taskId) {
        const index = this.deferredTasks.findIndex(task => task.id === taskId);
        if (index > -1) {
            this.deferredTasks.splice(index, 1);
            return true;
        }
        return false;
    }

    // Performance Monitoring
    setupPerformanceMonitoring() {
        // Monitor resource loading times
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        this.recordPerformanceEntry(entry);
                    });
                });

                observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
                this.performanceObserver = observer;
            } catch (error) {
                console.warn('PerformanceObserver not fully supported');
            }
        }

        // Monitor rendering performance
        this.setupRenderingMetrics();
    }

    setupRenderingMetrics() {
        let frameCount = 0;
        let lastTime = performance.now();

        const measureFrameRate = () => {
            const currentTime = performance.now();
            frameCount++;

            if (currentTime - lastTime >= 1000) {
                this.performanceMetrics.frameRate = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(measureFrameRate);
        };

        requestAnimationFrame(measureFrameRate);
    }

    recordPerformanceEntry(entry) {
        const entryData = {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType
        };

        if (!this.performanceMetrics.loadTimes[entry.entryType]) {
            this.performanceMetrics.loadTimes[entry.entryType] = [];
        }

        this.performanceMetrics.loadTimes[entry.entryType].push(entryData);

        // Keep only recent entries
        if (this.performanceMetrics.loadTimes[entry.entryType].length > 100) {
            this.performanceMetrics.loadTimes[entry.entryType] = 
                this.performanceMetrics.loadTimes[entry.entryType].slice(-50);
        }
    }

    measureOperation(name, operation) {
        const startTime = performance.now();
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;
        const measureName = `${name}-duration`;

        performance.mark(startMark);

        const result = operation();

        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);

        const endTime = performance.now();
        const duration = endTime - startTime;

        this.logMetric('operation', name, { duration, result });

        return result;
    }

    // Memory Monitoring
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };

                this.performanceMetrics.memoryUsage.push(memInfo);

                // Keep only last 100 measurements
                if (this.performanceMetrics.memoryUsage.length > 100) {
                    this.performanceMetrics.memoryUsage = this.performanceMetrics.memoryUsage.slice(-50);
                }

                // Check for memory pressure
                const usageRatio = memInfo.used / memInfo.total;
                if (usageRatio > 0.9) {
                    this.handleMemoryPressure();
                }

            }, this.config.memoryMonitorInterval);
        }
    }

    handleMemoryPressure() {
        console.warn('Memory pressure detected, performing cleanup...');
        
        // Clear old cache entries
        this.evictOldestEntries(20);
        
        // Clear performance metrics
        Object.keys(this.performanceMetrics.loadTimes).forEach(key => {
            this.performanceMetrics.loadTimes[key] = 
                this.performanceMetrics.loadTimes[key].slice(-10);
        });

        // Trigger garbage collection if available
        if (window.gc) {
            window.gc();
        }

        this.logMetric('memory', 'pressure_handled');
    }

    // Event Listener Optimization
    optimizeEventListeners() {
        this.debounceMap = new Map();
        this.throttleMap = new Map();
    }

    addDebouncedListener(element, event, handler, delay = 300) {
        const key = `${element.constructor.name}-${event}`;
        
        if (this.debounceMap.has(key)) {
            element.removeEventListener(event, this.debounceMap.get(key));
        }

        const debouncedHandler = CommonUtils.debounce(handler, delay);
        this.debounceMap.set(key, debouncedHandler);
        element.addEventListener(event, debouncedHandler);

        return debouncedHandler;
    }

    addThrottledListener(element, event, handler, delay = 100) {
        const key = `${element.constructor.name}-${event}`;
        
        if (this.throttleMap.has(key)) {
            element.removeEventListener(event, this.throttleMap.get(key));
        }

        const throttledHandler = CommonUtils.throttle(handler, delay);
        this.throttleMap.set(key, throttledHandler);
        element.addEventListener(event, throttledHandler);

        return throttledHandler;
    }

    // Data Processing Optimizations
    chunkProcess(data, processor, chunkSize = 100, onProgress = null) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            for (let i = 0; i < data.length; i += chunkSize) {
                chunks.push(data.slice(i, i + chunkSize));
            }

            let processedData = [];
            let currentChunk = 0;

            const processNextChunk = () => {
                if (currentChunk >= chunks.length) {
                    resolve(processedData);
                    return;
                }

                try {
                    const chunk = chunks[currentChunk];
                    const processed = processor(chunk, currentChunk);
                    processedData = processedData.concat(processed);

                    currentChunk++;

                    if (onProgress) {
                        onProgress((currentChunk / chunks.length) * 100);
                    }

                    // Process next chunk on next frame
                    this.scheduleTask(processNextChunk);

                } catch (error) {
                    reject(error);
                }
            };

            processNextChunk();
        });
    }

    memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
        const cache = new Map();

        return (...args) => {
            const key = keyGenerator(...args);
            
            if (cache.has(key)) {
                return cache.get(key);
            }

            const result = fn(...args);
            cache.set(key, result);

            // Limit cache size
            if (cache.size > 1000) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }

            return result;
        };
    }

    // DOM Optimization
    batchDOMUpdates(updates) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const fragment = document.createDocumentFragment();
                
                updates.forEach(update => {
                    try {
                        if (typeof update === 'function') {
                            update(fragment);
                        }
                    } catch (error) {
                        ErrorHandler.logError(error, 'PerformanceManager.batchDOMUpdates');
                    }
                });

                resolve(fragment);
            });
        });
    }

    virtualizeList(container, items, renderItem, itemHeight = 50, bufferSize = 5) {
        const virtualList = {
            container,
            items,
            renderItem,
            itemHeight,
            bufferSize,
            visibleStart: 0,
            visibleEnd: 0,
            scrollTop: 0
        };

        // Create wrapper and content
        const wrapper = document.createElement('div');
        wrapper.style.height = `${items.length * itemHeight}px`;
        wrapper.style.position = 'relative';

        const content = document.createElement('div');
        content.style.position = 'absolute';
        content.style.top = '0';
        content.style.width = '100%';

        wrapper.appendChild(content);
        container.appendChild(wrapper);

        const updateVisibleItems = () => {
            const containerHeight = container.clientHeight;
            const scrollTop = container.scrollTop;
            
            const visibleStart = Math.floor(scrollTop / itemHeight);
            const visibleEnd = Math.min(
                items.length - 1,
                Math.ceil((scrollTop + containerHeight) / itemHeight)
            );

            const bufferStart = Math.max(0, visibleStart - bufferSize);
            const bufferEnd = Math.min(items.length - 1, visibleEnd + bufferSize);

            // Clear current content
            content.innerHTML = '';
            content.style.transform = `translateY(${bufferStart * itemHeight}px)`;

            // Render visible items
            for (let i = bufferStart; i <= bufferEnd; i++) {
                const itemElement = renderItem(items[i], i);
                itemElement.style.height = `${itemHeight}px`;
                content.appendChild(itemElement);
            }
        };

        // Add scroll listener
        this.addThrottledListener(container, 'scroll', updateVisibleItems, 16); // 60fps
        
        // Initial render
        updateVisibleItems();

        return {
            updateItems: (newItems) => {
                virtualList.items = newItems;
                wrapper.style.height = `${newItems.length * itemHeight}px`;
                updateVisibleItems();
            },
            destroy: () => {
                container.removeChild(wrapper);
            }
        };
    }

    // Metrics and Logging
    logMetric(category, action, data = null) {
        if (!this.config.performanceLogging) return;

        const entry = {
            category,
            action,
            data,
            timestamp: Date.now(),
            url: window.location.pathname
        };

        // Store locally for debugging
        if (!this.performanceMetrics[category]) {
            this.performanceMetrics[category] = [];
        }

        this.performanceMetrics[category].push(entry);

        // Keep only recent metrics
        if (this.performanceMetrics[category].length > 1000) {
            this.performanceMetrics[category] = this.performanceMetrics[category].slice(-500);
        }

        // Send to external analytics if configured
        this.deferTask(() => {
            this.sendMetricToAnalytics(entry);
        }, 'low');
    }

    sendMetricToAnalytics(metric) {
        // Placeholder for external analytics integration
        // Could send to Google Analytics, custom endpoint, etc.
        if (window.gtag) {
            window.gtag('event', metric.action, {
                event_category: metric.category,
                value: typeof metric.data === 'number' ? metric.data : 1
            });
        }
    }

    getPerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            cacheStats: this.getCacheStats(),
            memoryUsage: this.getMemoryStats(),
            renderingStats: this.getRenderingStats(),
            errorCounts: this.performanceMetrics.errorCounts,
            recommendations: this.getPerformanceRecommendations()
        };

        return report;
    }

    getCacheStats() {
        const { hits, misses } = this.performanceMetrics.cacheHitRatio;
        const total = hits + misses;
        
        return {
            size: this.cache.size,
            hitRatio: total > 0 ? Math.round((hits / total) * 100) : 0,
            totalRequests: total,
            averageSize: this.getAverageCacheEntrySize()
        };
    }

    getMemoryStats() {
        const recent = this.performanceMetrics.memoryUsage.slice(-10);
        if (recent.length === 0) return null;

        const latest = recent[recent.length - 1];
        const average = recent.reduce((sum, entry) => sum + entry.used, 0) / recent.length;

        return {
            current: Math.round(latest.used / 1024 / 1024), // MB
            average: Math.round(average / 1024 / 1024), // MB
            limit: Math.round(latest.limit / 1024 / 1024), // MB
            usage: Math.round((latest.used / latest.total) * 100)
        };
    }

    getRenderingStats() {
        return {
            frameRate: this.performanceMetrics.frameRate || 0,
            averageFrameTime: this.performanceMetrics.frameRate ? 
                Math.round(1000 / this.performanceMetrics.frameRate) : 0
        };
    }

    getPerformanceRecommendations() {
        const recommendations = [];
        const cacheStats = this.getCacheStats();
        const memoryStats = this.getMemoryStats();

        if (cacheStats.hitRatio < 50) {
            recommendations.push({
                type: 'cache',
                severity: 'medium',
                message: 'Cache hit ratio is low. Consider reviewing cache strategies.',
                value: `${cacheStats.hitRatio}%`
            });
        }

        if (memoryStats && memoryStats.usage > 80) {
            recommendations.push({
                type: 'memory',
                severity: 'high',
                message: 'High memory usage detected. Consider clearing unused data.',
                value: `${memoryStats.usage}%`
            });
        }

        if (this.performanceMetrics.frameRate && this.performanceMetrics.frameRate < 30) {
            recommendations.push({
                type: 'rendering',
                severity: 'high',
                message: 'Low frame rate detected. Check for heavy DOM operations.',
                value: `${this.performanceMetrics.frameRate} fps`
            });
        }

        return recommendations;
    }

    // Utility Methods
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        
        return obj;
    }

    estimateSize(obj) {
        return JSON.stringify(obj).length;
    }

    getAverageCacheEntrySize() {
        if (this.cache.size === 0) return 0;
        
        let totalSize = 0;
        for (const [_, entry] of this.cache) {
            totalSize += entry.size || 0;
        }
        
        return Math.round(totalSize / this.cache.size);
    }

    // Cleanup
    destroy() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }

        this.clearCache();
        this.deferredTasks = [];
        this.observers.clear();
        this.debounceMap.clear();
        this.throttleMap.clear();
    }
}

// Create singleton instance
const performanceManager = new PerformanceManager();

// Export as global
window.PerformanceManager = performanceManager;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = performanceManager;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    performanceManager.destroy();
});