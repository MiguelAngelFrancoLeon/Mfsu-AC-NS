/**
 * test-convergence.js
 * Pruebas de convergencia y estabilidad numérica para el Modelo Fractal-Estocástico del Universo (MFSU)
 * Ecuación: ∂ψ/∂t = α(-Δ)^(∂/2)ψ + β·ξ_H(x,t)·ψ - γψ³ + f(x,t)
 */

// Clase para análisis de convergencia y estabilidad
class MFSUConvergenceAnalyzer {
    constructor() {
        this.testResults = [];
        this.epsilon = 1e-10; // Tolerancia numérica
    }

    /**
     * Implementación del operador fractal (-Δ)^(∂/2) usando aproximación espectral
     * @param {Array} psi - Vector de estado
     * @param {number} dx - Espaciado de malla
     * @param {number} order - Orden fractal ∂
     * @returns {Array} - Resultado del operador fractal
     */
    fractionalLaplacian(psi, dx, order) {
        const n = psi.length;
        const result = new Array(n).fill(0);
        
        // Aproximación del Laplaciano base usando diferencias finitas
        const laplacian = new Array(n).fill(0);
        for (let i = 1; i < n - 1; i++) {
            laplacian[i] = (psi[i+1] - 2*psi[i] + psi[i-1]) / (dx*dx);
        }
        
        // Condiciones de frontera periódicas
        laplacian[0] = (psi[1] - 2*psi[0] + psi[n-1]) / (dx*dx);
        laplacian[n-1] = (psi[0] - 2*psi[n-1] + psi[n-2]) / (dx*dx);
        
        // Aplicar la potencia fractal ∂/2
        const fracPower = order / 2;
        
        if (fracPower < 1) {
            // Aproximación de Caputo para exponentes < 1
            for (let i = 0; i < n; i++) {
                result[i] = Math.pow(Math.abs(laplacian[i]) + this.epsilon, fracPower) * Math.sign(laplacian[i]);
            }
        } else {
            // Laplaciano iterado para exponentes >= 1
            let temp = [...laplacian];
            for (let iter = 1; iter < Math.floor(fracPower); iter++) {
                for (let i = 1; i < n - 1; i++) {
                    temp[i] = (temp[i+1] - 2*temp[i] + temp[i-1]) / (dx*dx);
                }
                temp[0] = (temp[1] - 2*temp[0] + temp[n-1]) / (dx*dx);
                temp[n-1] = (temp[0] - 2*temp[n-1] + temp[n-2]) / (dx*dx);
            }
            result.splice(0, n, ...temp);
        }
        
        return result;
    }

    /**
     * Generar ruido de Hurst ξ_H(x,t) con correlaciones espaciales
     * @param {number} nx - Puntos espaciales
     * @param {number} nt - Puntos temporales
     * @param {number} hurst - Exponente de Hurst
     * @returns {Array} - Matriz de ruido correlacionado
     */
    generateHurstNoise(nx, nt, hurst = 0.5) {
        const noise = [];
        
        for (let t = 0; t < nt; t++) {
            const spatialNoise = new Array(nx);
            
            // Generar ruido espacial base
            for (let i = 0; i < nx; i++) {
                spatialNoise[i] = this.gaussianRandom();
            }
            
            // Aplicar correlaciones de Hurst
            const correlatedNoise = [...spatialNoise];
            for (let i = 1; i < nx; i++) {
                const correlation = Math.pow(i, -hurst);
                correlatedNoise[i] = correlation * correlatedNoise[i-1] + 
                                   Math.sqrt(1 - correlation*correlation) * spatialNoise[i];
            }
            
            noise.push(correlatedNoise);
        }
        
        return noise;
    }

    /**
     * Generador de números aleatorios gaussianos (Box-Muller)
     * @returns {number} - Número aleatorio gaussiano
     */
    gaussianRandom() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    /**
     * Resolver la ecuación MFSU completa
     * @param {Object} params - Parámetros del modelo
     * @param {number} nx - Puntos espaciales
     * @param {number} nt - Pasos temporales
     * @returns {Object} - Resultado de la simulación
     */
    solveMFSU(params, nx, nt) {
        const { alpha, beta, gamma, fractalDim, dt } = params;
        const dx = 1.0 / nx;
        
        // Condiciones iniciales con estructura fractal
        let psi = new Array(nx);
        for (let i = 0; i < nx; i++) {
            const x = i * dx;
            psi[i] = 0.1 * Math.sin(2 * Math.PI * x) * Math.exp(-Math.pow(x - 0.5, 2) / 0.1) +
                     0.05 * this.gaussianRandom();
        }
        
        const evolution = [];
        const hurstNoise = this.generateHurstNoise(nx, nt, 0.5);
        
        for (let t = 0; t < nt; t++) {
            // Calcular el Laplaciano fractal (-Δ)^(∂/2)
            const fractalTerm = this.fractionalLaplacian(psi, dx, fractalDim);
            
            // Función de forzamiento (puede ser personalizada)
            const forcing = new Array(nx).fill(0);
            
            // Evolución temporal usando esquema de Euler mejorado
            const psiNew = new Array(nx);
            for (let i = 0; i < nx; i++) {
                const diffusion = alpha * fractalTerm[i];
                const stochastic = beta * hurstNoise[t][i] * psi[i];
                const nonlinear = -gamma * Math.pow(psi[i], 3);
                const force = forcing[i];
                
                psiNew[i] = psi[i] + dt * (diffusion + stochastic + nonlinear + force);
            }
            
            psi = psiNew;
            
            // Almacenar evolución cada cierto número de pasos
            if (t % Math.max(1, Math.floor(nt / 100)) === 0) {
                evolution.push({
                    time: t * dt,
                    maxAmp: Math.max(...psi.map(x => Math.abs(x))),
                    l2Norm: Math.sqrt(psi.reduce((sum, x) => sum + x*x, 0)),
                    energy: this.calculateEnergy(psi, dx),
                    entropy: this.calculateEntropy(psi)
                });
            }
        }
        
        return { 
            finalPsi: psi, 
            evolution: evolution,
            stability: this.checkStability(evolution)
        };
    }

    /**
     * Calcular energía del sistema
     * @param {Array} psi - Vector de estado
     * @param {number} dx - Espaciado
     * @returns {number} - Energía total
     */
    calculateEnergy(psi, dx) {
        let energy = 0;
        const n = psi.length;
        
        for (let i = 0; i < n; i++) {
            // Energía cinética (gradiente)
            const grad = i < n-1 ? (psi[i+1] - psi[i])/dx : (psi[0] - psi[i])/dx;
            energy += 0.5 * grad * grad;
            
            // Energía potencial (no linealidad)
            energy += 0.25 * Math.pow(psi[i], 4);
        }
        
        return energy * dx;
    }

    /**
     * Calcular entropía del sistema
     * @param {Array} psi - Vector de estado
     * @returns {number} - Entropía
     */
    calculateEntropy(psi) {
        let entropy = 0;
        const norm = Math.sqrt(psi.reduce((sum, x) => sum + x*x, 0));
        
        if (norm > this.epsilon) {
            for (let i = 0; i < psi.length; i++) {
                const p = Math.abs(psi[i]) / norm;
                if (p > this.epsilon) {
                    entropy -= p * Math.log(p);
                }
            }
        }
        
        return entropy;
    }

    /**
     * Verificar estabilidad de la evolución
     * @param {Array} evolution - Datos de evolución
     * @returns {Object} - Métricas de estabilidad
     */
    checkStability(evolution) {
        if (evolution.length < 2) return { isStable: false, growthRate: 0 };
        
        const initialAmp = evolution[0].maxAmp;
        const finalAmp = evolution[evolution.length - 1].maxAmp;
        const growthRate = Math.log(finalAmp / initialAmp) / evolution.length;
        
        return {
            isStable: finalAmp < 10 * initialAmp,
            growthRate: growthRate,
            amplificationFactor: finalAmp / initialAmp
        };
    }

    /**
     * Análisis de convergencia espacial
     * @param {Object} params - Parámetros del modelo
     * @returns {Array} - Datos de convergencia
     */
    analyzeConvergence(params) {
        const meshSizes = [16, 32, 64, 128, 256];
        const nt = 1000;
        const convergenceData = [];
        let referenceSolution = null;
        
        console.log('Iniciando análisis de convergencia...');
        
        for (let i = 0; i < meshSizes.length; i++) {
            const nx = meshSizes[i];
            console.log(`Resolviendo para malla ${nx}x${nt}...`);
            
            const result = this.solveMFSU(params, nx, nt);
            
            if (i === meshSizes.length - 1) {
                referenceSolution = result.finalPsi;
            }
            
            // Calcular error L2 comparando con solución previa más fina
            if (i > 0) {
                const coarseGrid = result.finalPsi;
                const prevResult = this.solveMFSU(params, meshSizes[i-1], nt);
                const fineGrid = prevResult.finalPsi;
                
                const error = this.calculateL2Error(coarseGrid, fineGrid);
                
                convergenceData.push({
                    meshSize: nx,
                    error: error,
                    order: Math.log2(nx),
                    stability: result.stability
                });
            }
        }
        
        // Calcular orden de convergencia
        if (convergenceData.length > 1) {
            for (let i = 1; i < convergenceData.length; i++) {
                const ratio = convergenceData[i-1].error / convergenceData[i].error;
                convergenceData[i].convergenceOrder = Math.log2(ratio);
            }
        }
        
        return convergenceData;
    }

    /**
     * Calcular error L2 entre dos soluciones
     * @param {Array} coarse - Solución en malla gruesa
     * @param {Array} fine - Solución en malla fina
     * @returns {number} - Error L2
     */
    calculateL2Error(coarse, fine) {
        let error = 0;
        const ratio = fine.length / coarse.length;
        
        for (let i = 0; i < coarse.length; i++) {
            const fineIndex = Math.floor(i * ratio);
            const diff = coarse[i] - fine[fineIndex];
            error += diff * diff;
        }
        
        return Math.sqrt(error / coarse.length);
    }

    /**
     * Análisis de estabilidad temporal
     * @param {Object} params - Parámetros del modelo
     * @returns {Object} - Resultados de estabilidad
     */
    analyzeStability(params) {
        const nx = 64;
        const nt = 2000;
        
        console.log('Analizando estabilidad temporal...');
        const result = this.solveMFSU(params, nx, nt);
        
        const stabilityMetrics = {
            evolution: result.evolution,
            stability: result.stability,
            cflCondition: this.checkCFLCondition(params, 1.0/nx),
            vonNeumannStability: this.vonNeumannAnalysis(params, 1.0/nx)
        };
        
        return stabilityMetrics;
    }

    /**
     * Verificar condición CFL
     * @param {Object} params - Parámetros del modelo
     * @param {number} dx - Espaciado espacial
     * @returns {Object} - Análisis CFL
     */
    checkCFLCondition(params, dx) {
        const { alpha, beta, gamma, fractalDim, dt } = params;
        
        // Condición CFL modificada para operadores fraccionarios
        const fractalFactor = Math.pow(dx, -fractalDim);
        const maxDt = 0.1 * dx * dx / (alpha * fractalFactor + beta + gamma);
        
        return {
            maxAllowedDt: maxDt,
            currentDt: dt,
            satisfiesCFL: dt <= maxDt,
            cflRatio: dt / maxDt
        };
    }

    /**
     * Análisis de estabilidad von Neumann
     * @param {Object} params - Parámetros del modelo
     * @param {number} dx - Espaciado espacial
     * @returns {Object} - Análisis von Neumann
     */
    vonNeumannAnalysis(params, dx) {
        const { alpha, beta, gamma, fractalDim, dt } = params;
        const kValues = [];
        const amplificationFactors = [];
        
        // Analizar diferentes modos de Fourier
        for (let k = 1; k <= 10; k++) {
            const omega = 2 * Math.PI * k / (1.0); // Dominio unitario
            const lambda = Math.pow(omega, fractalDim) * alpha;
            
            // Factor de amplificación linealizado
            const amplification = Math.abs(1 - dt * lambda);
            
            kValues.push(k);
            amplificationFactors.push(amplification);
        }
        
        const maxAmplification = Math.max(...amplificationFactors);
        
        return {
            kValues: kValues,
            amplificationFactors: amplificationFactors,
            maxAmplification: maxAmplification,
            isStable: maxAmplification <= 1.0
        };
    }

    /**
     * Ejecutar suite completa de pruebas
     * @param {Object} params - Parámetros del modelo
     * @returns {Object} - Resultados completos
     */
    runFullAnalysis(params) {
        console.log('=== ANÁLISIS COMPLETO DE CONVERGENCIA Y ESTABILIDAD ===');
        console.log('Parámetros:', params);
        
        const startTime = performance.now();
        
        // Análisis de convergencia
        const convergenceResults = this.analyzeConvergence(params);
        
        // Análisis de estabilidad
        const stabilityResults = this.analyzeStability(params);
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        const results = {
            convergence: convergenceResults,
            stability: stabilityResults,
            executionTime: executionTime,
            summary: this.generateSummary(convergenceResults, stabilityResults)
        };
        
        this.testResults.push(results);
        return results;
    }

    /**
     * Generar resumen de resultados
     * @param {Array} convergenceData - Datos de convergencia
     * @param {Object} stabilityData - Datos de estabilidad
     * @returns {Object} - Resumen
     */
    generateSummary(convergenceData, stabilityData) {
        const avgConvergenceOrder = convergenceData.reduce((sum, d) => 
            sum + (d.convergenceOrder || 0), 0) / convergenceData.length;
        
        const isConvergent = avgConvergenceOrder > 0.5;
        const isStable = stabilityData.stability.isStable && 
                        stabilityData.cflCondition.satisfiesCFL;
        
        return {
            isConvergent: isConvergent,
            isStable: isStable,
            averageConvergenceOrder: avgConvergenceOrder,
            recommendedTimeStep: stabilityData.cflCondition.maxAllowedDt,
            overallAssessment: isConvergent && isStable ? 'EXITOSO' : 'REQUIERE AJUSTES'
        };
    }

    /**
     * Mostrar resultados en consola
     * @param {Object} results - Resultados del análisis
     */
    displayResults(results) {
        console.log('\n=== RESULTADOS DEL ANÁLISIS ===');
        console.log(`Tiempo de ejecución: ${results.executionTime.toFixed(2)} ms`);
        console.log(`Orden de convergencia promedio: ${results.summary.averageConvergenceOrder.toFixed(3)}`);
        console.log(`Es convergente: ${results.summary.isConvergent ? 'SÍ' : 'NO'}`);
        console.log(`Es estable: ${results.summary.isStable ? 'SÍ' : 'NO'}`);
        console.log(`Paso temporal recomendado: ${results.summary.recommendedTimeStep.toExponential(3)}`);
        console.log(`Evaluación general: ${results.summary.overallAssessment}`);
        
        console.log('\n=== DATOS DE CONVERGENCIA ===');
        results.convergence.forEach((item, idx) => {
            console.log(`Malla ${item.meshSize}: Error = ${item.error.toExponential(3)}, ` +
                       `Orden = ${(item.convergenceOrder || 0).toFixed(3)}`);
        });
    }

    /**
     * Exportar resultados a JSON
     * @returns {string} - Resultados en formato JSON
     */
    exportResults() {
        return JSON.stringify(this.testResults, null, 2);
    }
}

// Función de prueba principal
function runConvergenceTests() {
    const analyzer = new MFSUConvergenceAnalyzer();
    
    // Configuraciones de prueba
    const testConfigs = [
        {
            name: 'Configuración estándar',
            params: {
                alpha: 1.0,
                beta: 0.1,
                gamma: 0.1,
                fractalDim: 0.921,
                dt: 0.01
            }
        },
        {
            name: 'Alta difusión',
            params: {
                alpha: 2.0,
                beta: 0.05,
                gamma: 0.1,
                fractalDim: 1.2,
                dt: 0.005
            }
        },
        {
            name: 'Alto ruido',
            params: {
                alpha: 0.5,
                beta: 0.3,
                gamma: 0.2,
                fractalDim: 0.8,
                dt: 0.002
            }
        }
    ];
    
    // Ejecutar pruebas
    testConfigs.forEach(config => {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`PRUEBA: ${config.name}`);
        console.log(`${'='.repeat(50)}`);
        
        const results = analyzer.runFullAnalysis(config.params);
        analyzer.displayResults(results);
    });
    
    // Exportar resultados
    console.log('\n=== EXPORTACIÓN DE RESULTADOS ===');
    console.log('Resultados exportados a JSON:');
    console.log(analyzer.exportResults());
    
    return analyzer;
}

// Exportar para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MFSUConvergenceAnalyzer, runConvergenceTests };
}

// Ejecutar pruebas si se ejecuta directamente
if (typeof window === 'undefined') {
    runConvergenceTests();
}
