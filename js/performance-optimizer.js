// ENARM Prep - Performance Optimization Service
class PerformanceOptimizer {
    constructor() {
        this.debounceTimers = {};
        this.throttleTimers = {};
        this.lazyLoadQueue = [];
        this.domBatchQueue = [];
        this.rafId = null;
        this.intersectionObserver = null;
        this.performanceMetrics = {};
        
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupPerformanceMonitoring();
        this.startDOMBatchProcessor();
    }

    // Debouncing utility - delays execution until after wait milliseconds
    debounce(func, wait, id) {
        return (...args) => {
            clearTimeout(this.debounceTimers[id]);
            this.debounceTimers[id] = setTimeout(() => {
                func.apply(this, args);
                delete this.debounceTimers[id];
            }, wait);
        };
    }

    // Throttling utility - ensures function runs at most once per wait period
    throttle(func, wait, id) {
        return (...args) => {
            if (this.throttleTimers[id]) return;
            
            func.apply(this, args);
            this.throttleTimers[id] = true;
            
            setTimeout(() => {
                delete this.throttleTimers[id];
            }, wait);
        };
    }

    // Lazy Loading for Questions
    createQuestionLoader() {
        const CHUNK_SIZE = 50;
        let loadedQuestions = [];
        let currentChunk = 0;
        let allQuestions = [];
        let isLoading = false;

        return {
            // Initialize with question data
            init: async (questions) => {
                allQuestions = questions;
                loadedQuestions = [];
                currentChunk = 0;
                
                // Load first chunk immediately
                await this.loadNextChunk();
            },

            // Load next chunk of questions
            loadNextChunk: async () => {
                if (isLoading || currentChunk * CHUNK_SIZE >= allQuestions.length) {
                    return false;
                }

                isLoading = true;
                const start = currentChunk * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, allQuestions.length);
                
                // Simulate async loading with validation
                await new Promise(resolve => {
                    requestAnimationFrame(() => {
                        const chunk = allQuestions.slice(start, end);
                        
                        // Validate chunk if DataValidator is available
                        if (window.DataValidator) {
                            const validated = chunk.map(q => {
                                const result = window.DataValidator.validateQuestion(q);
                                return result.valid ? result.data : null;
                            }).filter(Boolean);
                            
                            loadedQuestions.push(...validated);
                        } else {
                            loadedQuestions.push(...chunk);
                        }
                        
                        currentChunk++;
                        isLoading = false;
                        resolve();
                    });
                });

                return true;
            },

            // Get currently loaded questions
            getLoadedQuestions: () => [...loadedQuestions],

            // Get questions with pagination
            getQuestions: (page = 1, pageSize = 10) => {
                const start = (page - 1) * pageSize;
                const end = start + pageSize;
                
                // Check if we need to load more
                if (end > loadedQuestions.length && currentChunk * CHUNK_SIZE < allQuestions.length) {
                    this.loadNextChunk();
                }
                
                return loadedQuestions.slice(start, end);
            },

            // Search within loaded questions
            searchQuestions: (query, filters = {}) => {
                const searchTerm = query.toLowerCase();
                
                return loadedQuestions.filter(q => {
                    // Text search
                    const matchesText = !query || 
                        q.question.toLowerCase().includes(searchTerm) ||
                        Object.values(q.options).some(opt => 
                            opt.toLowerCase().includes(searchTerm)
                        );
                    
                    // Filter by category
                    const matchesCategory = !filters.category || 
                        q.category === filters.category;
                    
                    // Filter by difficulty
                    const matchesDifficulty = !filters.difficulty || 
                        q.difficulty === filters.difficulty;
                    
                    return matchesText && matchesCategory && matchesDifficulty;
                });
            },

            // Preload specific questions
            preloadQuestions: async (questionIds) => {
                const toLoad = questionIds
                    .map(id => allQuestions.find(q => q.id === id))
                    .filter(q => q && !loadedQuestions.find(lq => lq.id === q.id));
                
                if (toLoad.length > 0) {
                    loadedQuestions.push(...toLoad);
                }
            },

            // Get loading progress
            getProgress: () => ({
                loaded: loadedQuestions.length,
                total: allQuestions.length,
                percentage: Math.round((loadedQuestions.length / allQuestions.length) * 100)
            })
        };
    }

    // DOM Batch Operations
    batchDOM(operation) {
        this.domBatchQueue.push(operation);
        
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                this.processDOMBatch();
            });
        }
    }

    processDOMBatch() {
        const batch = [...this.domBatchQueue];
        this.domBatchQueue = [];
        this.rafId = null;

        // Measure performance
        const startTime = performance.now();
        
        // Process all operations in a single frame
        batch.forEach(operation => {
            try {
                operation();
            } catch (error) {
                console.error('Error in DOM batch operation:', error);
            }
        });

        // Record metrics
        const duration = performance.now() - startTime;
        this.recordMetric('domBatch', duration, batch.length);
    }

    startDOMBatchProcessor() {
        // Process any pending operations every 16ms (60fps)
        setInterval(() => {
            if (this.domBatchQueue.length > 0 && !this.rafId) {
                this.rafId = requestAnimationFrame(() => {
                    this.processDOMBatch();
                });
            }
        }, 16);
    }

    // Optimized DOM Updates
    updateDOM(updates) {
        this.batchDOM(() => {
            // Use DocumentFragment for multiple insertions
            if (updates.insertions && updates.insertions.length > 0) {
                const fragment = document.createDocumentFragment();
                updates.insertions.forEach(({ element, parent }) => {
                    fragment.appendChild(element);
                });
                if (updates.targetParent) {
                    updates.targetParent.appendChild(fragment);
                }
            }

            // Batch style changes
            if (updates.styles && updates.styles.length > 0) {
                updates.styles.forEach(({ element, styles }) => {
                    Object.assign(element.style, styles);
                });
            }

            // Batch class changes
            if (updates.classes && updates.classes.length > 0) {
                updates.classes.forEach(({ element, add, remove }) => {
                    if (add) element.classList.add(...add);
                    if (remove) element.classList.remove(...remove);
                });
            }

            // Batch text updates
            if (updates.texts && updates.texts.length > 0) {
                updates.texts.forEach(({ element, text }) => {
                    if (window.DataValidator) {
                        element.textContent = window.DataValidator.sanitizeText(text);
                    } else {
                        element.textContent = text;
                    }
                });
            }
        });
    }

    // Virtual List for large datasets
    createVirtualList(container, items, renderItem, itemHeight = 50) {
        const scrollHandler = this.throttle(() => {
            this.updateVirtualList();
        }, 16, 'virtualList');

        const state = {
            container,
            items,
            renderItem,
            itemHeight,
            visibleStart: 0,
            visibleEnd: 0,
            scrollTop: 0,
            containerHeight: 0
        };

        const updateVirtualList = () => {
            state.scrollTop = container.scrollTop;
            state.containerHeight = container.clientHeight;
            
            state.visibleStart = Math.floor(state.scrollTop / itemHeight);
            state.visibleEnd = Math.ceil((state.scrollTop + state.containerHeight) / itemHeight);
            
            // Add buffer for smooth scrolling
            const buffer = 5;
            state.visibleStart = Math.max(0, state.visibleStart - buffer);
            state.visibleEnd = Math.min(items.length, state.visibleEnd + buffer);
            
            this.renderVirtualItems(state);
        };

        container.addEventListener('scroll', scrollHandler);
        updateVirtualList();

        return {
            update: updateVirtualList,
            destroy: () => container.removeEventListener('scroll', scrollHandler),
            setItems: (newItems) => {
                state.items = newItems;
                updateVirtualList();
            }
        };
    }

    renderVirtualItems(state) {
        const { container, items, renderItem, itemHeight, visibleStart, visibleEnd } = state;
        
        this.batchDOM(() => {
            // Clear container
            container.innerHTML = '';
            
            // Create spacer for items above
            const spacerTop = document.createElement('div');
            spacerTop.style.height = `${visibleStart * itemHeight}px`;
            container.appendChild(spacerTop);
            
            // Render visible items
            const fragment = document.createDocumentFragment();
            for (let i = visibleStart; i < visibleEnd; i++) {
                if (items[i]) {
                    const element = renderItem(items[i], i);
                    fragment.appendChild(element);
                }
            }
            container.appendChild(fragment);
            
            // Create spacer for items below
            const spacerBottom = document.createElement('div');
            spacerBottom.style.height = `${(items.length - visibleEnd) * itemHeight}px`;
            container.appendChild(spacerBottom);
        });
    }

    // Intersection Observer for lazy loading images/content
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyElement(entry.target);
                    }
                });
            },
            {
                rootMargin: '50px' // Start loading 50px before visible
            }
        );
    }

    observeLazyElement(element) {
        if (this.intersectionObserver) {
            this.intersectionObserver.observe(element);
        }
    }

    loadLazyElement(element) {
        if (element.dataset.src) {
            element.src = element.dataset.src;
            delete element.dataset.src;
        }
        
        if (element.dataset.content) {
            element.innerHTML = element.dataset.content;
            delete element.dataset.content;
        }
        
        element.classList.add('lazy-loaded');
        this.intersectionObserver.unobserve(element);
    }

    // Memory Management
    optimizeMemory() {
        // Clear unused caches
        if (window.StorageService) {
            const sessions = window.StorageService.getItem('enarm-sessions', []);
            if (sessions.length > 50) {
                // Keep only last 30 sessions
                window.StorageService.setItem('enarm-sessions', sessions.slice(-30));
            }
        }

        // Clear old error logs
        if (window.ErrorHandler) {
            const errors = window.ErrorHandler.getErrors();
            if (errors.length > 100) {
                window.ErrorHandler.errors = errors.slice(0, 50);
            }
        }

        // Clear debounce/throttle timers
        Object.keys(this.debounceTimers).forEach(key => {
            clearTimeout(this.debounceTimers[key]);
        });
        this.debounceTimers = {};
        this.throttleTimers = {};

        // Trigger garbage collection hint
        if (window.gc) {
            window.gc();
        }
    }

    // Performance Monitoring
    setupPerformanceMonitoring() {
        if (!('PerformanceObserver' in window)) return;

        // Monitor long tasks
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // Long task threshold
                        this.recordMetric('longTask', entry.duration, entry.name);
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            // Long task monitoring not supported
        }

        // Monitor page metrics
        this.measurePageMetrics();
    }

    measurePageMetrics() {
        if (!performance.timing) return;

        const timing = performance.timing;
        const metrics = {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
            loadComplete: timing.loadEventEnd - timing.loadEventStart,
            domInteractive: timing.domInteractive - timing.domLoading,
            firstPaint: this.getFirstPaint()
        };

        this.performanceMetrics.page = metrics;
        return metrics;
    }

    getFirstPaint() {
        if (window.performance && window.performance.getEntriesByType) {
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            return firstPaint ? firstPaint.startTime : 0;
        }
        return 0;
    }

    recordMetric(type, value, details = null) {
        if (!this.performanceMetrics[type]) {
            this.performanceMetrics[type] = [];
        }

        this.performanceMetrics[type].push({
            timestamp: Date.now(),
            value,
            details
        });

        // Keep only last 100 metrics per type
        if (this.performanceMetrics[type].length > 100) {
            this.performanceMetrics[type] = this.performanceMetrics[type].slice(-100);
        }
    }

    getMetrics(type = null) {
        if (type) {
            return this.performanceMetrics[type] || [];
        }
        return this.performanceMetrics;
    }

    // Session Storage Optimization
    optimizeSessionStorage(data, key) {
        const MAX_SESSION_SIZE = 2 * 1024 * 1024; // 2MB limit for session storage
        
        let serialized = JSON.stringify(data);
        
        if (serialized.length > MAX_SESSION_SIZE) {
            // Compress by removing old data
            if (data.results && Array.isArray(data.results)) {
                // Keep only last 20 results
                data.results = data.results.slice(-20);
            }
            
            if (data.questions && Array.isArray(data.questions)) {
                // Store only question IDs instead of full objects
                data.questionIds = data.questions.map(q => q.id);
                delete data.questions;
            }
            
            serialized = JSON.stringify(data);
            
            if (serialized.length > MAX_SESSION_SIZE) {
                console.warn(`Session data still too large (${(serialized.length / 1024 / 1024).toFixed(2)}MB)`);
                return null;
            }
        }
        
        return data;
    }

    // Request Animation Frame Queue
    raf(callback) {
        return requestAnimationFrame(callback);
    }

    // Cancel Animation Frame
    cancelRaf(id) {
        cancelAnimationFrame(id);
    }

    // Destroy method for cleanup
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        Object.keys(this.debounceTimers).forEach(key => {
            clearTimeout(this.debounceTimers[key]);
        });
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
    }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer();

// Export as global
window.PerformanceOptimizer = performanceOptimizer;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = performanceOptimizer;
}