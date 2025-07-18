/**
 * MFSU Solver - Modelo Fractal-Estocástico del Universo
 * 
 * Resuelve la ecuación: ∂ψ/∂t = α(-Δ)^(∂/2)ψ + β·ξ_H(x,t)·ψ - γψ³ + f(x,t)
 * 
 * @author MFSU Research Team
 * @version 1.0.0
 */

class MFSUSolver {
    constructor(options = {}) {
        this.defaultParams = {
            alpha: 1.0,        // Parámetro de difusión fractal
            beta: 0.1,         // Intensidad del ruido de Hurst
            gamma: 0.1,        // Parámetro de no-linealidad
            fractalDim: 0.921, // Dimensión fractal ∂
            dt: 0.01,          // Paso temporal
            hurst: 0.5         // Exponente de Hurst
        };
        
        this.params = { ...this.defaultParams, ...options };
        this.tolerance = 1e-10;
    }

    /**
     * Implementación del operador fractal (-Δ)^(∂/2)
     * @param {Array} psi - Función de onda
     * @param {number} dx - Espaciado de malla
     * @param {number} order - Orden fractal ∂
     * @returns {Array} Resultado del operador fractal
     */
    fractionalLaplacian(psi, dx, order) {
        const n = psi.length;
        const result = new Array(n).fill(0);
        
        // Calcular el Laplaciano base usando diferencias finitas
        const laplacian = new Array(n).fill(0);
        
        // Puntos internos
        for (let i = 1; i < n - 1; i++) {
            laplacian[i] = (psi[i + 1] - 2 * psi[i] + psi[i - 1]) / (dx * dx);
        }
        
        // Condiciones de frontera periódicas
        laplacian[0] = (psi[1] - 2 * psi[0] + psi[n - 1]) / (dx * dx);
        laplacian[n - 1] = (psi[0] - 2 * psi[n - 1] + psi[n - 2]) / (dx * dx);
        
        // Aplicar la potencia fractal ∂/2
        const fracPower = order / 2;
        
        if (fracPower < 1) {
            // Aproximación de Caputo para exponentes < 1
            for (let i = 0; i < n; i++) {
                const absLap = Math.abs(laplacian[i]) + this.tolerance;
                result[i] = Math.pow(absLap, fracPower) * Math.sign(laplacian[i]);
            }
        } else {
            // Laplaciano iterado para exponentes >= 1
            let current = [...laplacian];
            
            for (let iter = 1; iter < Math.floor(fracPower); iter++) {
                const temp = new Array(n).fill(0);
                
                for (let i = 1; i < n - 1; i++) {
                    temp[i] = (current[i + 1] - 2 * current[i] + current[i - 1]) / (dx * dx);
                }
                
                temp[0] = (current[1] - 2 * current[0] + current[n - 1]) / (dx * dx);
                temp[n - 1] = (current[0] - 2 * current[n - 1] + current[n - 2]) / (dx * dx);
                
                current = temp;
            }
            
            result.splice(0, n, ...current);
        }
        
        return result;
    }

    /**
     * Genera ruido de Hurst ξ_H(x,t) con correlaciones espaciales
     * @param {number} nx - Puntos espaciales
     * @param {number} nt - Puntos temporales
     * @param {number} hurst - Exponente de Hurst
     * @returns {Array} Matriz de ruido 2D
     */
    generateHurstNoise(nx, nt, hurst = 0.5) {
        const noise = [];
        
        for (let t = 0; t < nt; t++) {
            const spatialNoise = new Array(nx);
            
            // Generar ruido blanco inicial
            for (let i = 0; i < nx; i++) {
                spatialNoise[i] = this.gaussianRandom();
            }
            
            // Aplicar correlaciones de Hurst
            const correlatedNoise = [...spatialNoise];
            for (let i = 1; i < nx; i++) {
                const correlation = Math.pow(i, -hurst);
                const normalization = Math.sqrt(1 - correlation * correlation);
                
                correlatedNoise[i] = correlation * correlatedNoise[i - 1] + 
                                   normalization * spatialNoise[i];
            }
            
            noise.push(correlatedNoise);
        }
        
        return noise;
    }

    /**
     * Genera números aleatorios con distribución gaussiana
     * @returns {number} Número aleatorio gaussiano
     */
    gaussianRandom() {
        // Método Box-Muller
        if (this.hasSpareGaussian) {
            this.hasSpareGaussian = false;
            return this.spareGaussian;
        }
        
        this.hasSpareGaussian = true;
        const u = Math.random();
        const v = Math.random();
        const mag = Math.sqrt(-2 * Math.log(u));
        
        this.spareGaussian = mag * Math.cos(2 * Math.PI * v);
        return mag * Math.sin(2 * Math.PI * v);
    }

    /**
     * Genera condiciones iniciales con estructura fractal
     * @param {number} nx - Número de puntos espaciales
     * @param {string} type - Tipo de condición inicial
     * @returns {Array} Condición inicial
     */
    generateInitialCondition(nx, type = 'fractal') {
        const psi = new Array(nx);
        const dx = 1.0 / nx;
        
        switch (type) {
            case 'fractal':
                for (let i = 0; i < nx; i++) {
                    const x = i * dx;
                    // Estructura fractal con múltiples escalas
                    psi[i] = 0.1 * Math.sin(2 * Math.PI * x) * Math.exp(-Math.pow(x - 0.5, 2) / 0.1) +
                             0.05 * Math.sin(8 * Math.PI * x) * Math.exp(-Math.pow(x - 0.3, 2) / 0.05) +
                             0.02 * (this.gaussianRandom());
                }
                break;
                
            case 'gaussian':
                for (let i = 0; i < nx; i++) {
                    const x = i * dx;
                    psi[i] = Math.exp(-Math.pow(x - 0.5, 2) / 0.1) + 0.01 * this.gaussianRandom();
                }
                break;
                
            case 'soliton':
                for (let i = 0; i < nx; i++) {
                    const x = i * dx;
                    psi[i] = 1.0 / Math.cosh(10 * (x - 0.5)) + 0.01 * this.gaussianRandom();
                }
                break;
                
            default:
                for (let i = 0; i < nx; i++) {
                    psi[i] = this.gaussianRandom() * 0.1;
                }
        }
        
        return psi;
    }

    /**
     * Función de forzamiento f(x,t)
     * @param {number} x - Posición espacial
     * @param {number} t - Tiempo
     * @param {string} type - Tipo de forzamiento
     * @returns {number} Valor del forzamiento
     */
    forcingFunction(x, t, type = 'none') {
        switch (type) {
            case 'periodic':
                return 0.01 * Math.sin(2 * Math.PI * t) * Math.exp(-Math.pow(x - 0.5, 2) / 0.1);
                
            case 'pulse':
                const width = 0.05;
                const center = 0.5;
                return (t < 1.0) ? Math.exp(-Math.pow(x - center, 2) / width) : 0;
                
            case 'none':
            default:
                return 0;
        }
    }

    /**
     * Resolver la ecuación MFSU completa
     * @param {Object} params - Parámetros de la ecuación
     * @param {number} nx - Puntos espaciales
     * @param {number} nt - Pasos temporales
     * @param {Object} options - Opciones adicionales
     * @returns {Object} Resultado de la simulación
     */
    solve(params = {}, nx = 64, nt = 1000, options = {}) {
        const config = { ...this.params, ...params };
        const { alpha, beta, gamma, fractalDim, dt, hurst } = config;
        
        const dx = 1.0 / nx;
        const initialType = options.initialCondition || 'fractal';
        const forcingType = options.forcingType || 'none';
        const saveInterval = options.saveInterval || 10;
        
        // Condiciones iniciales
        let psi = this.generateInitialCondition(nx, initialType);
        
        // Generar ruido de Hurst
        const hurstNoise = this.generateHurstNoise(nx, nt, hurst);
        
        // Almacenar evolución
        const evolution = [];
        const diagnostics = {
            energy: [],
            momentum: [],
            mass: [],
            maxAmplitude: [],
            l2Norm: []
        };
        
        // Evolución temporal
        for (let t = 0; t < nt; t++) {
            const currentTime = t * dt;
            
            // Calcular términos de la ecuación
            const fractalTerm = this.fractionalLaplacian(psi, dx, fractalDim);
            const psiNew = new Array(nx);
            
            for (let i = 0; i < nx; i++) {
                const x = i * dx;
                
                // Término de difusión fractal
                const diffusion = alpha * fractalTerm[i];
                
                // Término estocástico
                const stochastic = beta * hurstNoise[t][i] * psi[i];
                
                // Término no-lineal
                const nonlinear = -gamma * Math.pow(psi[i], 3);
                
                // Término de forzamiento
                const forcing = this.forcingFunction(x, currentTime, forcingType);
                
                // Integración temporal (Euler)
                psiNew[i] = psi[i] + dt * (diffusion + stochastic + nonlinear + forcing);
            }
            
            psi = psiNew;
            
            // Guardar diagnósticos
            if (t % saveInterval === 0) {
                const diagnosticData = this.calculateDiagnostics(psi, dx);
                
                evolution.push({
                    time: currentTime,
                    psi: [...psi],
                    ...diagnosticData
                });
                
                Object.keys(diagnosticData).forEach(key => {
                    if (diagnostics[key]) {
                        diagnostics[key].push(diagnosticData[key]);
                    }
                });
            }
        }
        
        return {
            finalPsi: psi,
            evolution: evolution,
            diagnostics: diagnostics,
            parameters: config,
            metadata: {
                nx: nx,
                nt: nt,
                dx: dx,
                dt: dt,
                totalTime: nt * dt
            }
        };
    }

    /**
     * Calcula diagnósticos físicos de la solución
     * @param {Array} psi - Función de onda
     * @param {number} dx - Espaciado de malla
     * @returns {Object} Diagnósticos calculados
     */
    calculateDiagnostics(psi, dx) {
        const n = psi.length;
        
        // Norma L2 (masa conservada)
        const l2Norm = Math.sqrt(psi.reduce((sum, val) => sum + val * val, 0) * dx);
        
        // Amplitud máxima
        const maxAmplitude = Math.max(...psi.map(Math.abs));
        
        // Energía total
        let energy = 0;
        for (let i = 0; i < n; i++) {
            const nextI = (i + 1) % n;
            const grad = (psi[nextI] - psi[i]) / dx;
            const kinetic = 0.5 * grad * grad;
            const potential = 0.25 * Math.pow(psi[i], 4);
            energy += (kinetic + potential) * dx;
        }
        
        // Momento (para soluciones complejas, aquí simplificado)
        let momentum = 0;
        for (let i = 0; i < n; i++) {
            const nextI = (i + 1) % n;
            const grad = (psi[nextI] - psi[i]) / dx;
            momentum += psi[i] * grad * dx;
        }
        
        return {
            energy: energy,
            momentum: momentum,
            mass: l2Norm,
            maxAmplitude: maxAmplitude,
            l2Norm: l2Norm
        };
    }

    /**
     * Análisis de convergencia espacial
     * @param {Object} params - Parámetros de la ecuación
     * @param {Array} meshSizes - Tamaños de malla a probar
     * @returns {Object} Datos de convergencia
     */
    analyzeConvergence(params = {}, meshSizes = [16, 32, 64, 128]) {
        const nt = 1000;
        const convergenceData = [];
        const solutions = [];
        
        // Resolver para cada tamaño de malla
        for (let i = 0; i < meshSizes.length; i++) {
            const nx = meshSizes[i];
            const result = this.solve(params, nx, nt);
            solutions.push(result);
        }
        
        // Calcular errores usando la solución más fina como referencia
        const referenceSolution = solutions[solutions.length - 1];
        
        for (let i = 0; i < solutions.length - 1; i++) {
            const coarseSolution = solutions[i];
            const error = this.calculateL2Error(
                coarseSolution.finalPsi,
                referenceSolution.finalPsi
            );
            
            convergenceData.push({
                meshSize: meshSizes[i],
                error: error,
                order: Math.log2(meshSizes[i]),
                solution: coarseSolution
            });
        }
        
        // Calcular orden de convergencia
        const convergenceOrder = this.calculateConvergenceOrder(convergenceData);
        
        return {
            data: convergenceData,
            order: convergenceOrder,
            referenceSolution: referenceSolution
        };
    }

    /**
     * Calcula el error L2 entre dos soluciones
     * @param {Array} coarse - Solución en malla gruesa
     * @param {Array} fine - Solución en malla fina
     * @returns {number} Error L2
     */
    calculateL2Error(coarse, fine) {
        const nCoarse = coarse.length;
        const nFine = fine.length;
        
        if (nCoarse === nFine) {
            // Mismo tamaño de malla
            let error = 0;
            for (let i = 0; i < nCoarse; i++) {
                error += Math.pow(coarse[i] - fine[i], 2);
            }
            return Math.sqrt(error / nCoarse);
        } else {
            // Interpolar solución fina a malla gruesa
            let error = 0;
            for (let i = 0; i < nCoarse; i++) {
                const fineIndex = (i * nFine) / nCoarse;
                const lowerIndex = Math.floor(fineIndex);
                const upperIndex = Math.ceil(fineIndex);
                
                let interpolatedValue;
                if (lowerIndex === upperIndex) {
                    interpolatedValue = fine[lowerIndex];
                } else {
                    const weight = fineIndex - lowerIndex;
                    interpolatedValue = (1 - weight) * fine[lowerIndex] + weight * fine[upperIndex];
                }
                
                error += Math.pow(coarse[i] - interpolatedValue, 2);
            }
            return Math.sqrt(error / nCoarse);
        }
    }

    /**
     * Calcula el orden de convergencia
     * @param {Array} convergenceData - Datos de convergencia
     * @returns {number} Orden de convergencia
     */
    calculateConvergenceOrder(convergenceData) {
        if (convergenceData.length < 2) return 0;
        
        const n = convergenceData.length;
        const lastTwo = convergenceData.slice(-2);
        
        const h1 = 1.0 / lastTwo[0].meshSize;
        const h2 = 1.0 / lastTwo[1].meshSize;
        const e1 = lastTwo[0].error;
        const e2 = lastTwo[1].error;
        
        if (e1 === 0 || e2 === 0) return 0;
        
        return Math.log(e1 / e2) / Math.log(h1 / h2);
    }

    /**
     * Análisis de estabilidad temporal
     * @param {Object} params - Parámetros de la ecuación
     * @param {number} nx - Puntos espaciales
     * @param {number} maxTime - Tiempo máximo de simulación
     * @returns {Object} Datos de estabilidad
     */
    analyzeStability(params = {}, nx = 64, maxTime = 20.0) {
        const nt = Math.floor(maxTime / params.dt) || 2000;
        const result = this.solve(params, nx, nt);
        
        // Analizar crecimiento de amplitud
        const amplitudes = result.diagnostics.maxAmplitude;
        const times = result.evolution.map(e => e.time);
        
        const initialAmp = amplitudes[0];
        const finalAmp = amplitudes[amplitudes.length - 1];
        
        // Detectar explosión numérica
        const isStable = finalAmp < 10 * initialAmp && !amplitudes.some(amp => !isFinite(amp));
        
        // Calcular tasa de crecimiento
        const growthRate = Math.log(finalAmp / initialAmp) / maxTime;
        
        // Detectar oscilaciones
        const oscillationDetected = this.detectOscillations(amplitudes);
        
        return {
            isStable: isStable,
            growthRate: growthRate,
            initialAmplitude: initialAmp,
            finalAmplitude: finalAmp,
            oscillationDetected: oscillationDetected,
            evolution: result.evolution,
            diagnostics: result.diagnostics
        };
    }

    /**
     * Detecta oscilaciones en la amplitud
     * @param {Array} amplitudes - Serie temporal de amplitudes
     * @returns {boolean} True si se detectan oscilaciones
     */
    detectOscillations(amplitudes) {
        if (amplitudes.length < 10) return false;
        
        let oscillations = 0;
        for (let i = 1; i < amplitudes.length - 1; i++) {
            const prev = amplitudes[i - 1];
            const curr = amplitudes[i];
            const next = amplitudes[i + 1];
            
            if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
                oscillations++;
            }
        }
        
        // Si más del 20% de los puntos son extremos locales, hay oscilaciones
        return oscillations > 0.2 * amplitudes.length;
    }

    /**
     * Exporta resultados a formato JSON
     * @param {Object} result - Resultado de la simulación
     * @returns {string} JSON string
     */
    exportResults(result) {
        return JSON.stringify(result, null, 2);
    }

    /**
     * Importa parámetros desde JSON
     * @param {string} jsonString - String JSON con parámetros
     * @returns {Object} Parámetros importados
     */
    importParameters(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            return { ...this.defaultParams, ...imported };
        } catch (error) {
            console.error('Error importing parameters:', error);
            return this.defaultParams;
        }
    }
}

// Clase utilitaria para visualización y análisis
class MFSUAnalyzer {
    constructor(solver) {
        this.solver = solver;
    }

    /**
     * Genera reporte de convergencia
     * @param {Object} convergenceResult - Resultado del análisis de convergencia
     * @returns {string} Reporte en texto
     */
    generateConvergenceReport(convergenceResult) {
        const { data, order } = convergenceResult;
        
        let report = "=== REPORTE DE CONVERGENCIA MFSU ===\n\n";
        report += `Orden de convergencia estimado: ${order.toFixed(3)}\n\n`;
        
        report += "Errores por tamaño de malla:\n";
        data.forEach(item => {
            report += `  nx = ${item.meshSize}: Error L2 = ${item.error.toExponential(3)}\n`;
        });
        
        report += "\nInterpretación:\n";
        if (order > 1.5) {
            report += "- Convergencia de segundo orden (muy buena)\n";
        } else if (order > 0.8) {
            report += "- Convergencia de primer orden (aceptable)\n";
        } else {
            report += "- Convergencia lenta o problemática\n";
        }
        
        return report;
    }

    /**
     * Genera reporte de estabilidad
     * @param {Object} stabilityResult - Resultado del análisis de estabilidad
     * @returns {string} Reporte en texto
     */
    generateStabilityReport(stabilityResult) {
        const { isStable, growthRate, initialAmplitude, finalAmplitude, oscillationDetected } = stabilityResult;
        
        let report = "=== REPORTE DE ESTABILIDAD MFSU ===\n\n";
        report += `Estado: ${isStable ? 'ESTABLE' : 'INESTABLE'}\n`;
        report += `Tasa de crecimiento: ${growthRate.toExponential(3)}\n`;
        report += `Amplitud inicial: ${initialAmplitude.toFixed(4)}\n`;
        report += `Amplitud final: ${finalAmplitude.toFixed(4)}\n`;
        report += `Oscilaciones detectadas: ${oscillationDetected ? 'SÍ' : 'NO'}\n\n`;
        
        report += "Diagnóstico:\n";
        if (isStable) {
            report += "- El esquema numérico es estable\n";
            if (oscillationDetected) {
                report += "- Se detectaron oscilaciones (posible resonancia)\n";
            }
        } else {
            report += "- ADVERTENCIA: Esquema inestable\n";
            report += "- Considere reducir el paso temporal\n";
        }
        
        return report;
    }

    /**
     * Calcula estadísticas de la solución
     * @param {Array} psi - Función de onda
     * @returns {Object} Estadísticas
     */
    calculateStatistics(psi) {
        const n = psi.length;
        const mean = psi.reduce((sum, val) => sum + val, 0) / n;
        const variance = psi.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const std = Math.sqrt(variance);
        const min = Math.min(...psi);
        const max = Math.max(...psi);
        const range = max - min;
        
        // Calcular momentos superiores
        const skewness = psi.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / n;
        const kurtosis = psi.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / n - 3;
        
        return {
            mean: mean,
            std: std,
            variance: variance,
            min: min,
            max: max,
            range: range,
            skewness: skewness,
            kurtosis: kurtosis
        };
    }
}

// Exportar las clases
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MFSUSolver, MFSUAnalyzer };
} else if (typeof window !== 'undefined') {
    window.MFSUSolver = MFSUSolver;
    window.MFSUAnalyzer = MFSUAnalyzer;
}

// Ejemplo de uso
if (typeof module !== 'undefined' && require.main === module) {
    console.log("=== EJEMPLO DE USO DEL SOLVER MFSU ===");
    
    const solver = new MFSUSolver();
    const analyzer = new MFSUAnalyzer(solver);
    
    // Parámetros de ejemplo
    const params = {
        alpha: 1.0,
        beta: 0.1,
        gamma: 0.1,
        fractalDim: 0.921,
        dt: 0.01
    };
    
    console.log("Ejecutando simulación...");
    const result = solver.solve(params, 64, 1000);
    
    console.log("Analizando convergencia...");
    const convergence = solver.analyzeConvergence(params);
    
    console.log("Analizando estabilidad...");
    const stability = solver.analyzeStability(params);
    
    console.log("\n" + analyzer.generateConvergenceReport(convergence));
    console.log("\n" + analyzer.generateStabilityReport(stability));
    
    const stats = analyzer.calculateStatistics(result.finalPsi);
    console.log("\n=== ESTADÍSTICAS DE LA SOLUCIÓN FINAL ===");
    console.log(`Media: ${stats.mean.toFixed(6)}`);
    console.log(`Desviación estándar: ${stats.std.toFixed(6)}`);
    console.log(`Rango: [${stats.min.toFixed(6)}, ${stats.max.toFixed(6)}]`);
    console.log(`Asimetría: ${stats.skewness.toFixed(6)}`);
    console.log(`Curtosis: ${stats.kurtosis.toFixed(6)}`);
}
