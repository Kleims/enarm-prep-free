// ENARM Prep - Navigation Management Module
class NavigationManager {
    constructor() {
        this.currentPage = AppConstants.PAGES.HOME;
        this.pageHistory = [];
        this.listeners = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.initializeFromURL();
    }

    setupEventListeners() {
        // Navigation clicks
        document.addEventListener('click', (e) => {
            const pageElement = e.target.closest('[data-page]');
            if (pageElement) {
                e.preventDefault();
                const page = pageElement.getAttribute('data-page');
                this.showPage(page);
            }

            const actionElement = e.target.closest('[data-action]');
            if (actionElement) {
                e.preventDefault();
                const action = actionElement.getAttribute('data-action');
                this.handleAction(action);
            }
        });

        // Mobile navigation hamburger
        const navHamburger = document.getElementById('nav-hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        if (navHamburger && navMenu) {
            navHamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMobileMenu();
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (navMenu.classList.contains('active') && 
                    !navMenu.contains(e.target) && 
                    !navHamburger.contains(e.target)) {
                    this.closeMobileMenu();
                }
            });
        }

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page, false);
            }
        });

        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.notifyListeners('page-visible', this.currentPage);
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case '1':
                        e.preventDefault();
                        this.showPage(AppConstants.PAGES.HOME);
                        break;
                    case '2':
                        e.preventDefault();
                        this.showPage(AppConstants.PAGES.PRACTICE);
                        break;
                    case '3':
                        e.preventDefault();
                        this.showPage(AppConstants.PAGES.PROGRESS);
                        break;
                    case '4':
                        e.preventDefault();
                        this.showPage(AppConstants.PAGES.STUDY_GUIDES);
                        break;
                    case '5':
                        e.preventDefault();
                        this.showPage(AppConstants.PAGES.FLASHCARDS);
                        break;
                }
            }

            // Escape key to close mobile menu
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    initializeFromURL() {
        const urlParams = CommonUtils.parseQueryParams();
        const page = urlParams.page || AppConstants.PAGES.HOME;
        
        if (Object.values(AppConstants.PAGES).includes(page)) {
            this.showPage(page, false);
        } else {
            this.showPage(AppConstants.PAGES.HOME, false);
        }
    }

    showPage(pageId, updateHistory = true) {
        if (!Object.values(AppConstants.PAGES).includes(pageId)) {
            console.warn(`Invalid page: ${pageId}`);
            return false;
        }

        // Store previous page
        const previousPage = this.currentPage;
        
        // Update navigation state
        this.updateNavigationLinks(pageId);
        
        // Hide all pages
        this.hideAllPages();
        
        // Show target page
        const success = this.showTargetPage(pageId);
        
        if (success) {
            this.currentPage = pageId;
            this.closeMobileMenu();
            
            // Update browser history
            if (updateHistory) {
                this.updateBrowserHistory(pageId);
            }
            
            // Track page history
            this.pageHistory.push({
                page: pageId,
                timestamp: new Date(),
                previousPage
            });
            
            // Limit history size
            if (this.pageHistory.length > 50) {
                this.pageHistory = this.pageHistory.slice(-50);
            }
            
            // Initialize page-specific functionality
            this.initializePage(pageId);
            
            // Notify listeners
            this.notifyListeners('page-change', {
                current: pageId,
                previous: previousPage
            });
            
            return true;
        }
        
        return false;
    }

    updateNavigationLinks(activePageId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeNavLink = document.querySelector(`[data-page="${activePageId}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }
    }

    hideAllPages() {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
            page.style.display = 'none';
        });
    }

    showTargetPage(pageId) {
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
            targetPage.classList.add('active');
            
            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            return true;
        } else {
            console.error(`Page element not found: ${pageId}-page`);
            return false;
        }
    }

    initializePage(pageId) {
        // Dispatch custom event for page initialization
        const event = new CustomEvent('pageInit', {
            detail: { page: pageId }
        });
        document.dispatchEvent(event);

        // Page-specific initialization
        switch (pageId) {
            case AppConstants.PAGES.HOME:
                this.initializeHomePage();
                break;
            case AppConstants.PAGES.PRACTICE:
                this.initializePracticePage();
                break;
            case AppConstants.PAGES.PROGRESS:
                this.initializeProgressPage();
                break;
            case AppConstants.PAGES.STUDY_GUIDES:
                this.initializeStudyGuidesPage();
                break;
            case AppConstants.PAGES.FLASHCARDS:
                this.initializeFlashcardsPage();
                break;
        }
    }

    initializeHomePage() {
        // Update home page stats
        const event = new CustomEvent('updateHomeStats');
        document.dispatchEvent(event);
    }

    initializePracticePage() {
        // Initialize practice interface
        const event = new CustomEvent('initPractice');
        document.dispatchEvent(event);
    }

    initializeProgressPage() {
        // Initialize progress charts and stats
        const event = new CustomEvent('initProgress');
        document.dispatchEvent(event);
    }

    initializeStudyGuidesPage() {
        // Initialize study guides
        const event = new CustomEvent('initStudyGuides');
        document.dispatchEvent(event);
    }

    initializeFlashcardsPage() {
        // Initialize flashcards
        const event = new CustomEvent('initFlashcards');
        document.dispatchEvent(event);
    }

    handleAction(action) {
        const actions = {
            'start-practice': () => {
                this.showPage(AppConstants.PAGES.PRACTICE);
                setTimeout(() => {
                    const event = new CustomEvent('startPracticeSession');
                    document.dispatchEvent(event);
                }, 100);
            },
            'view-progress': () => {
                this.showPage(AppConstants.PAGES.PROGRESS);
            },
            'open-study-guides': () => {
                this.showPage(AppConstants.PAGES.STUDY_GUIDES);
            },
            'open-flashcards': () => {
                this.showPage(AppConstants.PAGES.FLASHCARDS);
            }
        };

        if (actions[action]) {
            actions[action]();
        } else {
            console.warn(`Unknown action: ${action}`);
        }
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navHamburger = document.getElementById('nav-hamburger');

        if (navMenu && navHamburger) {
            const isActive = navMenu.classList.contains('active');
            
            if (isActive) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    openMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navHamburger = document.getElementById('nav-hamburger');

        if (navMenu && navHamburger) {
            navMenu.classList.add('active');
            navHamburger.classList.add('active');
            document.body.classList.add('mobile-menu-open');
            
            this.notifyListeners('mobile-menu-open');
        }
    }

    closeMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navHamburger = document.getElementById('nav-hamburger');

        if (navMenu && navHamburger) {
            navMenu.classList.remove('active');
            navHamburger.classList.remove('active');
            document.body.classList.remove('mobile-menu-open');
            
            this.notifyListeners('mobile-menu-close');
        }
    }

    updateBrowserHistory(pageId) {
        const url = new URL(window.location);
        url.searchParams.set('page', pageId);
        
        window.history.pushState(
            { page: pageId },
            document.title,
            url.toString()
        );
    }

    getCurrentPage() {
        return this.currentPage;
    }

    getPreviousPage() {
        const history = this.pageHistory;
        return history.length > 1 ? history[history.length - 2].page : null;
    }

    goBack() {
        const previousPage = this.getPreviousPage();
        if (previousPage) {
            this.showPage(previousPage);
        } else if (window.history.length > 1) {
            window.history.back();
        }
    }

    getPageHistory() {
        return [...this.pageHistory];
    }

    clearHistory() {
        this.pageHistory = [];
    }

    addNavigationListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    removeNavigationListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback({ event, data });
            } catch (error) {
                console.error('Error in navigation listener:', error);
            }
        });
    }

    isPageActive(pageId) {
        return this.currentPage === pageId;
    }

    getPageElement(pageId) {
        return document.getElementById(`${pageId}-page`);
    }

    scrollToElement(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            CommonUtils.smoothScrollTo(element, offset);
        }
    }
}

// Create singleton instance
const navigationManager = new NavigationManager();

// Export as global
window.NavigationManager = navigationManager;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = navigationManager;
}