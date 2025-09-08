# Guía de Contribución - ENARM Prep

¡Gracias por tu interés en contribuir a ENARM Prep! Esta guía te ayudará a comenzar con el desarrollo y contribución al proyecto.

## 🎯 Formas de Contribuir

### 1. 📝 Contenido Médico
- **Agregar nuevas preguntas** con explicaciones detalladas
- **Mejorar explicaciones** existentes con referencias actualizadas
- **Corregir errores** médicos o de contenido
- **Agregar nuevas especialidades** médicas

### 2. 🐛 Reportar Errores
- **Bugs en la funcionalidad**
- **Problemas de diseño** o responsive
- **Errores de contenido** médico
- **Problemas de rendimiento**

### 3. 💡 Nuevas Funcionalidades
- **Nuevos modos de estudio**
- **Calculadoras médicas** adicionales
- **Mejoras en la interfaz** de usuario
- **Funcionalidades de accesibilidad**

### 4. 📚 Documentación
- **Mejorar README**
- **Agregar ejemplos** de uso
- **Traducir contenido**
- **Crear tutoriales**

## 🚀 Configuración del Entorno de Desarrollo

### Prerrequisitos
- **Git** instalado
- **Navegador web** moderno (Chrome, Firefox, Safari, Edge)
- **Servidor local** (Python, Node.js, o PHP)
- **Editor de código** (VS Code recomendado)

### Configuración Inicial

1. **Fork del repositorio**
```bash
# Clona tu fork
git clone https://github.com/TU_USUARIO/enarm-prep.git
cd enarm-prep

# Agrega el repositorio original como remote
git remote add upstream https://github.com/USUARIO_ORIGINAL/enarm-prep.git
```

2. **Configurar servidor local**
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js
npx http-server -p 8000

# Con PHP
php -S localhost:8000
```

3. **Abrir en navegador**
```
http://localhost:8000
```

### Extensiones Recomendadas para VS Code
- **Live Server** - Para servidor de desarrollo
- **Prettier** - Formateo de código
- **ESLint** - Linting de JavaScript
- **CSS Peek** - Navegación de CSS
- **Auto Rename Tag** - Edición de HTML
- **GitLens** - Herramientas avanzadas de Git

## 📋 Proceso de Contribución

### 1. Antes de Empezar
- [ ] **Revisa issues existentes** para evitar trabajo duplicado
- [ ] **Crea un issue** para discutir cambios grandes
- [ ] **Lee las guías de estilo** de código
- [ ] **Entiende la arquitectura** del proyecto

### 2. Desarrollo
```bash
# Crea una rama para tu contribución
git checkout -b feature/nueva-funcionalidad

# O para corrección de bugs
git checkout -b fix/corregir-error

# O para contenido médico
git checkout -b content/agregar-preguntas-cardiologia
```

### 3. Hacer Cambios
- **Sigue las guías de estilo** establecidas
- **Escribe comentarios** claros en el código
- **Prueba en diferentes dispositivos** y navegadores
- **Mantén commits atómicos** y descriptivos

### 4. Testing
```bash
# Pruebas básicas que debes realizar
- ✅ La aplicación carga correctamente
- ✅ Todas las páginas/secciones funcionan
- ✅ Responsive design en móviles
- ✅ Funcionalidad offline (si aplicable)
- ✅ Modo oscuro/claro funciona
- ✅ No hay errores en la consola del navegador
```

### 5. Commit y Push
```bash
# Staging de cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: agregar calculadora de índice tobillo-brazo"

# Push a tu fork
git push origin feature/nueva-funcionalidad
```

### 6. Pull Request
1. **Ve a GitHub** y crea un Pull Request
2. **Llena la plantilla** de PR completamente
3. **Asigna reviewers** si conoces a alguien del equipo
4. **Espera revisión** y feedback

## 🎨 Guías de Estilo

### HTML
```html
<!-- ✅ Correcto -->
<div class="question-container">
    <h3 class="question-text">¿Cuál es el diagnóstico?</h3>
    <div class="question-options">
        <!-- contenido -->
    </div>
</div>

<!-- ❌ Incorrecto -->
<div class=question-container>
<h3 class=question-text>¿Cuál es el diagnóstico?</h3>
<div class=question-options>
<!-- contenido -->
</div>
</div>
```

### CSS
```css
/* ✅ Correcto - Usar variables CSS */
.primary-button {
    background-color: var(--primary-color);
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
}

/* ❌ Evitar - Valores hardcodeados */
.primary-button {
    background-color: #2563eb;
    padding: 16px;
    border-radius: 12px;
}
```

### JavaScript
```javascript
// ✅ Correcto - Funciones descriptivas y comentarios
/**
 * Calcula la puntuación de una sesión de práctica
 * @param {Array} results - Array de resultados de preguntas
 * @returns {Object} Objeto con estadísticas de la sesión
 */
function calculateSessionScore(results) {
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const totalQuestions = results.length;
    
    return {
        correct: correctAnswers,
        total: totalQuestions,
        percentage: Math.round((correctAnswers / totalQuestions) * 100)
    };
}

// ❌ Evitar - Código sin comentarios y nombres poco descriptivos
function calc(r) {
    let c = r.filter(x => x.isCorrect).length;
    return c / r.length * 100;
}
```

## 📊 Agregando Contenido Médico

### Estructura de Preguntas
```json
{
    "id": "especialidad###",
    "category": "Nombre de Especialidad",
    "difficulty": "basico|intermedio|avanzado",
    "question": "Pregunta clara y concisa (max 200 caracteres)",
    "options": {
        "A": "Opción A (max 100 caracteres)",
        "B": "Opción B (max 100 caracteres)",
        "C": "Opción C (max 100 caracteres)",
        "D": "Opción D (max 100 caracteres)",
        "E": "Opción E (max 100 caracteres)"
    },
    "correct": "B",
    "explanation": "Explicación detallada del por qué es correcta esta respuesta (max 500 caracteres)",
    "reference": "Fuente médica confiable y actualizada"
}
```

### Criterios de Calidad para Preguntas

#### ✅ Buena Pregunta
- **Clara y específica**
- **Basada en evidencia** médica actual
- **Opciones plausibles** sin trucos
- **Explicación educativa**
- **Referencia confiable**

#### ❌ Evitar
- Preguntas ambiguas o mal redactadas
- Contenido médico desactualizado
- Opciones obviamente incorrectas
- Explicaciones vagas
- Referencias no confiables

### Fuentes Médicas Confiables
- **Guías de Práctica Clínica** oficiales
- **UpToDate**
- **PubMed** (artículos peer-reviewed)
- **Cochrane Library**
- **Sociedades médicas** especializadas
- **Libros de texto** reconocidos

## 🧪 Testing y Quality Assurance

### Checklist de Testing
```markdown
#### Funcionalidad Básica
- [ ] Navegación entre páginas
- [ ] Sistema de preguntas funciona
- [ ] Progreso se guarda correctamente
- [ ] Flashcards funcionan
- [ ] Calculadoras dan resultados correctos

#### Responsive Design
- [ ] Móvil (320px+)
- [ ] Tablet (768px+)
- [ ] Desktop (1024px+)
- [ ] Pantallas grandes (1440px+)

#### Navegadores
- [ ] Chrome (últimas 2 versiones)
- [ ] Firefox (últimas 2 versiones)
- [ ] Safari (últimas 2 versiones)
- [ ] Edge (últimas 2 versiones)

#### Accesibilidad
- [ ] Navegación por teclado
- [ ] Contraste de colores adecuado
- [ ] Screen readers (básico)
- [ ] Etiquetas ARIA apropiadas

#### Performance
- [ ] Carga inicial < 3 segundos
- [ ] Sin errores en consola
- [ ] Service Worker funciona
- [ ] Cache funciona offline
```

## 📝 Mensajes de Commit

Usa el formato [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Nuevas funcionalidades
git commit -m "feat: agregar modo de examen cronometrado"

# Corrección de bugs
git commit -m "fix: corregir cálculo de porcentaje en progreso"

# Contenido médico
git commit -m "content: agregar 20 preguntas de neurología"

# Mejoras de performance
git commit -m "perf: optimizar carga de preguntas"

# Refactoring
git commit -m "refactor: reorganizar sistema de navegación"

# Documentación
git commit -m "docs: actualizar README con nuevas funcionalidades"

# Estilos
git commit -m "style: mejorar diseño de tarjetas de progreso"
```

## 🔄 Proceso de Revisión

### Para Contribuyentes
1. **Crea PR** con descripción detallada
2. **Responde a feedback** de manera constructiva
3. **Realiza cambios** solicitados
4. **Mantén el PR actualizado** con main branch

### Para Reviewers
1. **Revisar funcionalidad** y código
2. **Probar en diferentes dispositivos**
3. **Verificar contenido médico** si aplicable
4. **Dar feedback constructivo**
5. **Aprobar cuando esté listo**

## 🏆 Reconocimiento de Contribuyentes

Los contribuyentes son reconocidos de las siguientes maneras:

### 🥇 Contributors Wall
- Nombre en el README
- Link a perfil de GitHub
- Descripción de contribución

### 🏅 Badges Especiales
- **First Contributor** - Primera contribución
- **Medical Expert** - Contenido médico de calidad
- **Bug Hunter** - Encuentra y reporta bugs
- **Documentation Hero** - Mejoras en documentación
- **UI/UX Guru** - Mejoras en diseño

### 📊 GitHub Stats
- Issues resueltos
- Pull Requests aceptados
- Líneas de código contribuidas

## 📞 Obtener Ayuda

### 💬 Canales de Comunicación
- **GitHub Issues** - Para reportar bugs o solicitar features
- **GitHub Discussions** - Para preguntas generales
- **Email** - contacto@enarm-prep.com (si está disponible)

### 📚 Recursos Útiles
- [Documentación de HTML5](https://developer.mozilla.org/docs/Web/HTML)
- [Guía de CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [JavaScript moderno](https://javascript.info/)
- [Service Workers](https://developers.google.com/web/fundamentals/primers/service-workers)

## 🤝 Código de Conducta

### Nuestros Valores
- **Respeto** hacia todos los contribuyentes
- **Colaboración** constructiva
- **Inclusión** de diferentes perspectivas
- **Profesionalismo** en todas las interacciones

### Comportamientos Esperados
- Usar lenguaje inclusivo y respetuoso
- Ser abierto a diferentes puntos de vista
- Dar y recibir feedback constructivo
- Enfocar en el contenido, no en la persona

### Comportamientos Inaceptables
- Lenguaje ofensivo o discriminatorio
- Acoso de cualquier tipo
- Ataques personales
- Spam o contenido irrelevante

## 🎉 ¡Empezar a Contribuir!

¿Listo para contribuir? ¡Excelente! Aquí tienes algunos issues perfectos para comenzar:

- **Good First Issue** - Ideal para nuevos contribuyentes
- **Help Wanted** - Necesitamos ayuda específica
- **Content Needed** - Faltan preguntas de ciertas especialidades
- **Bug** - Problemas que necesitan arreglo

### Próximos Pasos
1. **Lee esta guía** completamente
2. **Configura tu entorno** de desarrollo
3. **Encuentra un issue** que te interese
4. **¡Comienza a contribuir!**

---

**¿Tienes preguntas sobre esta guía?** Abre un issue con la etiqueta `question` y te ayudaremos.

**¡Gracias por hacer ENARM Prep mejor para toda la comunidad médica! 🏥💙**