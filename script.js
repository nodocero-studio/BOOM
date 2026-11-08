import { detectAIText } from './libs/ai-text-detector/index.esm.js';

const textInput = document.getElementById('text-input');
const analyzeBtn = document.getElementById('analyze-btn');
const errorMessage = document.getElementById('error-message');
const resultsSection = document.getElementById('results-section');
const gaugeProgress = document.getElementById('gauge-progress');
const gaugeNeedle = document.getElementById('gauge-needle');
const percentageText = document.getElementById('percentage-text');
const resultLabel = document.getElementById('result-label');
const reasonsList = document.getElementById('reasons-list');

// Longitud del arco del velocímetro (semi-circunferencia de radio 80)
// Fórmula: PI * r = 3.1416 * 80 = 251.32
const ARC_LENGTH = 251.32;

analyzeBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    
    // Limpiar UI anterior
    errorMessage.classList.add('hidden');
    resultsSection.classList.add('hidden');
    
    if (!text) {
        showError('Por favor, pega un texto para analizar.');
        return;
    }

    // Estado de carga
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analizando...';

    // Usar setTimeout para permitir que la UI se actualice antes del procesamiento pesado
    setTimeout(() => {
        try {
            const result = detectAIText(text);
            displayResults(result);
        } catch (error) {
            showError(error.message || 'Ocurrió un error al analizar el texto.');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analizar Texto';
        }
    }, 50);
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function displayResults(result) {
    // result.confidence es un valor entre 0 y 1 (probabilidad de IA)
    const probability = Math.round(result.confidence * 100);
    
    // Mostrar sección de resultados
    resultsSection.classList.remove('hidden');

    // 1. Animación del número
    animateValue(percentageText, 0, probability, 1000);

    // 2. Actualizar colores y etiquetas basados en el porcentaje
    let color, label;
    if (probability < 30) {
        color = 'var(--success)'; // Verde (Humano)
        label = 'Probablemente Humano';
    } else if (probability < 70) {
        color = 'var(--warning)'; // Amarillo (Incierto)
        label = 'Contenido Mixto / Incierto';
    } else {
        color = 'var(--danger)'; // Rojo (IA)
        label = 'Probablemente Generado por IA';
    }

    resultLabel.textContent = label;
    resultLabel.style.color = color;

    // 3. Animación del arco (Stroke Dashoffset)
    // A mayor probabilidad de IA, más se llena el arco.
    const offset = ARC_LENGTH - (probability / 100) * ARC_LENGTH;
    gaugeProgress.style.strokeDashoffset = offset;
    gaugeProgress.style.stroke = color;

    // 4. Animación de la aguja (Rotación)
    // Va de -90 grados (0%) a +90 grados (100%)
    const rotationAngle = -90 + (probability / 100) * 180;
    gaugeNeedle.setAttribute('transform', `rotate(${rotationAngle}, 100, 100)`);

    // 5. Mostrar razones
    reasonsList.innerHTML = '';
    if (result.reasons && result.reasons.length > 0) {
        result.reasons.forEach(reason => {
            const li = document.createElement('li');
            li.textContent = reason;
            reasonsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No se detectaron patrones significativos.';
        reasonsList.appendChild(li);
    }
}

// Función auxiliar para animar el número del porcentaje
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // Easing out cubic
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);
        obj.innerHTML = Math.floor(easeOutProgress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}