class FreemiumManager {
    constructor() {
        this.dailyUsage = this.loadDailyUsage();
        this.premiumStatus = this.loadPremiumStatus();
    }

    loadDailyUsage() {
        if (typeof StorageService === 'undefined') {
            return { date: new Date().toDateString(), examsCompleted: 0, questionsAnswered: 0 };
        }
        
        const stored = StorageService.getItem(AppConstants.STORAGE_KEYS.DAILY_USAGE);
        const today = new Date().toDateString();
        
        if (!stored || stored.date !== today) {
            const newUsage = {
                date: today,
                examsCompleted: 0,
                questionsAnswered: 0
            };
            StorageService.setItem(AppConstants.STORAGE_KEYS.DAILY_USAGE, newUsage);
            return newUsage;
        }
        
        return stored;
    }

    loadPremiumStatus() {
        if (typeof StorageService === 'undefined') {
            return { isPremium: false, expiryDate: null, licenseKey: null };
        }
        
        return StorageService.getItem(AppConstants.STORAGE_KEYS.PREMIUM_STATUS) || {
            isPremium: false,
            expiryDate: null,
            licenseKey: null
        };
    }

    isPremiumUser() {
        if (!this.premiumStatus.isPremium) return false;
        
        if (this.premiumStatus.expiryDate) {
            const expiry = new Date(this.premiumStatus.expiryDate);
            const now = new Date();
            return expiry > now;
        }
        
        return false;
    }

    canStartExam() {
        if (this.isPremiumUser()) return true;
        return this.dailyUsage.examsCompleted < AppConstants.FREEMIUM.DAILY_EXAM_LIMIT;
    }

    incrementExamCount() {
        this.dailyUsage.examsCompleted++;
        if (typeof StorageService !== 'undefined') {
            StorageService.setItem(AppConstants.STORAGE_KEYS.DAILY_USAGE, this.dailyUsage);
        }
    }

    incrementQuestionCount() {
        this.dailyUsage.questionsAnswered++;
        if (typeof StorageService !== 'undefined') {
            StorageService.setItem(AppConstants.STORAGE_KEYS.DAILY_USAGE, this.dailyUsage);
        }
    }

    getRemainingExams() {
        if (this.isPremiumUser()) return 'Ilimitado';
        return Math.max(0, AppConstants.FREEMIUM.DAILY_EXAM_LIMIT - this.dailyUsage.examsCompleted);
    }

    showUpgradeModal(reason = 'general') {
        const modal = document.getElementById('upgrade-modal') || this.createUpgradeModal();
        const reasonText = this.getUpgradeReasonText(reason);
        
        modal.querySelector('.upgrade-reason').textContent = reasonText;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    getUpgradeReasonText(reason) {
        const reasons = {
            'daily-limit': '¡Has usado tu examen gratuito de hoy!',
            'premium-feature': 'Esta función está disponible para usuarios Premium',
            'analytics': 'Accede a análisis detallados con Premium',
            'general': 'Desbloquea todas las funciones'
        };
        return reasons[reason] || reasons['general'];
    }

    createUpgradeModal() {
        const modalHTML = `
            <div id="upgrade-modal" class="modal">
                <div class="modal-content upgrade-modal-content">
                    <button class="modal-close" onclick="FreemiumManager.closeUpgradeModal()">&times;</button>
                    
                    <div class="upgrade-header">
                        <h2>🚀 ¡Actualiza a Premium!</h2>
                        <p class="upgrade-reason">Desbloquea todas las funciones</p>
                    </div>

                    <div class="pricing-comparison">
                        <div class="plan-card free-plan">
                            <h3>Plan Gratuito</h3>
                            <div class="plan-price">$0</div>
                            <ul class="plan-features">
                                <li>✅ 1 examen por día</li>
                                <li>✅ 50 preguntas de práctica</li>
                                <li>✅ Progreso básico</li>
                                <li>❌ Análisis avanzado</li>
                                <li>❌ Exámenes ilimitados</li>
                                <li>❌ Banco completo</li>
                            </ul>
                        </div>
                        
                        <div class="plan-card premium-plan featured">
                            <div class="plan-badge">¡Popular!</div>
                            <h3>Plan Premium</h3>
                            <div class="plan-price">
                                $299 <span class="plan-period">MXN/mes</span>
                            </div>
                            <div class="savings-badge">¡El mejor valor!</div>
                            <ul class="plan-features">
                                <li>✅ Exámenes ilimitados</li>
                                <li>✅ 1000+ preguntas</li>
                                <li>✅ Análisis avanzado</li>
                                <li>✅ Seguimiento extendido</li>
                                <li>✅ Simulaciones por especialidad</li>
                                <li>✅ Soporte prioritario</li>
                            </ul>
                            <button class="btn btn-primary btn-upgrade" onclick="FreemiumManager.redirectToPayment()">
                                🚀 Actualizar Ahora
                            </button>
                        </div>
                    </div>

                    <div class="upgrade-testimonials">
                        <div class="testimonial">
                            <p>"Con Premium aumenté mi puntaje 40% en 2 meses"</p>
                            <cite>- Dr. María G.</cite>
                        </div>
                    </div>

                    <div class="upgrade-footer">
                        <p class="money-back">💰 30 días de garantía o tu dinero de vuelta</p>
                        <p class="subscription-info">
                            Cancela en cualquier momento. Sin compromisos a largo plazo.
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        return document.getElementById('upgrade-modal');
    }

    static closeUpgradeModal() {
        const modal = document.getElementById('upgrade-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    static redirectToPayment() {
        // For now, show alert - later replace with actual payment link
        alert('Redirigiendo a la página de pago... 🚀\n\n' +
              'En desarrollo: Se integrará con Stripe/PayPal para procesamiento seguro.');
        
        // Future implementation:
        // window.open('https://buy.stripe.com/your-payment-link', '_blank');
        
        this.closeUpgradeModal();
    }

    addPremiumBadges() {
        // Add "Premium" badges to locked features
        const premiumFeatures = document.querySelectorAll('.premium-feature');
        premiumFeatures.forEach(feature => {
            if (!feature.querySelector('.premium-badge')) {
                const badge = document.createElement('span');
                badge.className = 'premium-badge';
                badge.textContent = '👑 Premium';
                feature.appendChild(badge);
            }
        });
    }

    showUsageStats() {
        const statsContainer = document.querySelector('.daily-stats');
        if (statsContainer) {
            const remaining = this.getRemainingExams();
            statsContainer.innerHTML = `
                <div class="usage-stat">
                    <span class="stat-label">Exámenes restantes hoy:</span>
                    <span class="stat-value ${remaining === 0 ? 'text-warning' : ''}">${remaining}</span>
                </div>
                <div class="usage-stat">
                    <span class="stat-label">Preguntas respondidas:</span>
                    <span class="stat-value">${this.dailyUsage.questionsAnswered}</span>
                </div>
            `;
        }
    }

    init() {
        this.addPremiumBadges();
        this.showUsageStats();
        
        // Add event listeners for premium feature attempts
        document.addEventListener('click', (e) => {
            if (e.target.closest('.premium-feature') && !this.isPremiumUser()) {
                e.preventDefault();
                this.showUpgradeModal('premium-feature');
            }
        });
    }
}

// Global instance
window.FreemiumManager = FreemiumManager;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FreemiumManager;
}