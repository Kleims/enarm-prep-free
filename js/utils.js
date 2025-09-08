// ENARM Prep - Utility Functions
class ENARMUtils {
    constructor() {
        this.init();
    }

    init() {
        this.setupFlashcards();
        this.setupStudyGuides();
        this.setupMedicalCalculators();
    }

    // Flashcard System
    setupFlashcards() {
        this.flashcards = this.getDefaultFlashcards();
        this.currentFlashcard = 0;
        this.isFlipped = false;
        
        this.initializeFlashcardEvents();
    }

    getDefaultFlashcards() {
        return [
            {
                id: 'fc001',
                category: 'cardiologia',
                front: '¿Cuál es la principal causa de insuficiencia cardíaca?',
                back: 'Enfermedad Coronaria',
                explanation: 'La enfermedad arterial coronaria es responsable del 60-70% de los casos de insuficiencia cardíaca, seguida por la hipertensión arterial.',
                difficulty: 'intermedio'
            },
            {
                id: 'fc002',
                category: 'neurologia',
                front: '¿Cuál es el signo de Babinski?',
                back: 'Extensión del dedo gordo del pie al estimular la planta',
                explanation: 'El signo de Babinski positivo indica lesión de la neurona motora superior (tracto corticoespinal).',
                difficulty: 'basico'
            },
            {
                id: 'fc003',
                category: 'gastroenterologia',
                front: '¿Cuál es la triada de Whipple?',
                back: 'Síntomas de hipoglucemia + glucosa baja + alivio con glucosa',
                explanation: 'Utilizada para el diagnóstico de insulinoma y otras causas de hipoglucemia.',
                difficulty: 'avanzado'
            },
            {
                id: 'fc004',
                category: 'cardiologia',
                front: '¿Qué indica un QRS > 120 ms?',
                back: 'Bloqueo de rama o trastorno de conducción intraventricular',
                explanation: 'Un QRS ancho puede indicar bloqueo de rama derecha, izquierda o trastornos de conducción.',
                difficulty: 'intermedio'
            },
            {
                id: 'fc005',
                category: 'neurologia',
                front: '¿Cuál es la tríada de Parkinson?',
                back: 'Temblor + rigidez + bradicinesia',
                explanation: 'Los tres síntomas cardinales de la enfermedad de Parkinson. La inestabilidad postural aparece más tarde.',
                difficulty: 'basico'
            },
            {
                id: 'fc006',
                category: 'endocrinologia',
                front: '¿Cuáles son las 4 Ps de la diabetes?',
                back: 'Poliuria, polidipsia, polifagia, pérdida de peso',
                explanation: 'Los síntomas clásicos de la diabetes mellitus tipo 1 de inicio agudo.',
                difficulty: 'basico'
            },
            {
                id: 'fc007',
                category: 'gastroenterologia',
                front: '¿Qué es el signo de Murphy?',
                back: 'Dolor en hipocondrio derecho que interrumpe la inspiración profunda',
                explanation: 'Indica inflamación de la vesícula biliar (colecistitis aguda). Positivo en 97% de casos.',
                difficulty: 'intermedio'
            },
            {
                id: 'fc008',
                category: 'cardiologia',
                front: '¿Cuál es la presión de pulso normal?',
                back: '40 mmHg (diferencia entre sistólica y diastólica)',
                explanation: 'Presión de pulso = PAS - PAD. Valores > 60 mmHg indican rigidez arterial.',
                difficulty: 'intermedio'
            },
            {
                id: 'fc009',
                category: 'neurologia',
                front: '¿Cuál es el reflejo de Hoffman?',
                back: 'Flexión del pulgar al percutir la uña del dedo medio',
                explanation: 'Indica lesión de neurona motora superior en miembros superiores.',
                difficulty: 'avanzado'
            },
            {
                id: 'fc010',
                category: 'endocrinologia',
                front: '¿Cuál es el valor normal de HbA1c?',
                back: '< 5.7%',
                explanation: 'Normal: < 5.7%, Prediabetes: 5.7-6.4%, Diabetes: ≥ 6.5%',
                difficulty: 'basico'
            }
        ];
    }

    initializeFlashcardEvents() {
        const startFlashcards = document.getElementById('start-flashcards');
        const flipCard = document.getElementById('flip-card');
        const cardEasy = document.getElementById('card-easy');
        const cardMedium = document.getElementById('card-medium');
        const cardDifficult = document.getElementById('card-difficult');

        if (startFlashcards) {
            startFlashcards.addEventListener('click', () => this.startFlashcards());
        }
        
        if (flipCard) {
            flipCard.addEventListener('click', () => this.flipFlashcard());
        }
        
        if (cardEasy) {
            cardEasy.addEventListener('click', () => this.rateFlashcard('easy'));
        }
        
        if (cardMedium) {
            cardMedium.addEventListener('click', () => this.rateFlashcard('medium'));
        }
        
        if (cardDifficult) {
            cardDifficult.addEventListener('click', () => this.rateFlashcard('difficult'));
        }
    }

    startFlashcards() {
        const category = document.getElementById('flashcard-category')?.value || 'all';
        let filteredCards = [...this.flashcards];
        
        if (category !== 'all') {
            filteredCards = this.flashcards.filter(card => card.category === category);
        }
        
        if (filteredCards.length === 0) {
            this.showMessage('No hay flashcards disponibles para esta categoría.');
            return;
        }
        
        this.currentFlashcards = this.shuffleArray(filteredCards);
        this.currentFlashcard = 0;
        this.isFlipped = false;
        
        this.showFlashcard(this.currentFlashcards[0]);
        
        const container = document.getElementById('flashcard-container');
        if (container) {
            container.style.display = 'block';
        }
    }

    showFlashcard(card) {
        if (!card) return;
        
        const flashcardElement = document.getElementById('flashcard');
        const frontElement = flashcardElement?.querySelector('.flashcard-front h3');
        const backTitleElement = flashcardElement?.querySelector('.flashcard-back h3');
        const backTextElement = flashcardElement?.querySelector('.flashcard-back p');
        
        if (frontElement) {
            frontElement.textContent = card.front;
        }
        
        if (backTitleElement) {
            backTitleElement.textContent = card.back;
        }
        
        if (backTextElement) {
            backTextElement.textContent = card.explanation;
        }
        
        // Reset flip state
        this.isFlipped = false;
        if (flashcardElement) {
            flashcardElement.classList.remove('flipped');
        }
        
        this.updateFlipButton();
    }

    flipFlashcard() {
        const flashcardElement = document.getElementById('flashcard');
        if (!flashcardElement) return;
        
        this.isFlipped = !this.isFlipped;
        flashcardElement.classList.toggle('flipped', this.isFlipped);
        this.updateFlipButton();
    }

    updateFlipButton() {
        const flipButton = document.getElementById('flip-card');
        if (flipButton) {
            flipButton.textContent = this.isFlipped ? 'Ver Pregunta' : 'Ver Respuesta';
        }
    }

    rateFlashcard(difficulty) {
        const current = this.currentFlashcards[this.currentFlashcard];
        
        // Save rating for spaced repetition algorithm
        this.saveFlashcardRating(current.id, difficulty);
        
        // Move to next card
        this.currentFlashcard++;
        
        if (this.currentFlashcard < this.currentFlashcards.length) {
            this.showFlashcard(this.currentFlashcards[this.currentFlashcard]);
        } else {
            this.endFlashcardSession();
        }
    }

    saveFlashcardRating(cardId, difficulty) {
        const ratings = JSON.parse(localStorage.getItem('enarm-flashcard-ratings') || '{}');
        
        if (!ratings[cardId]) {
            ratings[cardId] = {
                reviews: 0,
                averageDifficulty: 0,
                lastReview: null,
                nextReview: null
            };
        }
        
        const rating = ratings[cardId];
        rating.reviews++;
        rating.lastReview = new Date().toISOString();
        
        // Simple spaced repetition: easy = 3 days, medium = 1 day, difficult = immediate
        const nextReviewDays = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 1 : 0;
        rating.nextReview = new Date(Date.now() + nextReviewDays * 24 * 60 * 60 * 1000).toISOString();
        
        localStorage.setItem('enarm-flashcard-ratings', JSON.stringify(ratings));
    }

    endFlashcardSession() {
        this.showMessage('¡Sesión de flashcards completada!', 'success');
        
        const container = document.getElementById('flashcard-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    // Study Guides System
    setupStudyGuides() {
        this.studyGuides = this.getDefaultStudyGuides();
        this.initializeStudyGuideEvents();
    }

    getDefaultStudyGuides() {
        return {
            cardiologia: {
                title: 'Cardiología Esencial',
                sections: [
                    {
                        title: 'Insuficiencia Cardíaca',
                        content: `
                            <h4>Definición:</h4>
                            <p>Síndrome clínico caracterizado por síntomas y signos de congestión o hipoperfusión.</p>
                            
                            <h4>Clasificación NYHA:</h4>
                            <ul>
                                <li><strong>Clase I:</strong> Sin limitación de actividad física</li>
                                <li><strong>Clase II:</strong> Limitación ligera de actividad física</li>
                                <li><strong>Clase III:</strong> Limitación marcada de actividad física</li>
                                <li><strong>Clase IV:</strong> Incapacidad para realizar actividad física sin molestias</li>
                            </ul>
                            
                            <h4>Tratamiento FE reducida:</h4>
                            <ul>
                                <li>IECA/ARA II</li>
                                <li>Beta bloqueadores</li>
                                <li>Diuréticos</li>
                                <li>Espironolactona (si persisten síntomas)</li>
                            </ul>
                        `
                    },
                    {
                        title: 'Síndrome Coronario Agudo',
                        content: `
                            <h4>Clasificación:</h4>
                            <ul>
                                <li><strong>STEMI:</strong> Elevación del ST</li>
                                <li><strong>NSTEMI:</strong> Sin elevación del ST con troponinas positivas</li>
                                <li><strong>Angina inestable:</strong> Sin elevación del ST, troponinas negativas</li>
                            </ul>
                            
                            <h4>Tratamiento STEMI:</h4>
                            <ul>
                                <li>Reperfusión urgente (&lt; 12 horas)</li>
                                <li>ICP primaria (gold standard)</li>
                                <li>Trombolisis si no hay ICP disponible</li>
                                <li>Doble antiagregación</li>
                                <li>Anticoagulación</li>
                            </ul>
                        `
                    }
                ]
            },
            neurologia: {
                title: 'Neurología Clínica',
                sections: [
                    {
                        title: 'Accidente Cerebrovascular',
                        content: `
                            <h4>Tipos:</h4>
                            <ul>
                                <li><strong>Isquémico (87%):</strong> Trombótico, embólico</li>
                                <li><strong>Hemorrágico (13%):</strong> Intraparenquimatoso, subaracnoideo</li>
                            </ul>
                            
                            <h4>Ventana terapéutica:</h4>
                            <ul>
                                <li>Alteplase IV: &lt; 4.5 horas</li>
                                <li>Trombectomía: &lt; 6-24 horas (casos seleccionados)</li>
                            </ul>
                            
                            <h4>Contraindicaciones trombolisis:</h4>
                            <ul>
                                <li>Hemorragia intracraneal previa</li>
                                <li>Cirugía mayor reciente</li>
                                <li>Trauma craneal en 3 meses</li>
                                <li>PAS &gt; 185 o PAD &gt; 110 mmHg</li>
                            </ul>
                        `
                    }
                ]
            }
        };
    }

    initializeStudyGuideEvents() {
        document.querySelectorAll('.study-guide-card .btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const card = e.target.closest('.study-guide-card');
                const guideIcon = card.querySelector('.guide-icon').textContent;
                
                // Determine guide type from icon
                let guideType = '';
                if (guideIcon === '🫀') guideType = 'cardiologia';
                else if (guideIcon === '🧠') guideType = 'neurologia';
                
                this.showStudyGuide(guideType);
            });
        });
    }

    showStudyGuide(guideType) {
        const guide = this.studyGuides[guideType];
        if (!guide) return;
        
        // Create modal or navigate to detailed view
        this.createStudyGuideModal(guide);
    }

    createStudyGuideModal(guide) {
        const modal = document.createElement('div');
        modal.className = 'study-guide-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${guide.title}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${guide.sections.map(section => `
                            <div class="guide-section">
                                <h3>${section.title}</h3>
                                <div class="guide-content">${section.content}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.cssText = `
            background: var(--background-primary);
            border-radius: 12px;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        `;
        
        const modalHeader = modal.querySelector('.modal-header');
        modalHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-color);
        `;
        
        const modalBody = modal.querySelector('.modal-body');
        modalBody.style.cssText = `
            padding: 1.5rem;
            color: var(--text-primary);
        `;
        
        const closeButton = modal.querySelector('.modal-close');
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: var(--text-secondary);
        `;
        
        // Close modal events
        closeButton.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') modal.remove();
        });
        
        document.body.appendChild(modal);
    }

    // Medical Calculators
    setupMedicalCalculators() {
        this.calculators = this.getMedicalCalculators();
        this.initializeCalculatorEvents();
    }

    getMedicalCalculators() {
        return {
            bmi: {
                name: 'Índice de Masa Corporal',
                formula: 'peso (kg) / altura² (m)',
                calculate: (weight, height) => {
                    const bmi = weight / Math.pow(height / 100, 2);
                    let category = '';
                    
                    if (bmi < 18.5) category = 'Bajo peso';
                    else if (bmi < 25) category = 'Peso normal';
                    else if (bmi < 30) category = 'Sobrepeso';
                    else category = 'Obesidad';
                    
                    return { value: bmi.toFixed(1), category };
                }
            },
            creatinine: {
                name: 'Depuración de Creatinina (Cockcroft-Gault)',
                formula: '((140-edad) × peso) / (72 × creatinina)',
                calculate: (age, weight, creatinine, gender) => {
                    let clearance = ((140 - age) * weight) / (72 * creatinine);
                    if (gender === 'female') clearance *= 0.85;
                    
                    let category = '';
                    if (clearance >= 90) category = 'Normal';
                    else if (clearance >= 60) category = 'ERC leve';
                    else if (clearance >= 30) category = 'ERC moderada';
                    else if (clearance >= 15) category = 'ERC severa';
                    else category = 'ERC terminal';
                    
                    return { value: clearance.toFixed(1), category };
                }
            },
            framingham: {
                name: 'Riesgo Cardiovascular Framingham',
                calculate: (age, gender, cholesterol, hdl, sbp, smoking, diabetes) => {
                    // Simplified Framingham calculation
                    let risk = 0;
                    
                    // Age points
                    if (gender === 'male') {
                        if (age >= 70) risk += 11;
                        else if (age >= 60) risk += 8;
                        else if (age >= 50) risk += 5;
                        else if (age >= 40) risk += 2;
                    } else {
                        if (age >= 70) risk += 12;
                        else if (age >= 60) risk += 9;
                        else if (age >= 50) risk += 6;
                        else if (age >= 40) risk += 3;
                    }
                    
                    // Additional risk factors
                    if (smoking) risk += 4;
                    if (diabetes) risk += 3;
                    if (sbp > 160) risk += 2;
                    if (cholesterol > 240) risk += 1;
                    if (hdl < 40) risk += 1;
                    
                    let percentage = Math.min(risk * 2, 40); // Simplified conversion
                    
                    return {
                        value: percentage.toFixed(0) + '%',
                        category: percentage < 10 ? 'Riesgo bajo' : 
                                 percentage < 20 ? 'Riesgo moderado' : 'Riesgo alto'
                    };
                }
            }
        };
    }

    initializeCalculatorEvents() {
        // Add calculator buttons to study guides
        this.addCalculatorButtons();
    }

    addCalculatorButtons() {
        const quickRefSection = document.querySelector('.quick-reference-section');
        if (!quickRefSection) return;
        
        const calculatorTab = document.createElement('button');
        calculatorTab.className = 'tab-button';
        calculatorTab.setAttribute('data-tab', 'medical-calculators');
        calculatorTab.textContent = 'Calculadoras Médicas';
        
        const tabsContainer = quickRefSection.querySelector('.reference-tabs');
        if (tabsContainer) {
            tabsContainer.appendChild(calculatorTab);
        }
        
        const calculatorPane = document.createElement('div');
        calculatorPane.id = 'medical-calculators';
        calculatorPane.className = 'tab-pane';
        calculatorPane.innerHTML = this.createCalculatorInterface();
        
        const tabContent = quickRefSection.querySelector('.tab-content');
        if (tabContent) {
            tabContent.appendChild(calculatorPane);
        }
        
        calculatorTab.addEventListener('click', () => {
            window.enarmApp.showTab('medical-calculators');
        });
    }

    createCalculatorInterface() {
        return `
            <div class="calculator-grid">
                <div class="calculator-card">
                    <h4>IMC (Índice de Masa Corporal)</h4>
                    <div class="calculator-inputs">
                        <input type="number" id="bmi-weight" placeholder="Peso (kg)">
                        <input type="number" id="bmi-height" placeholder="Altura (cm)">
                        <button onclick="window.enarmUtils.calculateBMI()">Calcular</button>
                    </div>
                    <div class="calculator-result" id="bmi-result"></div>
                </div>
                
                <div class="calculator-card">
                    <h4>Depuración de Creatinina</h4>
                    <div class="calculator-inputs">
                        <input type="number" id="cr-age" placeholder="Edad">
                        <input type="number" id="cr-weight" placeholder="Peso (kg)">
                        <input type="number" id="cr-creatinine" placeholder="Creatinina (mg/dL)">
                        <select id="cr-gender">
                            <option value="male">Masculino</option>
                            <option value="female">Femenino</option>
                        </select>
                        <button onclick="window.enarmUtils.calculateCreatinine()">Calcular</button>
                    </div>
                    <div class="calculator-result" id="cr-result"></div>
                </div>
            </div>
        `;
    }

    calculateBMI() {
        const weight = parseFloat(document.getElementById('bmi-weight').value);
        const height = parseFloat(document.getElementById('bmi-height').value);
        
        if (!weight || !height) {
            this.showMessage('Por favor ingresa peso y altura válidos');
            return;
        }
        
        const result = this.calculators.bmi.calculate(weight, height);
        const resultElement = document.getElementById('bmi-result');
        
        resultElement.innerHTML = `
            <strong>IMC: ${result.value}</strong><br>
            <span class="category">${result.category}</span>
        `;
    }

    calculateCreatinine() {
        const age = parseInt(document.getElementById('cr-age').value);
        const weight = parseFloat(document.getElementById('cr-weight').value);
        const creatinine = parseFloat(document.getElementById('cr-creatinine').value);
        const gender = document.getElementById('cr-gender').value;
        
        if (!age || !weight || !creatinine) {
            this.showMessage('Por favor ingresa todos los valores requeridos');
            return;
        }
        
        const result = this.calculators.creatinine.calculate(age, weight, creatinine, gender);
        const resultElement = document.getElementById('cr-result');
        
        resultElement.innerHTML = `
            <strong>Depuración: ${result.value} mL/min</strong><br>
            <span class="category">${result.category}</span>
        `;
    }

    // Utility Functions
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatDate(date, locale = 'es-ES') {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
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
    }

    // Search functionality
    setupSearch() {
        const searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.placeholder = 'Buscar preguntas, temas...';
        searchInput.className = 'global-search';
        
        searchInput.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 300px;
            padding: 12px 16px;
            border: 2px solid var(--border-color);
            border-radius: 25px;
            background: var(--background-primary);
            z-index: 99;
            transition: all 0.3s ease;
        `;
        
        let isVisible = false;
        
        // Toggle search with Ctrl+K
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                
                if (!isVisible) {
                    document.body.appendChild(searchInput);
                    searchInput.focus();
                    isVisible = true;
                } else {
                    searchInput.remove();
                    isVisible = false;
                }
            }
            
            if (e.key === 'Escape' && isVisible) {
                searchInput.remove();
                isVisible = false;
            }
        });
        
        // Search functionality
        searchInput.addEventListener('input', this.debounce((e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                this.performSearch(query);
            }
        }, 300));
    }

    performSearch(query) {
        if (!window.questionBank) return;
        
        const results = window.questionBank.filter(q => 
            q.question.toLowerCase().includes(query.toLowerCase()) ||
            q.explanation.toLowerCase().includes(query.toLowerCase()) ||
            q.category.toLowerCase().includes(query.toLowerCase()) ||
            Object.values(q.options).some(option => 
                option.toLowerCase().includes(query.toLowerCase())
            )
        );
        
        this.displaySearchResults(results, query);
    }

    displaySearchResults(results, query) {
        // Remove existing results
        const existingResults = document.querySelector('.search-results');
        if (existingResults) {
            existingResults.remove();
        }
        
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        resultsContainer.innerHTML = `
            <div class="search-results-header">
                <h3>Resultados para "${query}" (${results.length})</h3>
                <button class="close-search">&times;</button>
            </div>
            <div class="search-results-list">
                ${results.slice(0, 10).map(q => `
                    <div class="search-result-item" data-question-id="${q.id}">
                        <div class="result-category">${q.category}</div>
                        <div class="result-question">${q.question}</div>
                        <div class="result-difficulty">${q.difficulty}</div>
                    </div>
                `).join('')}
                ${results.length > 10 ? `<div class="search-more">Y ${results.length - 10} más...</div>` : ''}
            </div>
        `;
        
        resultsContainer.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            max-height: 400px;
            background: var(--background-primary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 98;
            overflow: hidden;
        `;
        
        document.body.appendChild(resultsContainer);
        
        // Close button
        resultsContainer.querySelector('.close-search').addEventListener('click', () => {
            resultsContainer.remove();
        });
        
        // Click on result
        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const questionId = item.getAttribute('data-question-id');
                this.showQuestionFromSearch(questionId);
                resultsContainer.remove();
            });
        });
    }

    showQuestionFromSearch(questionId) {
        // Navigate to practice page and show specific question
        window.enarmApp.showPage('practice');
        
        setTimeout(() => {
            const question = window.questionBank.find(q => q.id === questionId);
            if (question) {
                window.enarmApp.sessionQuestions = [question];
                window.enarmApp.currentQuestionIndex = 0;
                window.enarmApp.showQuestion(question);
            }
        }, 100);
    }
}

// Add additional CSS for calculators and search
const utilityStyles = `
    .calculator-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }
    
    .calculator-card {
        background: var(--background-secondary);
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }
    
    .calculator-inputs {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin: 1rem 0;
    }
    
    .calculator-inputs input,
    .calculator-inputs select {
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--background-primary);
    }
    
    .calculator-inputs button {
        padding: 0.75rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .calculator-inputs button:hover {
        background: var(--primary-dark);
    }
    
    .calculator-result {
        padding: 1rem;
        background: var(--background-primary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        text-align: center;
        min-height: 60px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    
    .search-results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        background: var(--background-secondary);
    }
    
    .search-results-list {
        max-height: 320px;
        overflow-y: auto;
    }
    
    .search-result-item {
        padding: 1rem;
        border-bottom: 1px solid var(--border-light);
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .search-result-item:hover {
        background: var(--background-secondary);
    }
    
    .result-category {
        font-size: 0.75rem;
        color: var(--primary-color);
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    
    .result-question {
        color: var(--text-primary);
        margin-bottom: 0.5rem;
        line-height: 1.4;
    }
    
    .result-difficulty {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: capitalize;
    }
    
    .search-more {
        padding: 1rem;
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

// Inject utility styles
const utilityStyleSheet = document.createElement('style');
utilityStyleSheet.textContent = utilityStyles;
document.head.appendChild(utilityStyleSheet);

// Initialize utilities when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enarmUtils = new ENARMUtils();
    window.enarmUtils.setupSearch();
});