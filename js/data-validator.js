// ENARM Prep - Data Validation and Sanitization Service
class DataValidator {
    constructor() {
        this.schemas = this.initializeSchemas();
        this.init();
    }

    init() {
        // Override dangerous DOM methods with safe alternatives
        this.setupSafeDOMOperations();
    }

    initializeSchemas() {
        return {
            question: {
                id: { type: 'string', required: true, pattern: /^[a-zA-Z0-9_-]+$/ },
                category: { type: 'string', required: true, enum: AppConstants.CATEGORIES },
                difficulty: { type: 'string', required: true, enum: AppConstants.QUESTION.DIFFICULTIES },
                question: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
                options: { 
                    type: 'object', 
                    required: true,
                    properties: {
                        A: { type: 'string', required: true, maxLength: AppConstants.QUESTION.MAX_OPTION_LENGTH },
                        B: { type: 'string', required: true, maxLength: AppConstants.QUESTION.MAX_OPTION_LENGTH },
                        C: { type: 'string', required: true, maxLength: AppConstants.QUESTION.MAX_OPTION_LENGTH },
                        D: { type: 'string', required: true, maxLength: AppConstants.QUESTION.MAX_OPTION_LENGTH },
                        E: { type: 'string', required: false, maxLength: AppConstants.QUESTION.MAX_OPTION_LENGTH }
                    }
                },
                correct: { type: 'string', required: true, enum: ['A', 'B', 'C', 'D', 'E'] },
                explanation: { type: 'string', required: true, maxLength: AppConstants.QUESTION.MAX_EXPLANATION_LENGTH },
                reference: { type: 'string', required: false, maxLength: 200 }
            },
            sessionConfig: {
                mode: { type: 'string', required: true, enum: Object.values(AppConstants.PRACTICE_MODES) },
                specialty: { type: 'string', required: false, enum: ['', ...AppConstants.CATEGORIES] },
                difficulty: { type: 'string', required: false, enum: ['', ...AppConstants.QUESTION.DIFFICULTIES] },
                questionsCount: { type: 'number', required: true, min: 1, max: 500 },
                timeLimit: { type: 'number', required: false, min: 0, max: 36000 }
            },
            progress: {
                answers: { type: 'array', required: false, maxItems: 10000 },
                categories: { type: 'object', required: false },
                sessions: { type: 'array', required: false, maxItems: 100 },
                bookmarks: { type: 'array', required: false, maxItems: 500 }
            },
            userInput: {
                email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxLength: 100 },
                name: { type: 'string', pattern: /^[a-zA-ZÀ-ÿ\s'-]{1,50}$/, maxLength: 50 },
                answer: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E'] }
            }
        };
    }

    // HTML Sanitization
    sanitizeHTML(input) {
        if (typeof input !== 'string') return '';
        
        // Create a temporary div element
        const temp = document.createElement('div');
        temp.textContent = input; // Using textContent prevents script execution
        
        // Allow only safe tags
        const safeTags = ['b', 'i', 'em', 'strong', 'br', 'p', 'span'];
        const sanitized = temp.innerHTML
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
            .replace(/on\w+\s*=\s*'[^']*'/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/data:/gi, '');
        
        return sanitized;
    }

    // Text sanitization for display
    sanitizeText(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Validate against schema
    validate(data, schemaName) {
        const schema = this.schemas[schemaName];
        if (!schema) {
            throw new Error(`Schema '${schemaName}' not found`);
        }

        const errors = [];
        const validated = this.validateObject(data, schema, '', errors);
        
        return {
            valid: errors.length === 0,
            errors,
            data: validated
        };
    }

    validateObject(data, schema, path = '', errors = []) {
        const validated = {};

        // Check if data is null or undefined
        if (data === null || data === undefined) {
            if (schema.required) {
                errors.push(`${path || 'Data'} is required`);
            }
            return null;
        }

        // For object schemas with properties
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                const value = data[key];
                const propPath = path ? `${path}.${key}` : key;
                
                if (value === undefined && propSchema.required) {
                    errors.push(`${propPath} is required`);
                    continue;
                }
                
                if (value !== undefined) {
                    validated[key] = this.validateField(value, propSchema, propPath, errors);
                }
            }
        } else {
            // Single field validation
            return this.validateField(data, schema, path, errors);
        }

        return validated;
    }

    validateField(value, schema, path, errors) {
        // Type validation
        if (schema.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== schema.type) {
                errors.push(`${path} must be of type ${schema.type}`);
                return value;
            }
        }

        // String validations
        if (schema.type === 'string') {
            if (schema.minLength && value.length < schema.minLength) {
                errors.push(`${path} must be at least ${schema.minLength} characters`);
            }
            if (schema.maxLength && value.length > schema.maxLength) {
                errors.push(`${path} must be at most ${schema.maxLength} characters`);
            }
            if (schema.pattern && !schema.pattern.test(value)) {
                errors.push(`${path} has invalid format`);
            }
            if (schema.enum && !schema.enum.includes(value)) {
                errors.push(`${path} must be one of: ${schema.enum.join(', ')}`);
            }
            // Sanitize string values
            return this.sanitizeText(value);
        }

        // Number validations
        if (schema.type === 'number') {
            if (schema.min !== undefined && value < schema.min) {
                errors.push(`${path} must be at least ${schema.min}`);
            }
            if (schema.max !== undefined && value > schema.max) {
                errors.push(`${path} must be at most ${schema.max}`);
            }
            return value;
        }

        // Array validations
        if (schema.type === 'array') {
            if (schema.maxItems && value.length > schema.maxItems) {
                errors.push(`${path} must have at most ${schema.maxItems} items`);
            }
            if (schema.minItems && value.length < schema.minItems) {
                errors.push(`${path} must have at least ${schema.minItems} items`);
            }
            return value;
        }

        // Object validations
        if (schema.type === 'object' && schema.properties) {
            return this.validateObject(value, schema, path, errors);
        }

        return value;
    }

    // Question validation
    validateQuestion(question) {
        const result = this.validate(question, 'question');
        
        // Additional business logic validations
        if (result.valid) {
            // Ensure correct answer exists in options
            if (!question.options[question.correct]) {
                result.valid = false;
                result.errors.push('Correct answer must exist in options');
            }
            
            // Ensure at least 2 options
            const optionCount = Object.keys(question.options).filter(key => question.options[key]).length;
            if (optionCount < 2) {
                result.valid = false;
                result.errors.push('Question must have at least 2 options');
            }
        }
        
        return result;
    }

    // Session configuration validation
    validateSessionConfig(config) {
        return this.validate(config, 'sessionConfig');
    }

    // Progress data validation
    validateProgress(progress) {
        const result = this.validate(progress, 'progress');
        
        // Additional validation for data integrity
        if (result.valid && progress.sessions) {
            // Check for data consistency
            const totalQuestions = progress.answers ? progress.answers.length : 0;
            const sessionQuestions = progress.sessions.reduce((sum, s) => 
                sum + (s.summary?.totalQuestions || 0), 0
            );
            
            if (Math.abs(totalQuestions - sessionQuestions) > 100) {
                console.warn('Progress data may be inconsistent');
            }
        }
        
        return result;
    }

    // User input validation
    validateUserInput(input, type) {
        const schema = this.schemas.userInput[type];
        if (!schema) {
            return { valid: false, errors: [`Unknown input type: ${type}`] };
        }
        
        return this.validateField(input, schema, type, []);
    }

    // Safe DOM operations
    setupSafeDOMOperations() {
        // Create safe wrapper for setting text content
        window.safeSetText = (element, text) => {
            if (element && typeof text === 'string') {
                element.textContent = text; // Always safe
            }
        };

        // Create safe wrapper for setting HTML (when absolutely necessary)
        window.safeSetHTML = (element, html) => {
            if (element && typeof html === 'string') {
                const sanitized = this.sanitizeHTML(html);
                element.innerHTML = sanitized;
            }
        };

        // Safe attribute setting
        window.safeSetAttribute = (element, attribute, value) => {
            const dangerousAttributes = ['onclick', 'onerror', 'onload', 'onmouseover'];
            if (element && !dangerousAttributes.includes(attribute.toLowerCase())) {
                element.setAttribute(attribute, this.sanitizeText(value));
            }
        };
    }

    // Validate storage data before saving
    validateStorageData(key, data) {
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        const serialized = JSON.stringify(data);
        
        if (serialized.length > maxSize) {
            return {
                valid: false,
                errors: [`Data size exceeds storage limit (${(serialized.length / 1024 / 1024).toFixed(2)}MB > 5MB)`]
            };
        }
        
        // Check for circular references
        try {
            JSON.parse(serialized);
        } catch (error) {
            return {
                valid: false,
                errors: ['Data contains circular references or is not serializable']
            };
        }
        
        return { valid: true, errors: [] };
    }

    // Sanitize data before storage
    sanitizeForStorage(data) {
        // Remove any functions or undefined values
        return JSON.parse(JSON.stringify(data, (key, value) => {
            if (typeof value === 'function' || value === undefined) {
                return null;
            }
            if (typeof value === 'string') {
                return this.sanitizeText(value);
            }
            return value;
        }));
    }

    // Validate and clean question bank
    validateQuestionBank(questions) {
        const validQuestions = [];
        const invalidQuestions = [];
        
        questions.forEach((question, index) => {
            const result = this.validateQuestion(question);
            if (result.valid) {
                validQuestions.push(result.data);
            } else {
                invalidQuestions.push({
                    index,
                    question,
                    errors: result.errors
                });
            }
        });
        
        if (invalidQuestions.length > 0) {
            console.warn(`Found ${invalidQuestions.length} invalid questions:`, invalidQuestions);
        }
        
        return {
            valid: validQuestions,
            invalid: invalidQuestions,
            stats: {
                total: questions.length,
                valid: validQuestions.length,
                invalid: invalidQuestions.length
            }
        };
    }

    // Batch validation for performance
    validateBatch(items, schemaName) {
        const results = {
            valid: [],
            invalid: [],
            errors: []
        };
        
        items.forEach((item, index) => {
            const result = this.validate(item, schemaName);
            if (result.valid) {
                results.valid.push(result.data);
            } else {
                results.invalid.push({ index, item, errors: result.errors });
                results.errors.push(...result.errors.map(e => `Item ${index}: ${e}`));
            }
        });
        
        return results;
    }
}

// Create singleton instance
const dataValidator = new DataValidator();

// Export as global
window.DataValidator = dataValidator;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dataValidator;
}