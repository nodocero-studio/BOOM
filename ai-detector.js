/**
 * MOTOR DE DETECCIÓN DE IA - DESDE CERO
 * Análisis estilométrico y heurístico offline.
 */

export function analyzeText(text) {
    const cleanText = text.trim();
    if (!cleanText) return { probability: 0, reasons: [] };

    const words = cleanText.toLowerCase().replace(/[.,!?¿¡"'()]/g, '').split(/\s+/).filter(w => w);
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (words.length < 10) return { probability: 50, reasons: ["Texto demasiado corto."] };

    let aiScore = 0; // Puntos a favor de la IA
    let humanScore = 0; // Puntos a favor del humano
    const reasons = [];

    // === 1. BURSTINESS (Variabilidad de longitud de oraciones) ===
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length;
    const variance = sentenceLengths.reduce((a, b) => a + Math.pow(b - avgLen, 2), 0) / sentences.length;
    const stdDev = Math.sqrt(variance);
    const burstiness = (stdDev - avgLen) / (stdDev + avgLen);

    if (burstiness < 0.1) {
        aiScore += 30;
        reasons.push("Sintaxis uniforme: Longitud de oraciones muy constante (típico de IA).");
    } else if (burstiness > 0.4) {
        humanScore += 25;
        reasons.push("Alta variabilidad sintáctica: Mezcla natural de oraciones cortas y largas.");
    }

    // === 2. LÉXICO Y COMPLEJIDAD ===
    const uniqueWords = new Set(words);
    const lexicalDiversity = uniqueWords.size / words.length;
    const longWords = words.filter(w => w.length > 7).length;
    
    if (longWords / words.length > 0.2) {
        aiScore += 15;
        reasons.push("Vocabulario excesivamente complejo o académico.");
    }

    // === 3. INDICADORES HUMANOS (Expresividad, emociones, coloquialismos) ===
    const exclamations = (cleanText.match(/[!¡]/g) || []).length;
    const questions = (cleanText.match(/[?¿]/g) || []).length;
    const firstPerson = (cleanText.match(/\b(yo|mi|mis|me|nosotros|nuestro|tengo|estoy|hice|fui|siento|pienso)\b/gi) || []).length;
    const contractions = (cleanText.match(/\b\w+(?:'|’)(?:s|t|re|ve|ll|d|m)\b/gi) || []).length;
    const slang = (cleanText.match(/\b(lol|jaja|tbh|wtf|o sea|pues|bueno|tipo|neta|gonna|wanna)\b/gi) || []).length;

    if (exclamations > 1 || questions > 1) {
        humanScore += 25;
        reasons.push("Carga expresiva detectada: Uso de exclamaciones o preguntas.");
    }
    if (firstPerson > 2) {
        humanScore += 20;
        reasons.push("Subjetividad: Presencia notable de primera persona.");
    }
    if (contractions > 1 || slang > 0) {
        humanScore += 20;
        reasons.push("Lenguaje coloquial o uso de contracciones.");
    }

    // === 4. INDICADORES ARTIFICIALES (Conectores formales) ===
    const formalConnectors = (cleanText.match(/\b(además|por lo tanto|en consecuencia|asimismo|sin embargo|no obstante|en conclusión|por consiguiente|en resumen|cabe destacar)\b/gi) || []).length;
    if (formalConnectors > 1) {
        aiScore += 25;
        reasons.push("Estructura académica: Abuso de conectores lógicos formales.");
    }

    // === 5. CÁLCULO FINAL (Normalización de 0 a 100) ===
    // Base 50/50, aplicamos los pesos
    let probability = 50 + (aiScore - humanScore);
    
    // Limitar estrictamente entre 0 y 100
    probability = Math.max(0, Math.min(100, probability));

    // Si la probabilidad es menor a 20 o mayor a 80, limpiamos las razones
    // para mostrar solo las más contundentes.
    if (probability > 80) {
        reasons.unshift("Patrón algorítmico y predecible detectado.");
    } else if (probability < 20) {
        reasons.unshift("Patrón orgánico, irregular y humano detectado.");
    }

    if (reasons.length === 0) {
        reasons.push("Texto equilibrado, no se detectan sesgos claros de autoría.");
    }

    return {
        probability: Math.round(probability),
        reasons: reasons
    };
}
