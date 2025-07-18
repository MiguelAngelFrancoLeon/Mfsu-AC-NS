/**
 * stability-analysis.js
 * Análisis de Estabilidad Numérica para el Modelo Fractal-Estocástico del Universo (MFSU)
 * Ecuación: ∂ψ/∂t = α(-Δ)^(∂/2)ψ + β·ξ_H(x,t)·ψ - γψ³ + f(x,t)
 */

class StabilityAnalysis {
    constructor() {
        this.results = null;
        this.evolutionData = [];
        this.stabilityMetrics = {};
        this.initialized = false;
    }

    /**
     * Inicializar el analizador de estabilidad
     */
    initialize() {
        if (this.initialized) return;
        
        this.setupAnalysisMethods();
        this.initialized = true;
        console.log('Stability Analysis initialized');
    }

    /**
     * Configurar métodos de análisis
     */
    setupAnalysisMethods() {
        this.analysisMethods = {
            vonNeumann: this.vonNeumannAnalysis.bind(this),
            lyapunov: this.lyapunovAnalysis.bind(this),
            energy: this.energyAnalysis.bind(this),
            spectral: this.spectralAnalysis.bind(this),
            statistical: this.statisticalAnalysis.bind(this)
        };
    }

    /**
     * Análisis completo de estabilidad
     */
    async analyzeStability(params, options = {}) {
        const defaultOptions = {
            nx: 64,
            nt: 2000,
            methods: ['vonNeumann', 'lyapunov', 'energy', 'spectral', 'statistical'],
            perturbationAmplitude: 1e-6,
            saveEvolution: true
        };

        const opts = { ...defaultOptions, ...options };
        
        // Ejecutar simulación principal
        const mainSimulation = await this.runStabilitySimulation(params, opts);
        
        // Análisis con perturbaciones
        const perturbedSimulation = await this.runPerturbedSimulation(params, opts);
        
        // Ejecutar análisis específicos
        const analysisResults = {};
        for (const method of opts.methods) {
            if (this.analysisMethods[method]) {
                analysisResults[method] = await this.analysisMethods[method](
                    mainSimulation, perturbedSimulation, params, opts
                );
            }
        }

        // Compilar resultados finales
        this.results = this.compileResults(analysisResults, mainSimulation, params);
        
        return this.results;
    }

    /**
     * Ejecutar simulación principal para análisis de estabilidad
     */
    async runStabilitySimulation(params, options) {
        const { nx, nt } = options;
        const dx = 1.0 / nx;
        const dt = params.dt;

        // Condiciones iniciales con múltiples modos
        let psi = this.generateInitialConditions(nx, 'multimode');
        const evolution = [];
        const hurstNoise = this.generateHurstNoise(nx, nt, 0.5);

        // Métricas de evolución
        const metrics = {
            maxAmplitude: [],
            l2Norm: [],
            energy: [],
            entropy: [],
            enstrophy: []
        };

        for (let t = 0; t < nt; t++) {
            // Evolución temporal
            psi = this.evolveTimeStep(psi, params, dx, dt, hurstNoise[t]);

            // Calcular métricas cada 10 pasos
            if (t % 10 === 0) {
                const stepMetrics = this.calculateStepMetrics(psi, dx, t * dt);
                
                Object.keys(metrics).forEach(key => {
                    metrics[key].push(stepMetrics[key]);
                });

                if (options.saveEvolution) {
                    evolution.push({
                        time: t * dt,
                        psi: [...psi],
                        metrics: stepMetrics
                    });
                }
            }

            // Verificar estabilidad durante la evolución
            const maxAmp = Math.max(...psi.map(x => Math.abs(x)));
            if (maxAmp > 1e6) {
                console.warn(`Simulación inestable en t=${t*dt}, max amplitude: ${maxAmp}`);
                break;
            }
        }

        return {
            finalPsi: psi,
            evolution: evolution,
            metrics: metrics,
            isStable: this.assessBasicStability(metrics)
        };
    }

    /**
     * Ejecutar simulación con perturbaciones
     */
    async runPerturbedSimulation(params, options) {
        const { nx, nt, perturbationAmplitude } = options;
        const dx = 1.0 / nx;
        const dt = params.dt;

        // Condiciones iniciales perturbadas
        let psi = this.generateInitialConditions(nx, 'multimode');
        const perturbation = this.generatePerturbation(nx, perturbationAmplitude);
        psi = psi.map((val, i) => val + perturbation[i]);

        const evolution = [];
        const hurstNoise = this.generateHurstNoise(nx, nt, 0.5);

        for (let t = 0; t < nt; t++) {
            psi = this.evolveTimeStep(psi, params, dx, dt, hurstNoise[t]);

            if (t % 10 === 0) {
                const stepMetrics = this.calculateStepMetrics(psi, dx, t * dt);
                evolution.push({
                    time: t * dt,
                    psi: [...psi],
                    metrics: stepMetrics
                });
            }

            const maxAmp = Math.max(...psi.map(x => Math.abs(x)));
            if (maxAmp > 1e6) break;
        }

        return {
            finalPsi: psi,
            evolution: evolution,
            perturbationAmplitude: perturbationAmplitude
        };
    }

    /**
     * Evolucionar un paso temporal
     */
    evolveTimeStep(psi, params, dx, dt, noise) {
        const { alpha, beta, gamma, fractalDim } = params;
        const nx = psi.length;

        // Calcular el Laplaciano fractal (-Δ)^(∂/2)
        const fractalTerm = this.fractionalLaplacian(psi, dx, fractalDim);

        // Evolución usando método de Euler mejorado
        const psiNew = new Array(nx);
        for (let i = 0; i < nx; i++) {
            const diffusion = alpha * fractalTerm[i];
            const stochastic = beta * noise[i] * psi[i];
            const nonlinear = -gamma * Math.pow(psi[i], 3);
            const forcing = 0; // Puede ser modificado según el problema

            psiNew[i] = psi[i] + dt * (diffusion + stochastic + nonlinear + forcing);
        }

        return psiNew;
    }

    /**
     * Operador Laplaciano fractal (-Δ)^(∂/2)
     */
    fractionalLaplacian(psi, dx, order) {
        const n = psi.length;
        const result = new Array(n).fill(0);

        // Laplaciano base con diferencias finitas
        const laplacian = new Array(n).fill(0);
        for (let i = 1; i < n - 1; i++) {
            laplacian[i] = (psi[i+1] - 2*psi[i] + psi[i-1]) / (dx*dx);
        }

        // Condiciones de frontera periódicas
        laplacian[0] = (psi[1] - 2*psi[0] + psi[n-1]) / (dx*dx);
        laplacian[n-1] = (psi[0] - 2*psi[n-1] + psi[n-2]) / (dx*dx);

        // Aplicar potencia fractal
        const fracPower = order / 2;
        
        if (fracPower < 1) {
            // Aproximación de Caputo para exponentes fraccionarios
            for (let i = 0; i < n; i++) {
                const magnitude = Math.abs(laplacian[i]) + 1e-12;
                result[i] = Math.pow(magnitude, fracPower) * Math.sign(laplacian[i]);
            }
        } else {
            // Laplaciano iterado para exponentes enteros
            let temp = [...laplacian];
            for (let iter = 1; iter < Math.floor(fracPower); iter++) {
                for (let i = 1; i < n - 1; i++) {
                    temp[i] = (temp[i+1] - 2*temp[i] + temp[i-1]) / (dx*dx);
                }
                temp[0] = (temp[1] - 2*temp[0] + temp[n-1]) / (dx*dx);
                temp[n-1] = (temp[0] - 2*temp[n-1] + temp[n-2]) / (dx*dx);
            }
            result = temp;
        }

        return result;
    }

    /**
     * Análisis de Von Neumann (estabilidad lineal)
     */
    vonNeumannAnalysis(mainSim, perturbedSim, params, options) {
        const { alpha, beta, gamma, fractalDim, dt } = params;
        const dx = 1.0 / options.nx;

        // Análisis de modos de Fourier
        const modes = [];
        const kMax = Math.PI / dx;
        
        for (let m = 1; m <= 10; m++) {
            const k = m * Math.PI / (options.nx * dx);
            
            // Factor de amplificación para el modo k
            const diffusionFactor = alpha * Math.pow(k*k, fractalDim/2);
            const stochasticFactor = beta * Math.sqrt(dt); // Aproximación del ruido
            
            // Factor de amplificación total
            const amplificationFactor = 1 - dt * diffusionFactor + dt * stochasticFactor;
            
            modes.push({
                mode: m,
                wavenumber: k,
                amplification: amplificationFactor,
                isStable: Math.abs(amplificationFactor) <= 1
            });
        }

        const unstableModes = modes.filter(m => !m.isStable);
        const maxAmplification = Math.max(...modes.map(m => Math.abs(m.amplification)));

        return {
            modes: modes,
            unstableModes: unstableModes,
            maxAmplification: maxAmplification,
            isStable: unstableModes.length === 0,
            courantNumber: alpha * dt / (dx * dx)
        };
    }

    /**
     * Análisis de Lyapunov (sensibilidad a perturbaciones)
     */
    lyapunovAnalysis(mainSim, perturbedSim, params, options) {
        const evolution1 = mainSim.evolution;
        const evolution2 = perturbedSim.evolution;
        
        const lyapunovExponents = [];
        const separations = [];

        for (let i = 0; i < Math.min(evolution1.length, evolution2.length); i++) {
            const psi1 = evolution1[i].psi;
            const psi2 = evolution2[i].psi;
            
            // Calcular separación
            const separation = Math.sqrt(
                psi1.reduce((sum, val, idx) => sum + Math.pow(val - psi2[idx], 2), 0)
            );
            
            separations.push(separation);
            
            // Calcular exponente de Lyapunov local
            if (i > 0 && separations[i-1] > 0) {
                const dt = evolution1[i].time - evolution1[i-1].time;
                const lyapExp = Math.log(separations[i] / separations[i-1]) / dt;
                lyapunovExponents.push(lyapExp);
            }
        }

        // Exponente de Lyapunov promedio
        const avgLyapunov = lyapunovExponents.length > 0 ? 
            lyapunovExponents.reduce((sum, exp) => sum + exp, 0) / lyapunovExponents.length : 0;

        return {
            lyapunovExponents: lyapunovExponents,
            averageLyapunov: avgLyapunov,
            separations: separations,
            isStable: avgLyapunov <= 0,
            maxSeparation: Math.max(...separations),
            perturbationGrowth: separations[separations.length-1] / separations[0]
        };
    }

    /**
     * Análisis de energía
     */
    energyAnalysis(mainSim, perturbedSim, params, options) {
        const evolution = mainSim.evolution;
        const energies = evolution.map(step => step.metrics.energy);
        
        // Calcular cambio de energía
        const energyChanges = [];
        for (let i = 1; i < energies.length; i++) {
            energyChanges.push(energies[i] - energies[i-1]);
        }

        // Energía promedio y varianza
        const avgEnergy = energies.reduce((sum, e) => sum + e, 0) / energies.length;
        const energyVariance = energies.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / energies.length;

        // Tasa de cambio de energía
        const energyGrowthRate = energies.length > 1 ? 
            (energies[energies.length-1] - energies[0]) / (evolution[evolution.length-1].time - evolution[0].time) : 0;

        return {
            energies: energies,
            energyChanges: energyChanges,
            averageEnergy: avgEnergy,
            energyVariance: energyVariance,
            energyGrowthRate: energyGrowthRate,
            isStable: Math.abs(energyGrowthRate) < 1e-3,
            energyConservation: Math.abs(energyGrowthRate) < 1e-6
        };
    }

    /**
     * Análisis espectral
     */
    spectralAnalysis(mainSim, perturbedSim, params, options) {
        const finalPsi = mainSim.finalPsi;
        const n = finalPsi.length;

        // Calcular FFT (aproximación simple)
        const spectrum = this.computeSpectrum(finalPsi);
        
        // Analizar distribución espectral
        const spectralEntropy = this.calculateSpectralEntropy(spectrum);
        const dominantModes = this.findDominantModes(spectrum, 5);
        
        // Índice de turbulencia espectral
        const turbulenceIndex = this.calculateTurbulenceIndex(spectrum);

        return {
            spectrum: spectrum,
            spectralEntropy: spectralEntropy,
            dominantModes: dominantModes,
            turbulenceIndex: turbulenceIndex,
            isStable: spectralEntropy < 10 && turbulenceIndex < 0.5
        };
    }

    /**
     * Análisis estadístico
     */
    statisticalAnalysis(mainSim, perturbedSim, params, options) {
        const evolution = mainSim.evolution;
        const maxAmplitudes = evolution.map(step => step.metrics.maxAmplitude);
        
        // Estadísticas básicas
        const mean = maxAmplitudes.reduce((sum, val) => sum + val, 0) / maxAmplitudes.length;
        const variance = maxAmplitudes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / maxAmplitudes.length;
        const skewness = this.calculateSkewness(maxAmplitudes);
        const kurtosis = this.calculateKurtosis(maxAmplitudes);

        // Análisis de tendencias
        const trend = this.calculateTrend(maxAmplitudes);
        const autocorrelation = this.calculateAutocorrelation(maxAmplitudes, 10);

        return {
            mean: mean,
            variance: variance,
            standardDeviation: Math.sqrt(variance),
            skewness: skewness,
            kurtosis: kurtosis,
            trend: trend,
            autocorrelation: autocorrelation,
            isStable: Math.abs(trend) < 1e-4 && variance < mean * 0.1
        };
    }

    /**
     * Métodos auxiliares
     */
    generateInitialConditions(nx, type = 'multimode') {
        const psi = new Array(nx);
        const dx = 1.0 / nx;

        switch (type) {
            case 'multimode':
                for (let i = 0; i < nx; i++) {
                    const x = i * dx;
                    psi[i] = 0.1 * Math.sin(2 * Math.PI * x) * Math.exp(-Math.pow(x - 0.5, 2) / 0.1) +
                             0.05 * Math.sin(4 * Math.PI * x) +
                             0.02 * Math.sin(8 * Math.PI * x) +
                             0.01 * (Math.random() - 0.5);
                }
                break;
            case 'gaussian':
                for (let i = 0; i < nx; i++) {
                    const x = i * dx;
                    psi[i] = Math.exp(-Math.pow(x - 0.5, 2) / 0.05);
                }
                break;
            case 'random':
                for (let i = 0; i < nx; i++) {
                    psi[i] = 0.1 * (Math.random() - 0.5);
                }
                break;
        }

        return psi;
    }

    generatePerturbation(nx, amplitude) {
        const perturbation = new Array(nx);
        for (let i = 0; i < nx; i++) {
            perturbation[i] = amplitude * (Math.random() - 0.5);
        }
        return perturbation;
    }

    generateHurstNoise(nx, nt, hurst = 0.5) {
        const noise = [];
        
        for (let t = 0; t < nt; t++) {
            const spatialNoise = new Array(nx);
            
            for (let i = 0; i < nx; i++) {
                spatialNoise[i] = Math.random() - 0.5;
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

    calculateStepMetrics(psi, dx, time) {
        const n = psi.length;
        
        // Amplitud máxima
        const maxAmplitude = Math.max(...psi.map(x => Math.abs(x)));
        
        // Norma L2
        const l2Norm = Math.sqrt(psi.reduce((sum, x) => sum + x*x, 0));
        
        // Energía total
        let energy = 0;
        for (let i = 0; i < n; i++) {
            const grad = i < n-1 ? psi[i+1] - psi[i] : psi[0] - psi[i];
            energy += 0.5 * grad*grad / (dx*dx) + 0.25 * Math.pow(psi[i], 4);
        }
        
        // Entropía
        const entropy = this.calculateEntropy(psi);
        
        // Enstrofía (vorticidad al cuadrado)
        const enstrophy = psi.reduce((sum, x) => sum + x*x, 0);

        return {
            maxAmplitude,
            l2Norm,
            energy,
            entropy,
            enstrophy
        };
    }

    calculateEntropy(psi) {
        const probabilities = psi.map(x => Math.abs(x) * Math.abs(x));
        const total = probabilities.reduce((sum, p) => sum + p, 0);
        
        if (total === 0) return 0;
        
        const normalizedProbs = probabilities.map(p => p / total);
        return -normalizedProbs.reduce((sum, p) => {
            return sum + (p > 0 ? p * Math.log(p) : 0);
        }, 0);
    }

    assessBasicStability(metrics) {
        const maxAmps = metrics.maxAmplitude;
        const finalAmp = maxAmps[maxAmps.length - 1];
        const initialAmp = maxAmps[0];
        
        return finalAmp < 10 * initialAmp && !isNaN(finalAmp) && isFinite(finalAmp);
    }

    compileResults(analysisResults, mainSimulation, params) {
        const overallStability = Object.values(analysisResults).every(result => result.isStable);
        
        return {
            isStable: overallStability,
            confidence: this.calculateConfidence(analysisResults),
            analysisResults: analysisResults,
            mainSimulation: mainSimulation,
            parameters: params,
            summary: this.generateSummary(analysisResults, overallStability),
            recommendations: this.generateRecommendations(analysisResults, params)
        };
    }

    calculateConfidence(results) {
        const methods = Object.keys(results);
        const stableCount = methods.filter(method => results[method].isStable).length;
        return stableCount / methods.length;
    }

    generateSummary(results, isStable) {
        const summary = {
            stability: isStable ? 'Estable' : 'Inestable',
            primaryConcerns: [],
            strengths: []
        };

        if (results.vonNeumann && !results.vonNeumann.isStable) {
            summary.primaryConcerns.push('Inestabilidad en análisis de Von Neumann');
        }

        if (results.lyapunov && !results.lyapunov.isStable) {
            summary.primaryConcerns.push('Exponente de Lyapunov positivo');
        }

        if (results.energy && !results.energy.isStable) {
            summary.primaryConcerns.push('Crecimiento energético no controlado');
        }

        return summary;
    }

    generateRecommendations(results, params) {
        const recommendations = [];

        if (results.vonNeumann && results.vonNeumann.courantNumber > 0.5) {
            recommendations.push({
                type: 'timestep',
                message: `Reducir Δt a menos de ${(0.5 / results.vonNeumann.courantNumber * params.dt).toFixed(4)}`,
                priority: 'high'
            });
        }

        if (results.lyapunov && results.lyapunov.averageLyapunov > 0.1) {
            recommendations.push({
                type: 'nonlinearity',
                message: 'Aumentar el parámetro γ para estabilización no lineal',
                priority: 'medium'
            });
        }

        return recommendations;
    }

    // Métodos auxiliares adicionales
    computeSpectrum(psi) {
        // Aproximación simple de FFT
        const n = psi.length;
        const spectrum = new Array(Math.floor(n/2));
        
        for (let k = 0; k < spectrum.length; k++) {
            let real = 0, imag = 0;
            for (let i = 0; i < n; i++) {
                const angle = -2 * Math.PI * k * i / n;
                real += psi[i] * Math.cos(angle);
                imag += psi[i] * Math.sin(angle);
            }
            spectrum[k] = Math.sqrt(real*real + imag*imag);
        }
        
        return spectrum;
    }

    calculateSpectralEntropy(spectrum) {
        const total = spectrum.reduce((sum, val) => sum + val, 0);
        if (total === 0) return 0;
        
        const normalized = spectrum.map(val => val / total);
        return -normalized.reduce((sum, p) => {
            return sum + (p > 0 ? p * Math.log(p) : 0);
        }, 0);
    }

    findDominantModes(spectrum, numModes) {
        const indexed = spectrum.map((val, idx) => ({ value: val, index: idx }));
        indexed.sort((a, b) => b.value - a.value);
        return indexed.slice(0, numModes);
    }

    calculateTurbulenceIndex(spectrum) {
        const n = spectrum.length;
        const highFreq = spectrum.slice(Math.floor(n/2));
        const lowFreq = spectrum.slice(0, Math.floor(n/2));
        
        const highEnergy = highFreq.reduce((sum, val) => sum + val*val, 0);
        const lowEnergy = lowFreq.reduce((sum, val) => sum + val*val, 0);
        
        return highEnergy / (highEnergy + lowEnergy);
    }

    calculateSkewness(data) {
        const n = data.length;
        const mean = data.reduce((sum, val) => sum + val, 0) / n;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        
        const skewness = data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / n;
        return skewness;
    }

    calculateKurtosis(data) {
        const n = data.length;
        const mean = data.reduce((sum, val) => sum + val, 0) / n;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        
        const kurtosis = data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / n;
        return kurtosis - 3; // Exceso de curtosis
    }

    calculateTrend(data) {
        const n = data.length;
        const x = Array.from({length: n}, (_, i) => i);
        const meanX = x.reduce((sum, val) => sum + val, 0) / n;
        const meanY = data.reduce((sum, val) => sum + val, 0) / n;
        
        const numerator = x.reduce((sum, val, i) => sum + (val - meanX) * (data[i] - meanY), 0);
        const denominator = x.reduce((sum, val) => sum + Math.pow(val - meanX, 2), 0);
        
        return denominator !== 0 ? numerator / denominator : 0;
    }

    calculateAutocorrelation(data, maxLag) {
        const n = data.length;
        const mean = data.reduce((sum, val) => sum + val, 0) / n;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        
        const autocorr = [];
        for (let lag = 0; lag <= maxLag && lag < n; lag++) {
            let sum = 0;
            let count = 0;
            
            for (let i = 0; i < n - lag; i++) {
                sum += (data[i] - mean) * (data[i + lag] - mean);
                count++;
            }
            
            autocorr.push(count > 0 ? sum / (count * variance) : 0);
        }
        
        return autocorr;
    }

    /**
     * Obtener resultados del último análisis
     */
    getResults() {
        return this.results;
    }

    /**
     * Exportar resultados
     */
    exportResults(format = 'json') {
        if (!this.results) return null;

        switch (format) {
            case 'json':
                return JSON.stringify(this.results, null, 2);
            case 'csv':
                return this.resultsToCSV();
            default:
                return this.results;
        }
    }

    resultsToCSV() {
        // Implementar conversión a CSV si es necesario
        return 'CSV export not implemented yet';
    }
}

// Instancia global
const stabilityAnalysis = new StabilityAnalysis();

// Inicializar automáticamente
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        stabilityAnalysis.initialize();
    });
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StabilityAnalysis, stabilityAnalysis };
}
