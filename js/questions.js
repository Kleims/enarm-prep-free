// ENARM Questions Database and Management System
class QuestionManager {
    constructor() {
        this.questions = [];
        this.questionLoader = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        await this.loadQuestions();
        this.setupLazyLoader();
        // Only expose loaded questions initially
        window.questionBank = this.getLoadedQuestions();
        this.isInitialized = true;
    }

    async loadQuestions() {
        try {
            const response = await fetch('data/questions.json');
            if (response.ok) {
                const allQuestions = await response.json();
                
                // Validate questions if validator is available
                if (window.DataValidator) {
                    const validation = window.DataValidator.validateQuestionBank(allQuestions);
                    this.questions = validation.valid;
                    
                    if (validation.invalid.length > 0) {
                        console.warn(`Skipped ${validation.invalid.length} invalid questions`);
                    }
                } else {
                    this.questions = allQuestions;
                }
            } else {
                // Fallback to hardcoded questions if JSON file doesn't exist
                this.questions = this.getDefaultQuestions();
            }
        } catch (error) {
            console.log('Loading fallback questions');
            this.questions = this.getDefaultQuestions();
        }
    }

    setupLazyLoader() {
        if (window.PerformanceOptimizer) {
            this.questionLoader = window.PerformanceOptimizer.createQuestionLoader();
            this.questionLoader.init(this.questions);
        } else {
            // Fallback to loading all questions if optimizer not available
            console.warn('PerformanceOptimizer not available, loading all questions');
        }
    }

    getLoadedQuestions() {
        if (this.questionLoader) {
            return this.questionLoader.getLoadedQuestions();
        }
        return this.questions;
    }

    async ensureQuestionsLoaded(count = 50) {
        if (!this.questionLoader) return this.questions;
        
        const loaded = this.questionLoader.getLoadedQuestions();
        
        // Load more chunks if needed
        while (loaded.length < count && loaded.length < this.questions.length) {
            const hasMore = await this.questionLoader.loadNextChunk();
            if (!hasMore) break;
        }
        
        // Update global question bank
        window.questionBank = this.getLoadedQuestions();
        
        return this.getLoadedQuestions();
    }

    searchQuestions(query, filters = {}) {
        if (this.questionLoader) {
            return this.questionLoader.searchQuestions(query, filters);
        }
        
        // Fallback search implementation
        const searchTerm = query.toLowerCase();
        return this.questions.filter(q => {
            const matchesText = !query || 
                q.question.toLowerCase().includes(searchTerm);
            const matchesCategory = !filters.category || 
                q.category === filters.category;
            const matchesDifficulty = !filters.difficulty || 
                q.difficulty === filters.difficulty;
            
            return matchesText && matchesCategory && matchesDifficulty;
        });
    }

    getQuestionsByCategory(category) {
        return this.searchQuestions('', { category });
    }

    getQuestionsByDifficulty(difficulty) {
        return this.searchQuestions('', { difficulty });
    }

    getLoadingProgress() {
        if (this.questionLoader) {
            return this.questionLoader.getProgress();
        }
        return {
            loaded: this.questions.length,
            total: this.questions.length,
            percentage: 100
        };
    }

    getDefaultQuestions() {
        return [
            // CARDIOLOGÍA
            {
                id: "card001",
                category: "Cardiología",
                difficulty: "intermedio",
                question: "¿Cuál es el tratamiento de primera línea para la hipertensión arterial en pacientes jóvenes sin comorbilidades?",
                options: {
                    A: "Diuréticos tiazídicos",
                    B: "IECA (Inhibidores de la ECA)",
                    C: "Bloqueadores de canales de calcio",
                    D: "Beta bloqueadores"
                },
                correct: "B",
                explanation: "Los IECA son primera línea en pacientes jóvenes por su perfil de seguridad, efectividad y beneficios cardiovasculares adicionales.",
                reference: "Guías ESC/ESH 2023"
            },
            {
                id: "card002",
                category: "Cardiología",
                difficulty: "avanzado",
                question: "Un paciente de 55 años presenta dolor torácico con elevación del ST en derivaciones II, III y aVF. ¿Cuál es el diagnóstico más probable?",
                options: {
                    A: "Infarto anterior",
                    B: "Infarto lateral",
                    C: "Infarto inferior",
                    D: "Pericarditis aguda"
                },
                correct: "C",
                explanation: "La elevación del ST en derivaciones II, III y aVF indica un infarto de miocardio de pared inferior, generalmente por oclusión de la arteria coronaria derecha.",
                reference: "Guías AHA/ESC 2023"
            },
            {
                id: "card003",
                category: "Cardiología",
                difficulty: "basico",
                question: "¿Cuál es el valor normal de la presión arterial sistólica en adultos?",
                options: {
                    A: "< 100 mmHg",
                    B: "< 120 mmHg",
                    C: "< 130 mmHg",
                    D: "< 140 mmHg"
                },
                correct: "B",
                explanation: "La presión arterial sistólica normal debe ser menor a 120 mmHg según las guías actuales.",
                reference: "AHA Guidelines 2023"
            },
            {
                id: "card004",
                category: "Cardiología",
                difficulty: "intermedio",
                question: "En la insuficiencia cardíaca con fracción de eyección reducida, ¿cuál es la combinación de medicamentos de primera línea?",
                options: {
                    A: "IECA + Beta bloqueador + Diurético",
                    B: "ARA II + Digoxina + Diurético",
                    C: "IECA + Digoxina + Espironolactona",
                    D: "Beta bloqueador + Hidralazina + Diurético",
                    E: "ARA II + Beta bloqueador + Ivabradina"
                },
                correct: "A",
                explanation: "La terapia triple con IECA, beta bloqueador y diurético es la base del tratamiento en IC con FE reducida.",
                reference: "Guías ESC 2023"
            },
            {
                id: "card005",
                category: "Cardiología",
                difficulty: "avanzado",
                question: "¿Cuál es el criterio electrocardiográfico para el diagnóstico de fibrilación auricular?",
                options: {
                    A: "QRS ancho con ondas P ausentes",
                    B: "Ritmo irregular con ondas P ausentes",
                    C: "Ondas P invertidas con QRS normal",
                    D: "Intervalo PR prolongado con QRS normal",
                    E: "Ondas T invertidas en precordiales"
                },
                correct: "B",
                explanation: "La fibrilación auricular se caracteriza por ritmo irregular y ausencia de ondas P, con ondas f de fibrilación.",
                reference: "ESC Guidelines 2023"
            },

            // NEUROLOGÍA
            {
                id: "neuro001",
                category: "Neurología",
                difficulty: "intermedio",
                question: "Un paciente de 65 años presenta debilidad súbita del brazo derecho y disartria. ¿Cuál es el estudio de imagen inicial más apropiado?",
                options: {
                    A: "Resonancia magnética cerebral",
                    B: "Tomografía computada simple de cráneo",
                    C: "Angiografía cerebral",
                    D: "Ultrasonido carotídeo",
                    E: "Tomografía por emisión de positrones"
                },
                correct: "B",
                explanation: "La TC simple de cráneo es el estudio inicial para descartar hemorragia antes del tratamiento trombolítico en EVC agudo.",
                reference: "AHA/ASA Stroke Guidelines 2023"
            },
            {
                id: "neuro002",
                category: "Neurología",
                difficulty: "basico",
                question: "¿Cuál es el fármaco de primera línea para el tratamiento de la epilepsia generalizada tónico-clónica?",
                options: {
                    A: "Fenitoína",
                    B: "Carbamazepina",
                    C: "Ácido valproico",
                    D: "Lamotrigina",
                    E: "Levetiracetam"
                },
                correct: "C",
                explanation: "El ácido valproico es el fármaco de primera línea para epilepsia generalizada tónico-clónica.",
                reference: "ILAE Guidelines 2023"
            },
            {
                id: "neuro003",
                category: "Neurología",
                difficulty: "avanzado",
                question: "En la enfermedad de Parkinson, ¿cuál es el síntoma motor cardinal que mejor responde a la levodopa?",
                options: {
                    A: "Temblor de reposo",
                    B: "Rigidez",
                    C: "Bradicinesia",
                    D: "Inestabilidad postural",
                    E: "Freezing de la marcha"
                },
                correct: "C",
                explanation: "La bradicinesia es el síntoma que mejor responde al tratamiento con levodopa en la enfermedad de Parkinson.",
                reference: "Movement Disorders Society 2023"
            },
            {
                id: "neuro004",
                category: "Neurología",
                difficulty: "intermedio",
                question: "¿Cuál es el signo neurológico característico de la herniación uncal?",
                options: {
                    A: "Pupilas puntiformes bilaterales",
                    B: "Pupila dilatada unilateral",
                    C: "Nistagmo horizontal",
                    D: "Rigidez de nuca",
                    E: "Babinski bilateral"
                },
                correct: "B",
                explanation: "La herniación uncal produce compresión del III par craneal, causando pupila dilatada unilateral (signo de Hutchinson).",
                reference: "Neurocritical Care 2023"
            },
            {
                id: "neuro005",
                category: "Neurología",
                difficulty: "basico",
                question: "¿Cuál es la principal causa de cefalea secundaria en urgencias?",
                options: {
                    A: "Tumor cerebral",
                    B: "Meningitis",
                    C: "Hipertensión intracraneal",
                    D: "Hemorragia subaracnoidea",
                    E: "Sinusitis aguda"
                },
                correct: "E",
                explanation: "La sinusitis aguda es la causa más común de cefalea secundaria que se presenta en los servicios de urgencias.",
                reference: "IHS Classification 2023"
            },

            // PEDIATRÍA
            {
                id: "ped001",
                category: "Pediatría",
                difficulty: "basico",
                question: "¿A qué edad se debe iniciar la alimentación complementaria en lactantes?",
                options: {
                    A: "4 meses",
                    B: "5 meses",
                    C: "6 meses",
                    D: "7 meses",
                    E: "8 meses"
                },
                correct: "C",
                explanation: "La alimentación complementaria debe iniciarse a los 6 meses de edad, manteniendo la lactancia materna.",
                reference: "OMS/UNICEF 2023"
            },
            {
                id: "ped002",
                category: "Pediatría",
                difficulty: "intermedio",
                question: "Un niño de 2 años presenta fiebre de 39°C, irritabilidad y rigidez de nuca. ¿Cuál es el estudio inicial más importante?",
                options: {
                    A: "Hemocultivo",
                    B: "Punción lumbar",
                    C: "Tomografía de cráneo",
                    D: "Cultivo de orina",
                    E: "Radiografía de tórax"
                },
                correct: "B",
                explanation: "Ante sospecha de meningitis en pediatría, la punción lumbar es el estudio inicial más importante.",
                reference: "AAP Guidelines 2023"
            },
            {
                id: "ped003",
                category: "Pediatría",
                difficulty: "avanzado",
                question: "En un recién nacido con cianosis persistente, ¿cuál es la primera maniobra diagnóstica?",
                options: {
                    A: "Radiografía de tórax",
                    B: "Ecocardiograma",
                    C: "Test de hiperoxia",
                    D: "Gasometría arterial",
                    E: "Electrocardiograma"
                },
                correct: "C",
                explanation: "El test de hiperoxia permite diferenciar entre causas cardíacas y pulmonares de cianosis en el recién nacido.",
                reference: "Neonatal Cardiology 2023"
            },
            {
                id: "ped004",
                category: "Pediatría",
                difficulty: "intermedio",
                question: "¿Cuál es la causa más común de neumonía en niños de 2-5 años?",
                options: {
                    A: "Streptococcus pneumoniae",
                    B: "Haemophilus influenzae",
                    C: "Staphylococcus aureus",
                    D: "Mycoplasma pneumoniae",
                    E: "Virus sincitial respiratorio"
                },
                correct: "A",
                explanation: "Streptococcus pneumoniae es la causa bacteriana más común de neumonía en niños de 2-5 años.",
                reference: "IDSA/PIDS Guidelines 2023"
            },
            {
                id: "ped005",
                category: "Pediatría",
                difficulty: "basico",
                question: "¿Cuál es la vacuna que se aplica al nacimiento?",
                options: {
                    A: "BCG y Hepatitis B",
                    B: "DPT y Polio",
                    C: "Triple viral",
                    D: "Neumocócica",
                    E: "Rotavirus"
                },
                correct: "A",
                explanation: "Al nacimiento se aplican las vacunas BCG (tuberculosis) y Hepatitis B.",
                reference: "Esquema Nacional de Vacunación 2023"
            },

            // GINECOLOGÍA Y OBSTETRICIA
            {
                id: "gyn001",
                category: "Ginecología y Obstetricia",
                difficulty: "intermedio",
                question: "¿Cuál es el estudio de elección para el diagnóstico de embarazo ectópico?",
                options: {
                    A: "Beta-hCG cuantitativa",
                    B: "Ultrasonido transvaginal",
                    C: "Laparoscopia diagnóstica",
                    D: "Culdocentesis",
                    E: "Resonancia magnética pélvica"
                },
                correct: "B",
                explanation: "El ultrasonido transvaginal es el estudio de elección para diagnosticar embarazo ectópico, especialmente cuando no se visualiza saco gestacional intrauterino con hCG > 1500-2000.",
                reference: "ACOG Guidelines 2023"
            },
            {
                id: "gyn002",
                category: "Ginecología y Obstetricia",
                difficulty: "basico",
                question: "¿En qué semana de gestación se considera embarazo a término?",
                options: {
                    A: "A partir de la semana 36",
                    B: "A partir de la semana 37",
                    C: "A partir de la semana 38",
                    D: "A partir de la semana 39",
                    E: "A partir de la semana 40"
                },
                correct: "B",
                explanation: "El embarazo a término se define a partir de las 37 semanas completas de gestación.",
                reference: "ACOG/SMFM 2023"
            },
            {
                id: "gyn003",
                category: "Ginecología y Obstetricia",
                difficulty: "avanzado",
                question: "En preeclampsia severa, ¿cuál es el fármaco de elección para prevenir convulsiones?",
                options: {
                    A: "Diazepam",
                    B: "Fenitoína",
                    C: "Sulfato de magnesio",
                    D: "Ácido valproico",
                    E: "Levetiracetam"
                },
                correct: "C",
                explanation: "El sulfato de magnesio es el fármaco de elección para prevención y tratamiento de convulsiones en preeclampsia.",
                reference: "ACOG Practice Bulletin 2023"
            },
            {
                id: "gyn004",
                category: "Ginecología y Obstetricia",
                difficulty: "intermedio",
                question: "¿Cuál es el método anticonceptivo más efectivo para mujeres jóvenes sin contraindicaciones?",
                options: {
                    A: "Condón masculino",
                    B: "Anticonceptivos orales combinados",
                    C: "DIU de cobre",
                    D: "Implante subdérmico",
                    E: "Inyección de medroxiprogesterona"
                },
                correct: "D",
                explanation: "El implante subdérmico tiene la mayor efectividad anticonceptiva (>99%) y es ideal para mujeres jóvenes.",
                reference: "WHO Medical Eligibility Criteria 2023"
            },
            {
                id: "gyn005",
                category: "Ginecología y Obstetricia",
                difficulty: "basico",
                question: "¿Cuál es el microorganismo más común en infección de vías urinarias durante el embarazo?",
                options: {
                    A: "Staphylococcus saprophyticus",
                    B: "Escherichia coli",
                    C: "Klebsiella pneumoniae",
                    D: "Enterococcus faecalis",
                    E: "Proteus mirabilis"
                },
                correct: "B",
                explanation: "Escherichia coli es el microorganismo más frecuente en infecciones urinarias durante el embarazo (70-80%).",
                reference: "ACOG Committee Opinion 2023"
            },

            // MEDICINA INTERNA
            {
                id: "int001",
                category: "Medicina Interna",
                difficulty: "intermedio",
                question: "Un paciente de 45 años con diabetes mellitus tipo 2 presenta HbA1c de 8.5%. ¿Cuál es el siguiente paso en el tratamiento?",
                options: {
                    A: "Aumentar la dosis de metformina",
                    B: "Agregar sulfonilurea",
                    C: "Agregar inhibidor DPP-4",
                    D: "Agregar insulina basal",
                    E: "Cualquiera de las anteriores es apropiada"
                },
                correct: "E",
                explanation: "Con HbA1c de 8.5%, cualquier intensificación del tratamiento es apropiada. La elección depende de factores individuales del paciente.",
                reference: "ADA Standards of Care 2023"
            },
            {
                id: "int002",
                category: "Medicina Interna",
                difficulty: "avanzado",
                question: "¿Cuál es el criterio diagnóstico más específico para síndrome nefrótico?",
                options: {
                    A: "Proteinuria > 3.5 g/24h",
                    B: "Hipoalbuminemia < 3.0 g/dL",
                    C: "Edema periférico",
                    D: "Hiperlipidemia",
                    E: "Hematuria microscópica"
                },
                correct: "A",
                explanation: "La proteinuria masiva (>3.5 g/24h) es el criterio diagnóstico más específico y necesario para síndrome nefrótico.",
                reference: "KDIGO Guidelines 2023"
            },
            {
                id: "int003",
                category: "Medicina Interna",
                difficulty: "basico",
                question: "¿Cuál es el valor normal de hemoglobina en hombres adultos?",
                options: {
                    A: "10-12 g/dL",
                    B: "11-13 g/dL",
                    C: "12-14 g/dL",
                    D: "14-16 g/dL",
                    E: "16-18 g/dL"
                },
                correct: "D",
                explanation: "El valor normal de hemoglobina en hombres adultos es de 14-16 g/dL.",
                reference: "WHO Reference Values 2023"
            },
            {
                id: "int004",
                category: "Medicina Interna",
                difficulty: "intermedio",
                question: "En un paciente con cirrosis hepática, ¿cuál es la complicación más frecuente?",
                options: {
                    A: "Ascitis",
                    B: "Encefalopatía hepática",
                    C: "Varices esofágicas",
                    D: "Síndrome hepatorrenal",
                    E: "Carcinoma hepatocelular"
                },
                correct: "A",
                explanation: "La ascitis es la complicación más frecuente de la cirrosis hepática, presente en hasta 80% de los pacientes.",
                reference: "AASLD Guidelines 2023"
            },
            {
                id: "int005",
                category: "Medicina Interna",
                difficulty: "avanzado",
                question: "¿Cuál es el tratamiento de elección para tromboembolia pulmonar masiva?",
                options: {
                    A: "Heparina no fraccionada",
                    B: "Heparina de bajo peso molecular",
                    C: "Warfarina",
                    D: "Trombolisis sistémica",
                    E: "Embolectomía quirúrgica"
                },
                correct: "D",
                explanation: "En TEP masiva con compromiso hemodinámico, la trombolisis sistémica es el tratamiento de elección si no hay contraindicaciones.",
                reference: "ESC Guidelines 2023"
            },

            // CIRUGÍA GENERAL
            {
                id: "cir001",
                category: "Cirugía General",
                difficulty: "intermedio",
                question: "¿Cuál es el signo clínico más confiable para el diagnóstico de apendicitis aguda?",
                options: {
                    A: "Dolor en fosa ilíaca derecha",
                    B: "Signo de McBurney",
                    C: "Signo de Rovsing",
                    D: "Leucocitosis con neutrofilia",
                    E: "Ningún signo es completamente confiable"
                },
                correct: "E",
                explanation: "No existe un signo clínico único que sea completamente confiable para el diagnóstico de apendicitis. El diagnóstico se basa en la evaluación clínica integral.",
                reference: "WSES Guidelines 2023"
            },
            {
                id: "cir002",
                category: "Cirugía General",
                difficulty: "basico",
                question: "¿Cuál es el tipo de hernia inguinal más común en hombres?",
                options: {
                    A: "Hernia inguinal directa",
                    B: "Hernia inguinal indirecta",
                    C: "Hernia femoral",
                    D: "Hernia epigástrica",
                    E: "Hernia umbilical"
                },
                correct: "B",
                explanation: "La hernia inguinal indirecta es el tipo más común en hombres, especialmente en jóvenes.",
                reference: "EHS Guidelines 2023"
            },
            {
                id: "cir003",
                category: "Cirugía General",
                difficulty: "avanzado",
                question: "En colangitis aguda, ¿cuál es la terapia definitiva después de la estabilización?",
                options: {
                    A: "Antibioticoterapia prolongada",
                    B: "Colecistectomía laparoscópica",
                    C: "Drenaje biliar (CPRE o PTC)",
                    D: "Coledocotomía abierta",
                    E: "Hepaticoyeyunostomía"
                },
                correct: "C",
                explanation: "En colangitis aguda, después de la estabilización, el drenaje biliar urgente (CPRE o PTC) es la terapia definitiva.",
                reference: "Tokyo Guidelines 2023"
            },
            {
                id: "cir004",
                category: "Cirugía General",
                difficulty: "intermedio",
                question: "¿Cuál es la complicación más temida de la úlcera péptica perforada?",
                options: {
                    A: "Hemorragia digestiva",
                    B: "Obstrucción pilórica",
                    C: "Peritonitis",
                    D: "Penetración",
                    E: "Malignización"
                },
                correct: "C",
                explanation: "La peritonitis es la complicación más temida de la úlcera péptica perforada, requiere manejo quirúrgico urgente.",
                reference: "WSES Guidelines 2023"
            },
            {
                id: "cir005",
                category: "Cirugía General",
                difficulty: "basico",
                question: "¿Cuál es la causa más común de obstrucción intestinal en adultos?",
                options: {
                    A: "Hernia incarcerada",
                    B: "Adherencias postoperatorias",
                    C: "Cáncer colorrectal",
                    D: "Vólvulo intestinal",
                    E: "Invaginación intestinal"
                },
                correct: "B",
                explanation: "Las adherencias postoperatorias son la causa más común de obstrucción intestinal en adultos (60-70%).",
                reference: "WSES Guidelines 2023"
            },

            // MEDICINA FAMILIAR
            {
                id: "fam001",
                category: "Medicina Familiar",
                difficulty: "basico",
                question: "¿Con qué frecuencia se debe realizar tamizaje de cáncer cervicouterino con citología en mujeres de 25-65 años?",
                options: {
                    A: "Cada año",
                    B: "Cada 2 años",
                    C: "Cada 3 años",
                    D: "Cada 5 años",
                    E: "Solo una vez"
                },
                correct: "C",
                explanation: "El tamizaje con citología cervical se debe realizar cada 3 años en mujeres de 25-65 años con resultados normales previos.",
                reference: "NOM-014-SSA2-2023"
            },
            {
                id: "fam002",
                category: "Medicina Familiar",
                difficulty: "intermedio",
                question: "Un adulto mayor de 65 años sin factores de riesgo cardiovascular. ¿Cuál es la meta de presión arterial?",
                options: {
                    A: "< 120/80 mmHg",
                    B: "< 130/80 mmHg",
                    C: "< 140/90 mmHg",
                    D: "< 150/90 mmHg",
                    E: "< 160/100 mmHg"
                },
                correct: "C",
                explanation: "En adultos mayores de 65 años sin comorbilidades, la meta es < 140/90 mmHg para evitar hipotensión excesiva.",
                reference: "AHA/ACC Guidelines 2023"
            },
            {
                id: "fam003",
                category: "Medicina Familiar",
                difficulty: "basico",
                question: "¿A qué edad se debe iniciar el tamizaje de cáncer de colon en población general?",
                options: {
                    A: "40 años",
                    B: "45 años",
                    C: "50 años",
                    D: "55 años",
                    E: "60 años"
                },
                correct: "B",
                explanation: "La ACS recomienda iniciar tamizaje de cáncer colorrectal a los 45 años en población con riesgo promedio.",
                reference: "ACS Guidelines 2023"
            },
            {
                id: "fam004",
                category: "Medicina Familiar",
                difficulty: "intermedio",
                question: "En el manejo de depresión leve a moderada, ¿cuál es la intervención de primera línea?",
                options: {
                    A: "Antidepresivos ISRS",
                    B: "Psicoterapia",
                    C: "Combinación de medicamento y psicoterapia",
                    D: "Cambios en estilo de vida",
                    E: "Hospitalización psiquiátrica"
                },
                correct: "B",
                explanation: "En depresión leve a moderada, la psicoterapia (especialmente TCC) es la intervención de primera línea.",
                reference: "APA Guidelines 2023"
            },
            {
                id: "fam005",
                category: "Medicina Familiar",
                difficulty: "basico",
                question: "¿Cuál es la recomendación para actividad física en adultos sanos?",
                options: {
                    A: "30 minutos diarios de actividad moderada",
                    B: "150 minutos semanales de actividad moderada",
                    C: "60 minutos diarios de actividad vigorosa",
                    D: "300 minutos semanales de actividad ligera",
                    E: "No hay recomendación específica"
                },
                correct: "B",
                explanation: "La recomendación es al menos 150 minutos semanales de actividad física aeróbica de intensidad moderada.",
                reference: "OMS Physical Activity Guidelines 2023"
            },

            // URGENCIAS MÉDICAS
            {
                id: "urg001",
                category: "Urgencias Médicas",
                difficulty: "avanzado",
                question: "En paro cardiorespiratorio, ¿cuál es la secuencia correcta de RCP de alta calidad?",
                options: {
                    A: "A-B-C (Vía aérea, respiración, compresiones)",
                    B: "C-A-B (Compresiones, vía aérea, respiración)",
                    C: "B-A-C (Respiración, vía aérea, compresiones)",
                    D: "A-C-B (Vía aérea, compresiones, respiración)",
                    E: "Solo compresiones continuas"
                },
                correct: "B",
                explanation: "La secuencia actual es C-A-B: Compresiones inmediatas, después vía aérea y respiración.",
                reference: "AHA Guidelines 2023"
            },
            {
                id: "urg002",
                category: "Urgencias Médicas",
                difficulty: "intermedio",
                question: "¿Cuál es la dosis de epinefrina en anafilaxia para un adulto?",
                options: {
                    A: "0.1 mg IM",
                    B: "0.3 mg IM",
                    C: "0.5 mg IM",
                    D: "1.0 mg IM",
                    E: "0.1 mg IV"
                },
                correct: "C",
                explanation: "La dosis de epinefrina en anafilaxia para adultos es 0.5 mg (0.5 mL de solución 1:1000) intramuscular.",
                reference: "EAACI Guidelines 2023"
            },
            {
                id: "urg003",
                category: "Urgencias Médicas",
                difficulty: "basico",
                question: "¿Cuál es el antídoto específico para intoxicación por paracetamol?",
                options: {
                    A: "Carbón activado",
                    B: "N-acetilcisteína",
                    C: "Flumazenil",
                    D: "Naloxona",
                    E: "Atropina"
                },
                correct: "B",
                explanation: "La N-acetilcisteína es el antídoto específico para la intoxicación por paracetamol.",
                reference: "Toxicology Guidelines 2023"
            },
            {
                id: "urg004",
                category: "Urgencias Médicas",
                difficulty: "intermedio",
                question: "En trauma craneoencefálico, ¿cuál es el signo que indica herniación cerebral inminente?",
                options: {
                    A: "Cefalea intensa",
                    B: "Vómitos en proyectil",
                    C: "Pupila dilatada unilateral",
                    D: "Convulsiones focales",
                    E: "Disminución del nivel de conciencia"
                },
                correct: "C",
                explanation: "La pupila dilatada unilateral (midriasis) indica herniación uncal y requiere intervención neuroquirúrgica urgente.",
                reference: "BTF Guidelines 2023"
            },
            {
                id: "urg005",
                category: "Urgencias Médicas",
                difficulty: "avanzado",
                question: "En shock séptico, después de la reanimación inicial con líquidos, ¿cuál es el vasopresor de primera línea?",
                options: {
                    A: "Dopamina",
                    B: "Dobutamina",
                    C: "Norepinefrina",
                    D: "Epinefrina",
                    E: "Vasopresina"
                },
                correct: "C",
                explanation: "La norepinefrina es el vasopresor de primera línea en shock séptico después de la reanimación con líquidos.",
                reference: "Surviving Sepsis Guidelines 2023"
            },

            // GASTROENTEROLOGÍA
            {
                id: "gast001",
                category: "Gastroenterología",
                difficulty: "intermedio",
                question: "¿Cuál es el tratamiento de primera línea para erradicar Helicobacter pylori?",
                options: {
                    A: "Terapia dual (IBP + amoxicilina)",
                    B: "Terapia triple (IBP + amoxicilina + claritromicina)",
                    C: "Terapia cuádruple concomitante",
                    D: "Monoterapia con claritromicina",
                    E: "Terapia secuencial"
                },
                correct: "C",
                explanation: "La terapia cuádruple concomitante (IBP + amoxicilina + claritromicina + metronidazol) es actualmente primera línea.",
                reference: "Maastricht VI Consensus 2023"
            },
            {
                id: "gast002",
                category: "Gastroenterología",
                difficulty: "basico",
                question: "¿Cuál es la causa más común de cirrosis hepática en México?",
                options: {
                    A: "Hepatitis B",
                    B: "Hepatitis C",
                    C: "Alcoholismo",
                    D: "Hemocromatosis",
                    E: "Enfermedad de Wilson"
                },
                correct: "C",
                explanation: "El alcoholismo es la causa más común de cirrosis hepática en México y países occidentales.",
                reference: "AMG Guidelines 2023"
            },
            {
                id: "gast003",
                category: "Gastroenterología",
                difficulty: "avanzado",
                question: "En hemorragia digestiva alta por varices esofágicas, ¿cuál es el tratamiento farmacológico inicial?",
                options: {
                    A: "Omeprazol IV",
                    B: "Octreotida",
                    C: "Vasopresina",
                    D: "Propranolol",
                    E: "Somatostatina"
                },
                correct: "B",
                explanation: "El octreotida (análogo de somatostatina) es el tratamiento farmacológico inicial para reducir el flujo portal.",
                reference: "Baveno VII Consensus 2023"
            },
            {
                id: "gast004",
                category: "Gastroenterología",
                difficulty: "intermedio",
                question: "¿Cuál es el marcador tumoral más útil para cáncer de páncreas?",
                options: {
                    A: "CEA",
                    B: "CA 19-9",
                    C: "CA 125",
                    D: "AFP",
                    E: "PSA"
                },
                correct: "B",
                explanation: "El CA 19-9 es el marcador tumoral más útil para el seguimiento del cáncer de páncreas, aunque no es específico.",
                reference: "NCCN Guidelines 2023"
            },
            {
                id: "gast005",
                category: "Gastroenterología",
                difficulty: "basico",
                question: "¿Cuál es el síntoma más común de reflujo gastroesofágico?",
                options: {
                    A: "Disfagia",
                    B: "Pirosis (agruras)",
                    C: "Regurgitación",
                    D: "Tos nocturna",
                    E: "Dolor torácico"
                },
                correct: "B",
                explanation: "La pirosis (sensación de quemadura retroesternal) es el síntoma más característico de ERGE.",
                reference: "ACG Clinical Guidelines 2023"
            },

            // ENDOCRINOLOGÍA
            {
                id: "endo001",
                category: "Endocrinología",
                difficulty: "intermedio",
                question: "¿Cuál es la meta de HbA1c en pacientes diabéticos adultos sin comorbilidades?",
                options: {
                    A: "< 6.0%",
                    B: "< 6.5%",
                    C: "< 7.0%",
                    D: "< 7.5%",
                    E: "< 8.0%"
                },
                correct: "C",
                explanation: "La meta de HbA1c en adultos diabéticos sin comorbilidades significativas es < 7.0%.",
                reference: "ADA Standards of Care 2023"
            },
            {
                id: "endo002",
                category: "Endocrinología",
                difficulty: "avanzado",
                question: "¿Cuál es la complicación aguda más peligrosa de la diabetes mellitus tipo 1?",
                options: {
                    A: "Hipoglucemia severa",
                    B: "Cetoacidosis diabética",
                    C: "Síndrome hiperosmolar",
                    D: "Acidosis láctica",
                    E: "Neuropatía diabética"
                },
                correct: "B",
                explanation: "La cetoacidosis diabética es la complicación aguda más peligrosa en DM tipo 1, con mortalidad del 1-5%.",
                reference: "ADA Position Statement 2023"
            },
            {
                id: "endo003",
                category: "Endocrinología",
                difficulty: "basico",
                question: "¿Cuál es el valor normal de tirotropina (TSH) en adultos?",
                options: {
                    A: "0.1-2.0 mUI/L",
                    B: "0.4-4.0 mUI/L",
                    C: "1.0-5.0 mUI/L",
                    D: "2.0-8.0 mUI/L",
                    E: "5.0-10.0 mUI/L"
                },
                correct: "B",
                explanation: "El rango normal de TSH en adultos es de 0.4-4.0 mUI/L, aunque algunos laboratorios usan 0.3-3.0.",
                reference: "ATA Guidelines 2023"
            },
            {
                id: "endo004",
                category: "Endocrinología",
                difficulty: "intermedio",
                question: "En hipertiroidismo por enfermedad de Graves, ¿cuál es el tratamiento de primera línea?",
                options: {
                    A: "Yodo radiactivo",
                    B: "Tiroidectomía",
                    C: "Metimazol",
                    D: "Propiltiouracilo",
                    E: "Beta bloqueadores"
                },
                correct: "C",
                explanation: "El metimazol es el antitiroideo de primera línea en enfermedad de Graves, excepto en embarazo.",
                reference: "ATA/AACE Guidelines 2023"
            },
            {
                id: "endo005",
                category: "Endocrinología",
                difficulty: "avanzado",
                question: "¿Cuál es el estudio de elección para diagnóstico de feocromocitoma?",
                options: {
                    A: "Catecolaminas en orina de 24 horas",
                    B: "Metanefrinas plasmáticas",
                    C: "TAC de abdomen",
                    D: "Resonancia de abdomen",
                    E: "Gammagrafía con MIBG"
                },
                correct: "B",
                explanation: "Las metanefrinas plasmáticas tienen la mayor sensibilidad y especificidad para diagnóstico de feocromocitoma.",
                reference: "Endocrine Society Guidelines 2023"
            }
        ];
    }

    // Question filtering and search
    getQuestionsByCategory(category) {
        return this.questions.filter(q => 
            q.category.toLowerCase().includes(category.toLowerCase())
        );
    }

    getQuestionsByDifficulty(difficulty) {
        return this.questions.filter(q => q.difficulty === difficulty);
    }

    searchQuestions(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.questions.filter(q => 
            q.question.toLowerCase().includes(term) ||
            q.explanation.toLowerCase().includes(term) ||
            q.category.toLowerCase().includes(term) ||
            Object.values(q.options).some(option => 
                option.toLowerCase().includes(term)
            )
        );
    }

    // Statistics
    getQuestionStats() {
        const stats = {
            total: this.questions.length,
            categories: {},
            difficulties: {}
        };

        this.questions.forEach(q => {
            // Category stats
            if (!stats.categories[q.category]) {
                stats.categories[q.category] = 0;
            }
            stats.categories[q.category]++;

            // Difficulty stats
            if (!stats.difficulties[q.difficulty]) {
                stats.difficulties[q.difficulty] = 0;
            }
            stats.difficulties[q.difficulty]++;
        });

        return stats;
    }

    // Random question selection
    getRandomQuestion() {
        const randomIndex = Math.floor(Math.random() * this.questions.length);
        return this.questions[randomIndex];
    }

    getRandomQuestionsByCategory(category, count = 5) {
        const categoryQuestions = this.getQuestionsByCategory(category);
        const shuffled = this.shuffleArray([...categoryQuestions]);
        return shuffled.slice(0, count);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Question validation
    validateQuestion(question) {
        const required = ['id', 'category', 'difficulty', 'question', 'options', 'correct', 'explanation'];
        
        for (let field of required) {
            if (!question[field]) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }

        if (!question.options.A || !question.options.B || !question.options.C || !question.options.D || !question.options.E) {
            return { valid: false, error: 'All five options (A-E) are required' };
        }

        if (!['A', 'B', 'C', 'D', 'E'].includes(question.correct)) {
            return { valid: false, error: 'Correct answer must be A, B, C, D, or E' };
        }

        if (!['basico', 'intermedio', 'avanzado'].includes(question.difficulty)) {
            return { valid: false, error: 'Difficulty must be basico, intermedio, or avanzado' };
        }

        return { valid: true };
    }

    // Add new question
    addQuestion(question) {
        const validation = this.validateQuestion(question);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Check for duplicate ID
        if (this.questions.some(q => q.id === question.id)) {
            throw new Error('Question ID already exists');
        }

        this.questions.push(question);
        return true;
    }

    // Update question
    updateQuestion(id, updatedQuestion) {
        const index = this.questions.findIndex(q => q.id === id);
        if (index === -1) {
            throw new Error('Question not found');
        }

        const validation = this.validateQuestion(updatedQuestion);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        this.questions[index] = { ...updatedQuestion, id }; // Preserve original ID
        return true;
    }

    // Delete question
    deleteQuestion(id) {
        const index = this.questions.findIndex(q => q.id === id);
        if (index === -1) {
            throw new Error('Question not found');
        }

        this.questions.splice(index, 1);
        return true;
    }

    // Export questions
    exportQuestions() {
        return JSON.stringify(this.questions, null, 2);
    }

    // Import questions
    importQuestions(questionsJson) {
        try {
            const questions = JSON.parse(questionsJson);
            
            if (!Array.isArray(questions)) {
                throw new Error('Questions must be an array');
            }

            // Validate all questions
            for (let question of questions) {
                const validation = this.validateQuestion(question);
                if (!validation.valid) {
                    throw new Error(`Invalid question ${question.id}: ${validation.error}`);
                }
            }

            this.questions = questions;
            return true;
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }
}

// Initialize question manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.questionManager = new QuestionManager();
});