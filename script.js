import { AITextDetector } from './libs/ai-text-detector/index.esm.js';

const detector = new AITextDetector();

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

    // UI de escaneo
    analyzeBtn.disabled = true;
    analyzeBtn.querySelector('.btn-glitch').textContent = 'ESCANEANDO...';
    inputPanel.classList.add('scanning');

    setTimeout(() => {
        try {
            const metrics = detector.analyzeText(text);
            const { probability, reasons } = analyzeTextAdvanced(text, metrics);
            displayResults(probability, reasons);
        } catch (error) {
            errorMessage.textContent = '[!] ERROR CRÍTICO EN EL NÚCLEO DE ANÁLISIS.';
            errorMessage.classList.remove('hidden');
            console.error(error);
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.querySelector('.btn-glitch').textContent = 'EJECUTAR ANÁLISIS';
            inputPanel.classList.remove('scanning');
        }
    }, 800); // Retardo para efecto visual
});

function analyzeTextAdvanced(text, m) {
    let score = 0;
    const reasons = [];

    // === 1. ANÁLISIS HEURÍSTICO DIRECTO (Ignora bugs de la librería) ===
    
    // Signos de exclamación/interrogación (Muy humano)
    const exclamations = (text.match(/[!¡]/g) || []).length;
    const questions = (text.match(/[?¿]/g) || []).length;
    
    // Pronombres en primera persona (Muy humano)
    const firstPerson = (text.match(/\b(yo|mi|mis|me|nosotros|nuestro|tengo|estoy|hice|fui)\b/gi) || []).length;

    // Conectores lógicos (Muy IA)
    const connectors = (text.match(/\b(además|por lo tanto|en consecuencia|asimismo|sin embargo|no obstante|en conclusión)\b/gi) || []).length;

    if (exclamations > 1 || questions > 1) {
        score -= 0.25; // Reduce drásticamente la probabilidad de IA
        reasons.push("Alta carga expresiva: Uso de exclamaciones o interrogaciones.");
    }
    if (firstPerson > 2) {
        score -= 0.2;
        reasons.push("Presencia de narrativa en primera persona y subjetividad.");
    }
    if (connectors > 1) {
        score += 0.3;
        reasons.push("Estructura altamente formal: Abuso de conectores lógicos.");
    }

    // === 2. ANÁLISIS MATEMÁTICO DE LA LIBRERÍA ===

    // Perplejidad (La IA es predecible)
    if (m.perplexity < 15) {
        score += 0.4;
        reasons.push("Baja perplejidad léxica: Patrones de palabras altamente predecibles.");
    } else if (m.perplexity > 30) {
        score -= 0.1;
        reasons.push("Alta perplejidad: Vocabulario impredecible y natural.");
    }

    // Burstiness (La IA tiene oraciones uniformes)
    if (m.burstiness < -0.1) {
        score += 0.3;
        reasons.push("Uniformidad sintáctica: Longitudes de oración idénticas.");
    } else if (m.burstiness > 0.2) {
        score -= 0.1;
        reasons.push("Variabilidad estructural: Mezcla de oraciones cortas y largas.");
    }

    // Tono Emocional
    if (m.emotionalToneVariability < 0.1) {
        score += 0.15;
        reasons.push("Tono objetivo y plano: Ausencia de marcadores emocionales.");
    }

    // === 3. NORMALIZACIÓN ===
    let finalProb = Math.min(Math.max(score, 0), 1); // Entre 0 y 1
    
    // Si es muy bajo, añadir por qué es humano
    if (finalProb < 0.3) {
        reasons.push("Fluctuación natural en la elección de palabras (Entropía alta).");
    }

    return {
        probability: Math.round(finalProb * 100),
        reasons: reasons.length ? reasons : ["Análisis completado. Sin patrones anómalos."]
    };
}

function displayResults(probability, reasons) {
    resultsSection.classList.remove('hidden');

    // Colores según el nivel
    let color, label;
    if (probability < 30) {
        color = 'var(--success)'; // Verde
        label = 'SISTEMA: AUTORÍA HUMANA';
    } else if (probability < 75) {
        color = 'var(--warning)'; // Naranja
        label = 'SISTEMA: PATRÓN INCIERTO / HÍBRIDO';
    } else {
        color = 'var(--danger)'; // Rojo
        label = 'SISTEMA: GENERACIÓN ARTIFICIAL DETECTADA';
    }

    // Aplicar variables CSS dinámicas
    document.documentElement.style.setProperty('--accent', color);
    
    resultLabel.textContent = label;
    resultLabel.style.color = color;
    percentageText.style.textShadow = `0 0 20px ${color}`;

    // Animación del velocímetro
    const offset = ARC_LENGTH - (probability / 100) * ARC_LENGTH;
    gaugeProgress.style.strokeDashoffset = offset;
    gaugeProgress.style.stroke = color;

    // Animación de la aguja (va de -90 a +90 grados)
    const rotationAngle = -90 + (probability / 100) * 180;
    gaugeNeedle.setAttribute('transform', `rotate(${rotationAngle}, 100, 100)`);
    gaugeNeedle.querySelector('polygon').fill = color;
    gaugeNeedle.querySelector('circle').fill = color;

    // Animar número
    animateValue(percentageText, 0, probability, 1200);

    // Llenar los logs
    reasonsList.innerHTML = '';
    reasons.forEach((reason, index) => {
        setTimeout(() => {
            const li = document.createElement('li');
            li.textContent = reason;
            reasonsList.appendChild(li);
        }, index * 150); // Efecto máquina de escribir en los logs
    });
}

// Función para animar el número
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // Easing out
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
