// ENARM Prep - Progressive Enhancement Manager
class ProgressiveEnhancement {
    constructor() {
        this.features = {};
        this.fallbacks = {};
        this.capabilities = {};
        this.enhancementLevel = 'basic';
        
        this.init();
    }

    init() {
        this.detectCapabilities();
        this.setupFeatureDetection();
        this.determineEnhancementLevel();
        this.initializeFeatures();
        this.setupFallbacks();
    }

    detectCapabilities() {
        this.capabilities = {
            // Storage capabilities
            localStorage: this.checkLocalStorage(),
            sessionStorage: this.checkSessionStorage(),
            indexedDB: this.checkIndexedDB(),
            
            // JavaScript features
            es6: this.checkES6Support(),
            promises: this.checkPromises(),
            fetch: this.checkFetch(),
            serviceWorker: this.checkServiceWorker(),
            
            // Performance APIs
            performanceObserver: this.checkPerformanceObserver(),
            intersectionObserver: this.checkIntersectionObserver(),
            requestIdleCallback: this.checkRequestIdleCallback(),
            
            // Security features
            crypto: this.checkCrypto(),
            csp: this.checkCSP(),
            
            // UI capabilities
            touchEvents: this.checkTouchEvents(),
            deviceMotion: this.checkDeviceMotion(),
            
            // Network features
            networkInformation: this.checkNetworkInformation(),
            offlineSupport: this.checkOfflineSupport()
        };
        
        console.log('🔍 Detected capabilities:', this.capabilities);
    }

    checkLocalStorage() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    checkSessionStorage() {
        try {
            const test = '__session_test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    checkIndexedDB() {
        return 'indexedDB' in window;
    }

    checkES6Support() {
        try {
            // Test for arrow functions, const/let, template literals
            eval('const test = () => `test`;');
            return true;
        } catch (e) {
            return false;
        }
    }

    checkPromises() {
        return typeof Promise !== 'undefined' && typeof Promise.resolve === 'function';
    }

    checkFetch() {
        return typeof fetch === 'function';
    }

    checkServiceWorker() {
        return 'serviceWorker' in navigator;
    }

    checkPerformanceObserver() {
        return 'PerformanceObserver' in window;
    }

    checkIntersectionObserver() {
        return 'IntersectionObserver' in window;
    }

    checkRequestIdleCallback() {
        return 'requestIdleCallback' in window;
    }

    checkCrypto() {
        return 'crypto' in window && 'subtle' in window.crypto;
    }

    checkCSP() {
        // Basic CSP detection
        return document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null;
    }

    checkTouchEvents() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    checkDeviceMotion() {
        return 'DeviceMotionEvent' in window;
    }

    checkNetworkInformation() {
        return 'connection' in navigator;
    }

    checkOfflineSupport() {
        return 'onLine' in navigator;
    }

    determineEnhancementLevel() {
        const score = Object.values(this.capabilities).filter(Boolean).length;
        const totalFeatures = Object.keys(this.capabilities).length;
        const percentage = (score / totalFeatures) * 100;
        
        if (percentage >= 80) {
            this.enhancementLevel = 'advanced';
        } else if (percentage >= 60) {
            this.enhancementLevel = 'intermediate';
        } else {
            this.enhancementLevel = 'basic';
        }
        
        console.log(`📊 Enhancement level: ${this.enhancementLevel} (${score}/${totalFeatures} features, ${percentage.toFixed(1)}%)`);
    }

    setupFeatureDetection() {
        this.features = {
            // Core application features
            dataValidation: {
                name: 'Data Validation',
                check: () => !!window.DataValidator,
                fallback: () => this.setupBasicValidation(),
                required: true
            },
            
            performanceOptimization: {
                name: 'Performance Optimization',
                check: () => !!window.PerformanceOptimizer,
                fallback: () => this.setupBasicPerformance(),
                required: false
            },
            
            errorHandling: {
                name: 'Advanced Error Handling',
                check: () => !!window.ErrorHandler,
                fallback: () => this.setupBasicErrorHandling(),
                required: true
            },
            
            storageService: {
                name: 'Enhanced Storage',
                check: () => !!window.StorageService && this.capabilities.localStorage,
                fallback: () => this.setupBasicStorage(),
                required: true
            },
            
            // Enhancement features
            lazyLoading: {
                name: 'Lazy Loading',
                check: () => this.capabilities.intersectionObserver,
                fallback: () => this.setupEagerLoading(),
                required: false
            },
            
            offlineSupport: {
                name: 'Offline Functionality',
                check: () => this.capabilities.serviceWorker && this.capabilities.offlineSupport,
                fallback: () => this.setupOnlineOnlyMode(),
                required: false
            },
            
            advancedUI: {
                name: 'Advanced UI Features',
                check: () => this.capabilities.touchEvents && this.capabilities.deviceMotion,
                fallback: () => this.setupBasicUI(),
                required: false
            },
            
            performanceMonitoring: {
                name: 'Performance Monitoring',
                check: () => this.capabilities.performanceObserver,
                fallback: () => this.setupBasicMonitoring(),
                required: false
            }
        };
    }

    initializeFeatures() {
        const results = {};
        
        for (const [key, feature] of Object.entries(this.features)) {
            try {
                if (feature.check()) {
                    results[key] = 'available';
                    console.log(`✅ ${feature.name}: Available`);
                } else {
                    if (feature.required) {
                        console.warn(`⚠️ ${feature.name}: Required but not available, using fallback`);
                        feature.fallback();
                        results[key] = 'fallback';
                    } else {
                        console.log(`ℹ️ ${feature.name}: Optional feature not available`);
                        results[key] = 'unavailable';
                    }
                }
            } catch (error) {
                console.error(`❌ ${feature.name}: Error during initialization:`, error);
                if (feature.required) {
                    feature.fallback();
                    results[key] = 'fallback';
                } else {
                    results[key] = 'error';
                }
            }
        }
        
        this.featureResults = results;
        this.notifyFeatureStatus();
    }

    // Fallback implementations
    setupBasicValidation() {
        if (!window.DataValidator) {
            window.DataValidator = {
                sanitizeText: (input) => {
                    if (typeof input !== 'string') return '';
                    return input.replace(/[<>&"']/g, (char) => {
                        const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
                        return entities[char] || char;
                    });
                },
                sanitizeHTML: (input) => window.DataValidator.sanitizeText(input),
                validateQuestion: (question) => ({ valid: !!question, errors: [], data: question }),
                validateStorageData: () => ({ valid: true, errors: [] }),
                sanitizeForStorage: (data) => data
            };
            
            // Setup safe DOM operations
            window.safeSetText = (element, text) => {
                if (element) element.textContent = text;
            };
            window.safeSetHTML = (element, html) => {
                if (element) element.innerHTML = window.DataValidator.sanitizeHTML(html);
            };
        }
    }

    setupBasicPerformance() {
        if (!window.PerformanceOptimizer) {
            window.PerformanceOptimizer = {
                debounce: (func, wait) => {
                    let timeout;
                    return function executedFunction(...args) {
                        const later = () => {
                            clearTimeout(timeout);
                            func(...args);
                        };
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                    };
                },
                throttle: (func, limit) => {
                    let inThrottle;
                    return function() {
                        const args = arguments;
                        const context = this;
                        if (!inThrottle) {
                            func.apply(context, args);
                            inThrottle = true;
                            setTimeout(() => inThrottle = false, limit);
                        }
                    };
                },
                batchDOM: (operation) => {
                    if (typeof requestAnimationFrame === 'function') {
                        requestAnimationFrame(operation);
                    } else {
                        setTimeout(operation, 16);
                    }
                },
                createQuestionLoader: () => ({
                    init: async (questions) => { this.questions = questions; },
                    getLoadedQuestions: () => this.questions || [],
                    loadNextChunk: () => Promise.resolve(false),
                    searchQuestions: (query, filters) => (this.questions || []).filter(q => 
                        (!query || q.question.toLowerCase().includes(query.toLowerCase())) &&
                        (!filters.category || q.category === filters.category)
                    )
                }),
                optimizeMemory: () => {},
                recordMetric: () => {}
            };
        }
    }

    setupBasicErrorHandling() {
        if (!window.ErrorHandler) {
            window.ErrorHandler = {
                logError: (error, context) => {
                    console.error(`Error in ${context}:`, error);
                },
                getErrors: () => [],
                tryAsync: async (fn) => {
                    try {
                        return await fn();
                    } catch (error) {
                        this.logError(error, 'async-operation');
                        throw error;
                    }
                },
                addErrorListener: () => {}
            };
        }
    }

    setupBasicStorage() {
        if (!window.StorageService) {
            window.StorageService = {
                setItem: (key, value) => {
                    try {
                        if (this.capabilities.localStorage) {
                            localStorage.setItem(key, JSON.stringify(value));
                            return true;
                        }
                    } catch (e) {
                        console.warn('Storage failed:', e);
                    }
                    return false;
                },
                getItem: (key, defaultValue) => {
                    try {
                        if (this.capabilities.localStorage) {
                            const stored = localStorage.getItem(key);
                            return stored ? JSON.parse(stored) : defaultValue;
                        }
                    } catch (e) {
                        console.warn('Storage retrieval failed:', e);
                    }
                    return defaultValue;
                },
                removeItem: (key) => {
                    try {
                        if (this.capabilities.localStorage) {
                            localStorage.removeItem(key);
                            return true;
                        }
                    } catch (e) {
                        console.warn('Storage removal failed:', e);
                    }
                    return false;
                },
                clear: () => {
                    try {
                        if (this.capabilities.localStorage) {
                            localStorage.clear();
                            return true;
                        }
                    } catch (e) {
                        console.warn('Storage clear failed:', e);
                    }
                    return false;
                }
            };
        }
    }

    setupEagerLoading() {
        // Load all content immediately instead of lazy loading
        console.log('📥 Using eager loading fallback');
        document.addEventListener('DOMContentLoaded', () => {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                img.src = img.dataset.src;
                delete img.dataset.src;
            });
        });
    }

    setupOnlineOnlyMode() {
        console.log('🌐 Running in online-only mode');
        // Disable offline features and show online status
        if (navigator.onLine !== undefined) {
            window.addEventListener('offline', () => {
                this.showConnectivityWarning('You are offline. Some features may not work.');
            });
            
            window.addEventListener('online', () => {
                this.hideConnectivityWarning();
            });
        }
    }

    setupBasicUI() {
        console.log('🖱️ Using basic UI without touch/motion features');
        // Ensure click handlers work without touch optimization
        document.addEventListener('DOMContentLoaded', () => {
            // Remove touch-specific classes
            document.body.classList.add('no-touch');
            
            // Ensure all interactive elements have proper cursor styles
            const interactiveElements = document.querySelectorAll('button, .btn, a, [data-action]');
            interactiveElements.forEach(el => {
                el.style.cursor = 'pointer';
            });
        });
    }

    setupBasicMonitoring() {
        if (!window.MonitoringDashboard) {
            window.MonitoringDashboard = {
                recordMetric: () => {},
                addAlert: (type, message) => {
                    console.log(`${type.toUpperCase()}: ${message}`);
                },
                getReport: () => ({ message: 'Basic monitoring active' })
            };
        }
    }

    setupFallbacks() {
        // Polyfills for missing features
        if (!this.capabilities.fetch) {
            this.loadXHRFallback();
        }
        
        if (!this.capabilities.promises) {
            this.loadPromisePolyfill();
        }
        
        if (!this.capabilities.requestIdleCallback) {
            this.setupRequestIdleCallbackPolyfill();
        }
    }

    loadXHRFallback() {
        window.fetch = function(url, options = {}) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open(options.method || 'GET', url);
                
                if (options.headers) {
                    Object.keys(options.headers).forEach(key => {
                        xhr.setRequestHeader(key, options.headers[key]);
                    });
                }
                
                xhr.onload = () => {
                    resolve({
                        ok: xhr.status >= 200 && xhr.status < 300,
                        status: xhr.status,
                        json: () => Promise.resolve(JSON.parse(xhr.responseText)),
                        text: () => Promise.resolve(xhr.responseText)
                    });
                };
                
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(options.body);
            });
        };
    }

    loadPromisePolyfill() {
        // Basic Promise polyfill for very old browsers
        if (!window.Promise) {
            window.Promise = function(executor) {
                const self = this;
                this.state = 'pending';
                this.value = undefined;
                this.handlers = [];
                
                function resolve(value) {
                    if (self.state === 'pending') {
                        self.state = 'fulfilled';
                        self.value = value;
                        self.handlers.forEach(handler => handler.onFulfilled(value));
                    }
                }
                
                function reject(reason) {
                    if (self.state === 'pending') {
                        self.state = 'rejected';
                        self.value = reason;
                        self.handlers.forEach(handler => handler.onRejected(reason));
                    }
                }
                
                this.then = function(onFulfilled, onRejected) {
                    return new Promise((resolve, reject) => {
                        if (self.state === 'fulfilled') {
                            try {
                                resolve(onFulfilled ? onFulfilled(self.value) : self.value);
                            } catch (e) {
                                reject(e);
                            }
                        } else if (self.state === 'rejected') {
                            if (onRejected) {
                                try {
                                    resolve(onRejected(self.value));
                                } catch (e) {
                                    reject(e);
                                }
                            } else {
                                reject(self.value);
                            }
                        } else {
                            self.handlers.push({ onFulfilled, onRejected, resolve, reject });
                        }
                    });
                };
                
                try {
                    executor(resolve, reject);
                } catch (e) {
                    reject(e);
                }
            };
        }
    }

    setupRequestIdleCallbackPolyfill() {
        if (!window.requestIdleCallback) {
            window.requestIdleCallback = function(callback) {
                const start = Date.now();
                return setTimeout(() => {
                    callback({
                        didTimeout: false,
                        timeRemaining() {
                            return Math.max(0, 50 - (Date.now() - start));
                        }
                    });
                }, 1);
            };
            
            window.cancelIdleCallback = function(id) {
                clearTimeout(id);
            };
        }
    }

    showConnectivityWarning(message) {
        let warning = document.getElementById('connectivity-warning');
        if (!warning) {
            warning = document.createElement('div');
            warning.id = 'connectivity-warning';
            warning.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff9800;
                color: white;
                padding: 10px;
                text-align: center;
                z-index: 10000;
                font-weight: bold;
            `;
            document.body.appendChild(warning);
        }
        warning.textContent = message;
        warning.style.display = 'block';
    }

    hideConnectivityWarning() {
        const warning = document.getElementById('connectivity-warning');
        if (warning) {
            warning.style.display = 'none';
        }
    }

    notifyFeatureStatus() {
        // Create a summary of available features
        const summary = {
            level: this.enhancementLevel,
            capabilities: this.capabilities,
            features: this.featureResults,
            timestamp: Date.now()
        };
        
        // Store for other components to access
        window.ENHANCEMENT_STATUS = summary;
        
        // Dispatch event for components that need to adapt
        if (typeof CustomEvent !== 'undefined') {
            document.dispatchEvent(new CustomEvent('enhancement-ready', {
                detail: summary
            }));
        }
        
        // Show user-friendly message about feature level
        this.showFeatureLevelNotification();
    }

    showFeatureLevelNotification() {
        if (this.enhancementLevel === 'basic') {
            console.warn('⚠️ Running in basic mode. Some advanced features disabled for compatibility.');
        } else if (this.enhancementLevel === 'intermediate') {
            console.log('ℹ️ Running in enhanced mode with most features available.');
        } else {
            console.log('🚀 Running in advanced mode with all features available.');
        }
    }

    getStatus() {
        return {
            level: this.enhancementLevel,
            capabilities: this.capabilities,
            features: this.featureResults,
            recommendations: this.getRecommendations()
        };
    }

    getRecommendations() {
        const recommendations = [];
        
        if (!this.capabilities.localStorage) {
            recommendations.push('Enable localStorage to save progress between sessions');
        }
        
        if (!this.capabilities.serviceWorker) {
            recommendations.push('Use a modern browser for offline support');
        }
        
        if (this.enhancementLevel === 'basic') {
            recommendations.push('Update your browser for better performance and features');
        }
        
        return recommendations;
    }
}

// Initialize progressive enhancement
const progressiveEnhancement = new ProgressiveEnhancement();

// Export as global
window.ProgressiveEnhancement = progressiveEnhancement;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = progressiveEnhancement;
}