// ENARM Prep - Application Initializer with Dependency Management
(function() {
    'use strict';

    /**
     * Application Initializer - Manages the complete startup sequence
     * Replaces the problematic direct service injection with proper dependency management
     */
    class AppInitializer {
        constructor() {
            this.initializationStarted = false;
            this.initializationComplete = false;
            this.services = new Map();
            this.initPromise = null;
        }

        /**
         * Main initialization entry point
         * @returns {Promise<void>}
         */
        async initialize() {
            if (this.initializationStarted) {
                return this.initPromise;
            }

            this.initializationStarted = true;
            console.log('🚀 ENARM Prep - Starting secure initialization...');

            this.initPromise = this.performInitialization();
            return this.initPromise;
        }

        /**
         * Perform the complete initialization sequence
         * @private
         */
        async performInitialization() {
            try {
                // Phase 1: Core Security and Utilities
                await this.initializeCoreServices();
                
                // Phase 2: Register all services with dependencies
                await this.registerServices();
                
                // Phase 3: Initialize services using dependency manager
                await this.initializeServicesWithDependencies();
                
                // Phase 4: Start main application
                await this.initializeMainApplication();
                
                // Phase 5: Post-initialization setup
                await this.performPostInitialization();

                this.initializationComplete = true;
                console.log('✅ ENARM Prep - Initialization completed successfully');
                
                // Dispatch initialization complete event
                window.dispatchEvent(new CustomEvent('enarm:initialized'));

            } catch (error) {
                console.error('❌ ENARM Prep - Initialization failed:', error);
                ErrorHandler.logError('Application initialization failed', error);
                
                // Attempt fallback initialization
                await this.attemptFallbackInitialization();
            }
        }

        /**
         * Initialize core security and utility services first
         * @private
         */
        async initializeCoreServices() {
            console.log('📊 Initializing core services...');

            // Ensure ErrorHandler is globally available as static methods
            if (window.ErrorHandler && !window.ErrorHandler.logError) {
                // Create static methods for backward compatibility
                const errorHandlerInstance = new window.ErrorHandler();
                window.ErrorHandler.logError = errorHandlerInstance.logError.bind(errorHandlerInstance);
                window.ErrorHandler.handleError = errorHandlerInstance.handleError.bind(errorHandlerInstance);
            }

            // Data Integrity Manager (with safe error handling)
            try {
                if (window.DataIntegrityManager) {
                    await window.DataIntegrityManager.initialize();
                }
            } catch (error) {
                console.warn('⚠️ Data Integrity Manager failed to initialize:', error.message);
            }

            // Validate stored data integrity (with safe error handling)
            try {
                const integrityValid = window.DataIntegrityManager ? 
                    await window.DataIntegrityManager.validateStoredData() : true;
                
                if (!integrityValid) {
                    console.warn('⚠️ Data integrity issues detected - clearing corrupted data');
                    if (window.StorageService && typeof window.StorageService.clear === 'function') {
                        window.StorageService.clear();
                    }
                }
            } catch (error) {
                console.warn('⚠️ Data integrity validation failed:', error.message);
            }
        }

        /**
         * Register all services with their dependencies
         * @private
         */
        async registerServices() {
            console.log('📝 Registering services with dependency manager...');

            const dm = window.dependencyManager;
            if (!dm) {
                throw new Error('DependencyManager not available');
            }

            // Core services (no dependencies)
            dm.register('StorageService', () => window.StorageService);
            dm.register('ErrorHandler', () => window.ErrorHandler);
            dm.register('CommonUtils', () => window.CommonUtils);
            dm.register('DOMSanitizer', () => window.DOMSanitizer);

            // Service layer (depends on core)
            dm.register('ThemeManager', () => {
                return window.ThemeManager ? new window.ThemeManager() : null;
            }, ['StorageService']);

            dm.register('NavigationManager', () => {
                return window.NavigationManager ? new window.NavigationManager() : null;
            }, ['StorageService']);

            dm.register('TimerService', () => {
                return window.TimerService ? new window.TimerService() : null;
            }, ['StorageService', 'ErrorHandler']);

            // Enhanced services
            dm.register('AchievementManager', () => {
                return window.AchievementManager ? new window.AchievementManager() : null;
            }, ['StorageService']);

            dm.register('ChartService', () => {
                return window.ChartService ? new window.ChartService() : null;
            });

            dm.register('AnalyticsCalculator', () => {
                return window.AnalyticsCalculator ? new window.AnalyticsCalculator() : null;
            });

            // Management services
            dm.register('QuestionManager', () => {
                return window.QuestionManager ? new window.QuestionManager() : null;
            }, ['StorageService', 'DOMSanitizer']);

            dm.register('ProgressManager', () => {
                return window.ProgressManager ? 
                    new window.ProgressManager(
                        window.achievementManager,
                        window.chartService,
                        window.analyticsCalculator
                    ) : null;
            }, ['AchievementManager', 'ChartService', 'AnalyticsCalculator', 'StorageService']);

            // Session and controllers
            dm.register('SessionManager', () => {
                return window.SessionManager ? new window.SessionManager() : null;
            }, ['StorageService', 'TimerService']);

            dm.register('PracticeModeController', () => {
                return window.PracticeModeController ? new window.PracticeModeController() : null;
            }, ['SessionManager', 'QuestionManager']);

            dm.register('QuestionDisplayController', () => {
                return window.QuestionDisplayController ? new window.QuestionDisplayController() : null;
            }, ['DOMSanitizer']);

            dm.register('FreemiumManager', () => {
                return window.FreemiumManager ? new window.FreemiumManager() : null;
            }, ['StorageService']);
        }

        /**
         * Initialize all services using dependency manager
         * @private
         */
        async initializeServicesWithDependencies() {
            console.log('⚙️ Initializing services with dependencies...');
            
            const dm = window.dependencyManager;
            await dm.initialize();

            // Verify critical services are available
            const criticalServices = [
                'StorageService', 'ErrorHandler', 'DOMSanitizer',
                'QuestionManager', 'ProgressManager'
            ];

            for (const serviceName of criticalServices) {
                if (!dm.isServiceReady(serviceName)) {
                    console.warn(`⚠️ Critical service ${serviceName} failed to initialize`);
                }
            }
        }

        /**
         * Initialize the main ENARM application
         * @private
         */
        async initializeMainApplication() {
            console.log('🎯 Initializing main application...');

            // Wait for critical services
            await window.dependencyManager.waitForServices([
                'QuestionManager', 'ProgressManager', 'StorageService'
            ], 10000);

            // Create main app instance with safe service injection
            if (window.ENARMApp) {
                // Override the unsafe injectServices method
                const originalInjectServices = window.ENARMApp.prototype.injectServices;
                window.ENARMApp.prototype.injectServices = function() {
                    const dm = window.dependencyManager;
                    
                    // Safely inject services with null checks
                    this.sessionManager = dm.isServiceReady('SessionManager') ? window.SessionManager : null;
                    this.timerService = dm.isServiceReady('TimerService') ? window.TimerService : null;
                    this.practiceModeController = dm.isServiceReady('PracticeModeController') ? window.PracticeModeController : null;
                    this.questionDisplayController = dm.isServiceReady('QuestionDisplayController') ? window.QuestionDisplayController : null;
                    this.themeManager = dm.isServiceReady('ThemeManager') ? window.ThemeManager : null;
                    
                    console.log('✅ Services injected safely');
                };

                window.enarmApp = new window.ENARMApp();
            } else {
                throw new Error('ENARMApp class not found');
            }
        }

        /**
         * Perform post-initialization tasks
         * @private
         */
        async performPostInitialization() {
            console.log('🔧 Performing post-initialization tasks...');

            // Load and validate questions data
            if (window.QuestionManager) {
                try {
                    await window.QuestionManager.loadQuestions();
                    console.log('✅ Questions loaded successfully');
                } catch (error) {
                    console.warn('⚠️ Failed to load questions:', error.message);
                }
            }

            // Initialize progressive enhancement
            if (window.ProgressiveEnhancement) {
                try {
                    window.ProgressiveEnhancement.initialize();
                } catch (error) {
                    console.warn('⚠️ Progressive enhancement failed:', error.message);
                }
            }

            // Setup periodic integrity checks
            if (window.DataIntegrityManager) {
                setInterval(() => {
                    window.DataIntegrityManager.cleanupOldData();
                }, 24 * 60 * 60 * 1000); // Daily cleanup
            }

            // Log initialization status
            const dm = window.dependencyManager;
            if (dm) {
                const status = dm.getStatus();
                console.log('📊 Initialization Status:', status);
            }
        }

        /**
         * Attempt fallback initialization if primary initialization fails
         * @private
         */
        async attemptFallbackInitialization() {
            console.log('🔄 Attempting fallback initialization...');
            
            try {
                // Clear potentially corrupted data
                if (window.StorageService) {
                    window.StorageService.clear();
                }

                // Initialize with minimal services
                if (window.ENARMApp) {
                    // Create a minimal app instance
                    const fallbackApp = {
                        showPage: (page) => {
                            console.log(`Showing page: ${page}`);
                            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
                            const targetPage = document.getElementById(`${page}-page`);
                            if (targetPage) {
                                targetPage.style.display = 'block';
                            }
                        },
                        init: () => console.log('Fallback app initialized')
                    };

                    window.enarmApp = fallbackApp;
                    fallbackApp.init();
                }

                // Show error message to user
                this.showInitializationError();

            } catch (fallbackError) {
                console.error('❌ Fallback initialization also failed:', fallbackError);
                this.showCriticalError();
            }
        }

        /**
         * Show initialization error to user
         * @private
         */
        showInitializationError() {
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; background: #f8d7da; color: #721c24; padding: 15px; text-align: center; z-index: 10000;">
                    <strong>Error de Inicialización:</strong> La aplicación encontró un problema al iniciarse. 
                    Algunas funciones pueden estar limitadas. 
                    <button onclick="location.reload()" style="margin-left: 10px; padding: 5px 10px;">Reintentar</button>
                </div>
            `;
            document.body.insertBefore(errorDiv, document.body.firstChild);
        }

        /**
         * Show critical error to user
         * @private
         */
        showCriticalError() {
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
                    <h1 style="color: #dc3545;">Error Crítico</h1>
                    <p>La aplicación no pudo iniciarse correctamente.</p>
                    <p>Por favor, recarga la página o contacta al soporte técnico.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Recargar Página
                    </button>
                </div>
            `;
        }

        /**
         * Get initialization status
         * @returns {Object} Status information
         */
        getStatus() {
            return {
                started: this.initializationStarted,
                complete: this.initializationComplete,
                dependencyManager: window.dependencyManager?.getStatus() || null,
                services: Array.from(this.services.keys())
            };
        }
    }

    // Create global initializer instance
    window.appInitializer = new AppInitializer();

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.appInitializer.initialize();
        });
    } else {
        // DOM already loaded
        setTimeout(() => window.appInitializer.initialize(), 0);
    }

    // Provide global access to initialization status
    window.getAppInitializationStatus = () => window.appInitializer.getStatus();

})();