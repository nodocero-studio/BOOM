import { AITextDetector } from './libs/ai-text-detector/index.esm.js';

// Instanciamos la clase de la librería
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

const ARC_LENGTH = 251.32;

analyzeBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    
    errorMessage.classList.add('hidden');
    resultsSection.classList.add('hidden');
    
    if (text.length < 50) {
        showError('El texto es demasiado corto. Pega al menos 50 caracteres para un análisis fiable.');
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analizando...';

    setTimeout(() => {
        try {
            // 1. Obtenemos todas las métricas crudas de la librería
            const metrics = detector.analyzeText(text);
            
            // 2. Calculamos nuestra propia probabilidad equilibrada
            const { probability, reasons } = calculateBalancedProbability(metrics);
            
            // 3. Mostramos los resultados
            displayResults(probability, reasons);
        } catch (error) {
            showError('Ocurrió un error al analizar el texto.');
            console.error(error);
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

// NUEVA LÓGICA DE PUNTUACIÓN (Ignoramos las listas de palabras rotas de la librería)
function calculateBalancedProbability(m) {
    let score = 0; // Empezamos en 0 (0% IA, 100% Humano)
    const reasons = [];

    // 1. Perplejidad (Perplexity)
    // La IA tiende a tener perplejidad baja (predecible). Los humanos, alta (impredecible).
    if (m.perplexity < 15) {
        score += 0.35;
        reasons.push("Baja perplejidad: El texto utiliza palabras muy predecibles, típico de la IA.");
    } else if (m.perplexity < 30) {
        score += 0.15;
    } else {
        reasons.push("Alta perplejidad: Uso de vocabulario impredecible, típico de humanos.");
    }

    // 2. Burstiness (Variabilidad de las oraciones)
    // La IA escribe oraciones de longitud muy similar. Los humanos variamos mucho.
    if (m.burstiness < -0.1) {
        score += 0.3;
        reasons.push("Baja variabilidad (Burstiness): Las oraciones tienen longitudes muy uniformes.");
    } else if (m.burstiness > 0.3) {
        reasons.push("Alta variabilidad: Mezcla natural de oraciones cortas y largas.");
    } else {
        score += 0.1;
    }

    // 3. Densidad de conectores lógicos
    // La IA abusa de palabras como "sin embargo", "por lo tanto", "además".
    if (m.transitionDensity > 2.5) {
        score += 0.2;
        reasons.push("Uso excesivo de conectores lógicos (transiciones).");
    }

    // 4. Variabilidad Emocional
    // La IA suele ser muy neutra. Los humanos usamos más exclamaciones, signos y emociones.
    if (m.emotionalToneVariability < 0.1) {
        score += 0.15;
        reasons.push("Tono emocional muy plano y objetivo.");
    } else if (m.emotionalToneVariability > 0.3) {
        reasons.push("Expresividad emocional natural.");
    }

    // 5. Repetición de N-gramas (Frases repetidas)
    if (m.nGramRepetition > 0.15) {
        score += 0.1;
        reasons.push("Patrones de repetición de palabras detectados.");
    }

    // Normalizar entre 0 y 1
    let finalProb = Math.min(Math.max(score, 0), 1);
    
    // Si la probabilidad es muy baja, añadir razones humanas positivas
    if (finalProb < 0.3) {
        reasons.push("Variación natural en la estructura de las frases.");
        if (m.lexicalDiversity > 0.7) reasons.push("Vocabulario muy rico y diverso.");
    }

    return {
        probability: Math.round(finalProb * 100),
        reasons: reasons
    };
}

function displayResults(probability, reasons) {
    resultsSection.classList.remove('hidden');

    // Animación del número
    animateValue(percentageText, 0, probability, 1000);

    // Colores
    let color, label;
    if (probability < 30) {
        color = 'var(--success)'; // Verde
        label = 'Probablemente Humano';
    } else if (probability < 70) {
        color = 'var(--warning)'; // Amarillo
        label = 'Contenido Incierto / Mixto';
    } else {
        color = 'var(--danger)'; // Rojo
        label = 'Probablemente Generado por IA';
    }

    resultLabel.textContent = label;
    resultLabel.style.color = color;

    // Animación del velocímetro (Arco)
    const offset = ARC_LENGTH - (probability / 100) * ARC_LENGTH;
    gaugeProgress.style.strokeDashoffset = offset;
    gaugeProgress.style.stroke = color;

    // Animación de la aguja (Rotación)
    const rotationAngle = -90 + (probability / 100) * 180;
    gaugeNeedle.setAttribute('transform', `rotate(${rotationAngle}, 100, 100)`);

    // Lista de razones
    reasonsList.innerHTML = '';
    reasons.forEach(reason => {
        const li = document.createElement('li');
        li.textContent = reason;
        reasonsList.appendChild(li);
    });
}

// Función auxiliar para animar el número
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
