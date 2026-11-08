import { analyzeText } from './ai-detector.js';

const textInput = document.getElementById('text-input');
const analyzeBtn = document.getElementById('analyze-btn');
const errorMessage = document.getElementById('error-message');
const resultsSection = document.getElementById('results-section');
const gaugeProgress = document.getElementById('gauge-progress');
const gaugeNeedle = document.getElementById('gauge-needle');
const percentageText = document.getElementById('percentage-text');
const resultLabel = document.getElementById('result-label');
const reasonsList = document.getElementById('reasons-list');
const inputPanel = document.querySelector('.input-panel');

const ARC_LENGTH = 251.32;

analyzeBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    
    errorMessage.classList.add('hidden');
    resultsSection.classList.add('hidden');
    
    if (text.length < 50) {
        errorMessage.textContent = '[!] ERROR: TEXTO DEMASIADO CORTO (MIN 50 CARACTERES).';
        errorMessage.classList.remove('hidden');
        return;
    }

    // Animación de escaneo
    analyzeBtn.disabled = true;
    analyzeBtn.querySelector('.btn-glitch').textContent = 'ESCANEANDO...';
    inputPanel.classList.add('scanning');

    setTimeout(() => {
        try {
            // Usar nuestra nueva librería desde cero
            const result = analyzeText(text);
            displayResults(result.probability, result.reasons);
        } catch (error) {
            errorMessage.textContent = '[!] ERROR CRÍTICO EN EL NÚCLEO DE ANÁLISIS.';
            errorMessage.classList.remove('hidden');
            console.error(error);
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.querySelector('.btn-glitch').textContent = 'EJECUTAR ANÁLISIS';
            inputPanel.classList.remove('scanning');
        }
    }, 800);
});

function displayResults(probability, reasons) {
    resultsSection.classList.remove('hidden');

    // Asignación de colores
    let color, label;
    if (probability < 35) {
        color = 'var(--success)'; // Verde (Humano)
        label = 'SISTEMA: AUTORÍA HUMANA';
    } else if (probability < 70) {
        color = 'var(--warning)'; // Naranja (Incierto)
        label = 'SISTEMA: PATRÓN INCIERTO / HÍBRIDO';
    } else {
        color = 'var(--danger)'; // Rojo (IA)
        label = 'SISTEMA: GENERACIÓN ARTIFICIAL DETECTADA';
    }

    // Actualizar colores dinámicamente en el CSS
    document.documentElement.style.setProperty('--accent', color);
    
    resultLabel.textContent = label;
    resultLabel.style.color = color;
    percentageText.style.textShadow = `0 0 20px ${color}`;

    // Mover el arco del velocímetro
    const offset = ARC_LENGTH - (probability / 100) * ARC_LENGTH;
    gaugeProgress.style.strokeDashoffset = offset;
    gaugeProgress.style.stroke = color;

    // Rotar la aguja (-90 a +90 grados)
    const rotationAngle = -90 + (probability / 100) * 180;
    gaugeNeedle.setAttribute('transform', `rotate(${rotationAngle}, 100, 100)`);
    gaugeNeedle.querySelector('polygon').fill = color;
    gaugeNeedle.querySelector('circle').fill = color;

    // Animar número
    animateValue(percentageText, 0, probability, 1200);

    // Imprimir logs estilo terminal
    reasonsList.innerHTML = '';
    reasons.forEach((reason, index) => {
        setTimeout(() => {
            const li = document.createElement('li');
            li.textContent = reason;
            reasonsList.appendChild(li);
        }, index * 150);
    });
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
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
