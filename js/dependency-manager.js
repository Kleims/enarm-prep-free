// ENARM Prep - Dependency Manager for Safe Service Initialization
class DependencyManager {
    constructor() {
        this.services = new Map();
        this.readyServices = new Set();
        this.initializationPromises = new Map();
        this.maxRetries = 3;
        this.retryDelay = 100;
    }

    /**
     * Register a service with its factory function and dependencies
     * @param {string} serviceName - Name of the service
     * @param {Function} factory - Factory function that creates the service
     * @param {Array<string>} dependencies - Array of dependency service names
     */
    register(serviceName, factory, dependencies = []) {
        this.services.set(serviceName, {
            factory,
            dependencies,
            instance: null,
            retries: 0
        });
    }

    /**
     * Initialize all services in correct dependency order
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            // Get initialization order using topological sort
            const order = this.getInitializationOrder();
            
            // Initialize services in order
            for (const serviceName of order) {
                await this.initializeService(serviceName);
            }

            this.logInitializationComplete();
        } catch (error) {
            ErrorHandler.logError('Critical dependency initialization failure', error);
            throw new Error(`Dependency initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize a specific service and its dependencies
     * @param {string} serviceName - Name of service to initialize
     * @returns {Promise<any>} The initialized service instance
     */
    async initializeService(serviceName) {
        // Return existing instance if already initialized
        if (this.readyServices.has(serviceName)) {
            return window[serviceName];
        }

        // Return ongoing initialization promise if in progress
        if (this.initializationPromises.has(serviceName)) {
            return await this.initializationPromises.get(serviceName);
        }

        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service '${serviceName}' not registered`);
        }

        // Create initialization promise
        const initPromise = this.performServiceInitialization(serviceName, service);
        this.initializationPromises.set(serviceName, initPromise);

        try {
            const instance = await initPromise;
            this.initializationPromises.delete(serviceName);
            return instance;
        } catch (error) {
            this.initializationPromises.delete(serviceName);
            throw error;
        }
    }

    /**
     * Perform the actual service initialization with retry logic
     * @private
     */
    async performServiceInitialization(serviceName, service) {
        // Initialize dependencies first
        for (const depName of service.dependencies) {
            await this.initializeService(depName);
        }

        // Attempt service initialization with retries
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                // Create service instance
                const instance = await this.createServiceInstance(service.factory, serviceName);
                
                // Store instance globally and mark as ready
                window[serviceName] = instance;
                service.instance = instance;
                this.readyServices.add(serviceName);
                
                console.log(`✅ ${serviceName} initialized successfully`);
                return instance;

            } catch (error) {
                lastError = error;
                service.retries++;
                
                if (attempt < this.maxRetries) {
                    console.warn(`⚠️ ${serviceName} initialization failed (attempt ${attempt + 1}), retrying...`);
                    await this.delay(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
                }
            }
        }

        throw new Error(`Failed to initialize ${serviceName} after ${this.maxRetries + 1} attempts: ${lastError.message}`);
    }

    /**
     * Safely create service instance with error handling
     * @private
     */
    async createServiceInstance(factory, serviceName) {
        if (typeof factory !== 'function') {
            throw new Error(`Factory for ${serviceName} must be a function`);
        }

        const instance = factory();
        
        // Handle both sync and async factories
        if (instance && typeof instance.then === 'function') {
            return await instance;
        }
        
        return instance;
    }

    /**
     * Get initialization order using topological sort
     * @private
     * @returns {Array<string>} Ordered array of service names
     */
    getInitializationOrder() {
        const visited = new Set();
        const visiting = new Set();
        const order = [];

        const visit = (serviceName) => {
            if (visiting.has(serviceName)) {
                throw new Error(`Circular dependency detected involving: ${serviceName}`);
            }
            
            if (visited.has(serviceName)) {
                return;
            }

            visiting.add(serviceName);
            
            const service = this.services.get(serviceName);
            if (service) {
                for (const dep of service.dependencies) {
                    if (!this.services.has(dep)) {
                        console.warn(`⚠️ Dependency '${dep}' for '${serviceName}' not registered, skipping...`);
                        continue;
                    }
                    visit(dep);
                }
            }

            visiting.delete(serviceName);
            visited.add(serviceName);
            order.push(serviceName);
        };

        // Visit all registered services
        for (const serviceName of this.services.keys()) {
            visit(serviceName);
        }

        return order;
    }

    /**
     * Check if a service is ready for use
     * @param {string} serviceName - Name of the service
     * @returns {boolean} True if service is initialized and ready
     */
    isServiceReady(serviceName) {
        return this.readyServices.has(serviceName) && window[serviceName] != null;
    }

    /**
     * Get initialization status of all services
     * @returns {Object} Status object with ready/pending/failed services
     */
    getStatus() {
        const ready = Array.from(this.readyServices);
        const pending = [];
        const failed = [];

        for (const [name, service] of this.services.entries()) {
            if (!this.readyServices.has(name)) {
                if (service.retries > 0) {
                    failed.push({ name, retries: service.retries });
                } else {
                    pending.push(name);
                }
            }
        }

        return { ready, pending, failed };
    }

    /**
     * Wait for specific services to be ready
     * @param {Array<string>} serviceNames - Services to wait for
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<void>}
     */
    async waitForServices(serviceNames, timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (serviceNames.every(name => this.isServiceReady(name))) {
                return;
            }
            await this.delay(50);
        }
        
        const notReady = serviceNames.filter(name => !this.isServiceReady(name));
        throw new Error(`Timeout waiting for services: ${notReady.join(', ')}`);
    }

    /**
     * Utility delay function
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Log successful initialization completion
     * @private
     */
    logInitializationComplete() {
        const status = this.getStatus();
        console.log('🚀 Dependency Manager: Initialization Complete');
        console.log(`✅ Ready: ${status.ready.length} services`);
        
        if (status.failed.length > 0) {
            console.warn(`❌ Failed: ${status.failed.length} services`, status.failed);
        }
        
        if (status.pending.length > 0) {
            console.warn(`⏳ Pending: ${status.pending.length} services`, status.pending);
        }
    }
}

// Global instance for use throughout the application
window.dependencyManager = new DependencyManager();