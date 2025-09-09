// ENARM Prep - DOM Sanitization Service for XSS Prevention
class DOMSanitizer {
    constructor() {
        this.allowedTags = new Set([
            // Text formatting
            'p', 'div', 'span', 'br', 'strong', 'b', 'em', 'i', 'u', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
            // Lists
            'ul', 'ol', 'li', 'dl', 'dt', 'dd',
            // Headers
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            // Tables
            'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
            // Medical content specific
            'abbr', 'cite', 'code', 'pre', 'blockquote',
            // Safe interactive elements
            'button', 'label'
        ]);

        this.allowedAttributes = new Map([
            ['*', ['class', 'id', 'data-*', 'aria-*', 'role', 'title']],
            ['a', ['href', 'target', 'rel']],
            ['img', ['src', 'alt', 'width', 'height', 'loading']],
            ['table', ['cellpadding', 'cellspacing', 'border']],
            ['th', ['scope', 'colspan', 'rowspan']],
            ['td', ['colspan', 'rowspan']],
            ['button', ['type', 'disabled']],
            ['label', ['for']]
        ]);

        this.dangerousElements = new Set([
            'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 
            'select', 'option', 'meta', 'link', 'style', 'base', 'applet',
            'audio', 'video', 'source', 'track'
        ]);

        this.dangerousAttributes = new Set([
            'onload', 'onclick', 'onmouseover', 'onmouseout', 'onchange', 'onsubmit',
            'onerror', 'onfocus', 'onblur', 'onkeydown', 'onkeyup', 'onkeypress',
            'javascript:', 'vbscript:', 'data:', 'file:'
        ]);
    }

    /**
     * Main sanitization method - sanitizes HTML content
     * @param {string} html - HTML content to sanitize
     * @param {Object} options - Sanitization options
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(html, options = {}) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        try {
            // Create temporary DOM element for parsing
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Remove dangerous elements first
            this.removeDangerousElements(temp);
            
            // Sanitize all remaining elements
            this.sanitizeElement(temp, options);

            return temp.innerHTML;
        } catch (error) {
            ErrorHandler.logError('DOM Sanitization failed', error);
            // Return empty string on error to prevent XSS
            return '';
        }
    }

    /**
     * Safe method to set HTML content on an element
     * @param {HTMLElement} element - Target element
     * @param {string|number} content - Content to set
     * @param {Object} options - Sanitization options
     */
    safeSetHTML(element, content, options = {}) {
        if (!element || !(element instanceof Element)) {
            ErrorHandler.logError('Invalid element provided to safeSetHTML');
            return;
        }

        if (typeof content === 'string') {
            element.innerHTML = this.sanitizeHTML(content, options);
        } else {
            // For non-string content, use textContent for safety
            element.textContent = String(content);
        }
    }

    /**
     * Safe method to create DOM elements from HTML
     * @param {string} html - HTML to create element from
     * @param {Object} options - Sanitization options
     * @returns {DocumentFragment} Safe document fragment
     */
    createSafeElement(html, options = {}) {
        const sanitizedHTML = this.sanitizeHTML(html, options);
        const template = document.createElement('template');
        template.innerHTML = sanitizedHTML;
        return template.content;
    }

    /**
     * Sanitize text content for safe display
     * @param {string} text - Text content to sanitize
     * @returns {string} Escaped text safe for HTML
     */
    sanitizeText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Sanitize URLs to prevent javascript: and data: schemes
     * @param {string} url - URL to sanitize
     * @returns {string} Safe URL or empty string
     */
    sanitizeURL(url) {
        if (!url || typeof url !== 'string') {
            return '';
        }

        const trimmedURL = url.trim().toLowerCase();
        
        // Block dangerous schemes
        if (trimmedURL.startsWith('javascript:') || 
            trimmedURL.startsWith('vbscript:') || 
            trimmedURL.startsWith('data:') ||
            trimmedURL.startsWith('file:')) {
            return '';
        }

        // Allow relative URLs and safe schemes
        if (trimmedURL.startsWith('/') || 
            trimmedURL.startsWith('./') ||
            trimmedURL.startsWith('../') ||
            trimmedURL.startsWith('http://') ||
            trimmedURL.startsWith('https://') ||
            trimmedURL.startsWith('mailto:') ||
            trimmedURL.startsWith('tel:')) {
            return url.trim();
        }

        // For other cases, assume relative URL
        return url.trim();
    }

    /**
     * Remove dangerous elements from DOM tree
     * @private
     */
    removeDangerousElements(container) {
        this.dangerousElements.forEach(tagName => {
            const elements = container.querySelectorAll(tagName);
            elements.forEach(element => element.remove());
        });
    }

    /**
     * Recursively sanitize DOM element and its children
     * @private
     */
    sanitizeElement(element, options = {}) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        // Check if element is allowed
        if (!this.isElementAllowed(element.tagName.toLowerCase(), options)) {
            // Replace disallowed element with its text content
            const textNode = document.createTextNode(element.textContent || '');
            element.parentNode?.replaceChild(textNode, element);
            return;
        }

        // Sanitize attributes
        this.sanitizeAttributes(element);

        // Recursively sanitize children
        const children = Array.from(element.children);
        children.forEach(child => this.sanitizeElement(child, options));
    }

    /**
     * Check if element tag is allowed
     * @private
     */
    isElementAllowed(tagName, options = {}) {
        if (options.allowedTags) {
            return options.allowedTags.has(tagName);
        }
        return this.allowedTags.has(tagName);
    }

    /**
     * Sanitize element attributes
     * @private
     */
    sanitizeAttributes(element) {
        const tagName = element.tagName.toLowerCase();
        const allowedForTag = this.allowedAttributes.get(tagName) || [];
        const allowedForAll = this.allowedAttributes.get('*') || [];
        const allAllowed = [...allowedForTag, ...allowedForAll];

        // Get all attributes
        const attributes = Array.from(element.attributes);
        
        attributes.forEach(attr => {
            const attrName = attr.name.toLowerCase();
            
            // Check if attribute is explicitly dangerous
            if (this.isDangerousAttribute(attrName, attr.value)) {
                element.removeAttribute(attr.name);
                return;
            }

            // Check if attribute is allowed
            const isAllowed = allAllowed.some(allowed => {
                if (allowed.endsWith('*')) {
                    return attrName.startsWith(allowed.slice(0, -1));
                }
                return attrName === allowed;
            });

            if (!isAllowed) {
                element.removeAttribute(attr.name);
                return;
            }

            // Sanitize attribute value
            if (attrName === 'href' || attrName === 'src') {
                const sanitizedURL = this.sanitizeURL(attr.value);
                if (sanitizedURL !== attr.value) {
                    if (sanitizedURL) {
                        element.setAttribute(attr.name, sanitizedURL);
                    } else {
                        element.removeAttribute(attr.name);
                    }
                }
            }
        });
    }

    /**
     * Check if attribute is dangerous
     * @private
     */
    isDangerousAttribute(attrName, attrValue) {
        // Check dangerous attribute names
        if (this.dangerousAttributes.has(attrName)) {
            return true;
        }

        // Check for event handlers
        if (attrName.startsWith('on')) {
            return true;
        }

        // Check dangerous values
        if (attrValue && typeof attrValue === 'string') {
            const value = attrValue.toLowerCase().trim();
            if (value.includes('javascript:') || 
                value.includes('vbscript:') ||
                value.includes('data:') ||
                value.includes('expression(')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Create safe HTML template for medical questions
     * @param {Object} questionData - Question data object
     * @returns {string} Safe HTML template
     */
    createQuestionTemplate(questionData) {
        const safeData = {
            question: this.sanitizeText(questionData.question || ''),
            explanation: this.sanitizeHTML(questionData.explanation || ''),
            reference: this.sanitizeText(questionData.reference || ''),
            options: {}
        };

        // Sanitize options
        if (questionData.options && typeof questionData.options === 'object') {
            Object.keys(questionData.options).forEach(key => {
                if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
                    safeData.options[key] = this.sanitizeHTML(questionData.options[key]);
                }
            });
        }

        return safeData;
    }

    /**
     * Validate and sanitize user input for forms
     * @param {string} input - User input
     * @param {string} type - Input type (text, email, etc.)
     * @returns {string} Sanitized input
     */
    sanitizeUserInput(input, type = 'text') {
        if (!input || typeof input !== 'string') {
            return '';
        }

        let sanitized = input.trim();

        switch (type) {
            case 'email':
                // Basic email sanitization
                sanitized = sanitized.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
                break;
            case 'name':
                // Allow letters, spaces, hyphens, apostrophes
                sanitized = sanitized.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '');
                break;
            case 'text':
            default:
                // Remove control characters and normalize whitespace
                sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '').replace(/\s+/g, ' ');
                break;
        }

        return sanitized.substring(0, 1000); // Limit length
    }
}

// Global instance for use throughout the application
window.DOMSanitizer = new DOMSanitizer();

// Helper functions for backward compatibility
window.safeSetHTML = (element, content, options) => {
    window.DOMSanitizer.safeSetHTML(element, content, options);
};

window.sanitizeHTML = (html, options) => {
    return window.DOMSanitizer.sanitizeHTML(html, options);
};

window.sanitizeText = (text) => {
    return window.DOMSanitizer.sanitizeText(text);
};