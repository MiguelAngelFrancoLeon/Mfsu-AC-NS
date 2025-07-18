/**
 * Análisis de Convergencia y Estabilidad Numérica
 * Modelo Fractal-Estocástico del Universo (MFSU)
 * 
 * Ecuación: ∂ψ/∂t = α(-Δ)^(∂/2)ψ + β·ξ_H(x,t)·ψ - γψ³ + f(x,t)
 */

class MFSUConvergenceAnalysis {
    constructor() {
        this.convergenceChart = null;
        this.stabilityChart = null;
        this.initialized = false;
    }

    /**
     * Inicializar el análisis de convergencia
     */
    initialize() {
        this.initializeControls();
        this.initializeCharts();
        this.initialized = true;
    }

    /**
     * Configurar controles deslizantes
     */
    initializeControls() {
        const sliders = ['alpha', 'beta', 'gamma', 'fractal', 'dt'];
        
        sliders.forEach(param => {
            const slider = document.getElementById(param + 'Slider');
            const valueSpan = document.getElementById(param + 'Value');
            
            if (slider && valueSpan) {
                slider.addEventListener('input', function() {
                    valueSpan.textContent = this.value;
                });
            }
        });
    }

    /**
     * Inicializar gráficos con Chart.js
     */
    initializeCharts() {
        const ctx1 = document.getElementById('convergenceChart');
        const ctx2 = document.getElementById('stabilityChart');
        
        if (!ctx1 || !ctx2) return;

        this.convergenceChart = new Chart(ctx1.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Error L2',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Convergencia del Método Numérico'
                    }
                },
                scales: {
                    y: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: 'Error L2'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Refinamiento de Malla (log₂)'
                        }
                    }
                }
            }
        });

        this.stabilityChart = new Chart(ctx2.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Máximo |ψ|',
                    data: [],
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Estabilidad Temporal'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Amplitud Máxima'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Tiempo'
                        }
                    }
                }
            }
        });
    }

    /**
     * Implementación del operador fractal (-Δ)^(∂/2)
     * @param {Array} psi - Campo de onda
     * @param {number} dx - Espaciado espacial
     * @param {number} order - Orden fractal ∂
     * @returns {Array} Resultado del operador fractal
     */
    fractionalLaplacian(psi, dx, order) {
        const n = psi.length;
        const result = new Array(n).fill(0);
        
        // Aproximación del Laplaciano fractal (-Δ)^(∂/2)
        const laplacian = new Array(n).fill(0);
        
        // Diferencias finitas de segundo orden para el Laplaciano base
        for (let i = 1; i < n - 1; i++) {
            laplacian[i] = (psi[i+1] - 2*psi[i] + psi[i-1]) / (dx*dx);
        }
        
        // Condiciones de frontera periódicas
        laplacian[0] = (psi[1] - 2*psi[0] + psi[n-1]) / (dx*dx);
        laplacian[n-1] = (psi[0] - 2*psi[n-1] + psi[n-2]) / (dx*dx);
        
        // Aplicar la potencia fractal ∂/2
        const fracPower = order / 2;
        
        if (fracPower < 1) {
            // Para exponente < 1, usar aproximación de Caputo
            for (let i = 0; i < n; i++) {
                result[i] = Math.pow(Math.abs(laplacian[i]) + 1e-10, fracPower) * Math.sign(laplacian[i]);
            }
        } else {
            // Para exponente >= 1, usar Laplaciano iterado
            result.splice(0, n, ...laplacian);
            for (let iter = 1; iter < Math.floor(fracPower); iter++) {
                for (let i = 1; i < n - 1; i++) {
                    result[i] = (result[i+1] - 2*result[i] + result[i-1]) / (dx*dx);
                }
                result[0] = (result[1] - 2*result[0] + result[n-1]) / (dx*dx);
                result[n-1] = (result[0] - 2*result[n-1] + result[n-2]) / (dx*dx);
            }
        }
        
        return result;
    }

    /**
     * Generar ruido de Hurst ξ_H(x,t) con correlaciones espaciales
     * @param {number} nx - Puntos espaciales
     * @param {number} nt - Puntos temporales
     * @param {number} hurst - Parámetro de Hurst
     * @returns {Array} Matriz de ruido correlacionado
     */
    generateHurstNoise(nx, nt, hurst = 0.5) {
        const noise = [];
        
        for (let t = 0; t < nt; t++) {
            const spatialNoise = new Array(nx);
            
            // Generar ruido espacial correlacionado
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

    /**
     * Resolver la ecuación MFSU completa
     * @param {Object} params - Parámetros del modelo
     * @param {number} nx - Puntos espaciales
     * @param {number} nt - Puntos temporales
     * @returns {Object} Resultado de la simulación
     */
    solveMFSU(params, nx, nt) {
        const { alpha, beta, gamma, fractalDim, dt } = params;
        const dx = 1.0 / nx;
        
        // Condiciones iniciales con modulación fractal
        let psi = new Array(nx);
        for (let i = 0; i < nx; i++) {
            const x = i * dx;
            // Condición inicial con estructura fractal
            psi[i] = 0.1 * Math.sin(2 * Math.PI * x) * Math.exp(-Math.pow(x - 0.5, 2) / 0.1) +
                     0.05 * (Math.random() - 0.5);
        }
        
        const evolution = [];
        const hurstNoise = this.generateHurstNoise(nx, nt, 0.5);
        
        for (let t = 0; t < nt; t++) {
            // Calcular el Laplaciano fractal (-Δ)^(∂/2)
            const fractalTerm = this.fractionalLaplacian(psi, dx, fractalDim);
            
            // Función de forzamiento f(x,t) - puede ser cero o específica del problema
            const forcing = new Array(nx).fill(0);
            
            // Evolución temporal usando el esquema de Euler
            const psiNew = new Array(nx);
            for (let i = 0; i < nx; i++) {
                const diffusion = alpha * fractalTerm[i];
                const stochastic = beta * hurstNoise[t][i] * psi[i];
                const nonlinear = -gamma * Math.pow(psi[i], 3);
                const force = forcing[i];
                
                psiNew[i] = psi[i] + dt * (diffusion + stochastic + nonlinear + force);
            }
            
            psi = psiNew;
            
            // Almacenar evolución cada 10 pasos
            if (t % 10 === 0) {
                evolution.push({
                    time: t * dt,
                    maxAmp: Math.max(...psi.map(x => Math.abs(x))),
                    l2Norm: Math.sqrt(psi.reduce((sum, x) => sum + x*x, 0)),
                    energy: psi.reduce((sum, x, idx) => {
                        const grad = idx < nx-1 ? psi[idx+1] - psi[idx] : psi[0] - psi[idx];
                        return sum + 0.5 * grad*grad + 0.25 * Math.pow(x, 4);
                    }, 0)
                });
            }
        }
        
        return { finalPsi: psi, evolution: evolution };
    }

    /**
     * Análisis de convergencia del método numérico
     * @param {Object} params - Parámetros del modelo
     * @returns {Array} Datos de convergencia
     */
    analyzeConvergence(params) {
        const meshSizes = [16, 32, 64, 128];
        const nt = 1000;
        const convergenceData = [];
        
        let referenceSolution = null;
        
        for (let i = 0; i < meshSizes.length; i++) {
            const nx = meshSizes[i];
            const result = this.solveMFSU(params, nx, nt);
            
            if (i === meshSizes.length - 1) {
                referenceSolution = result.finalPsi;
            }
            
            // Calcular error L2 comparando con la solución más fina
            if (i > 0) {
                const coarseGrid = result.finalPsi;
                const fineGrid = referenceSolution || result.finalPsi;
                
                // Interpolar para comparar
                let error = 0;
                for (let j = 0; j < coarseGrid.length; j++) {
                    const fineIndex = Math.floor(j * fineGrid.length / coarseGrid.length);
                    error += Math.pow(coarseGrid[j] - fineGrid[fineIndex], 2);
                }
                
                convergenceData.push({
                    meshSize: nx,
                    error: Math.sqrt(error / coarseGrid.length),
                    order: Math.log2(nx)
                });
            }
        }
        
        return convergenceData;
    }

    /**
     * Análisis de estabilidad temporal
     * @param {Object} params - Parámetros del modelo
     * @returns {Object} Datos de estabilidad
     */
    analyzeStability(params) {
        const nx = 64;
        const nt = 2000;
        const result = this.solveMFSU(params, nx, nt);
        
        // Calcular métricas de estabilidad
        const maxAmps = result.evolution.map(e => e.maxAmp);
        const finalAmp = maxAmps[maxAmps.length - 1];
        const initialAmp = maxAmps[0];
        
        const isStable = finalAmp < 10 * initialAmp;
        const growthRate = Math.log(finalAmp / initialAmp) / result.evolution.length;
        
        return {
            evolution: result.evolution,
            isStable: isStable,
            growthRate: growthRate,
            finalAmplitude: finalAmp,
            initialAmplitude: initialAmp
        };
    }

    /**
     * Actualizar gráfico de convergencia
     * @param {Array} data - Datos de convergencia
     */
    updateConvergenceChart(data) {
        if (!this.convergenceChart) return;
        
        const labels = data.map(d => d.order.toFixed(0));
        const errors = data.map(d => d.error);
        
        this.convergenceChart.data.labels = labels;
        this.convergenceChart.data.datasets[0].data = errors;
        this.convergenceChart.update();
    }

    /**
     * Actualizar gráfico de estabilidad
     * @param {Object} data - Datos de estabilidad
     */
    updateStabilityChart(data) {
        if (!this.stabilityChart) return;
        
        const labels = data.evolution.map(e => e.time.toFixed(2));
        const maxAmps = data.evolution.map(e => e.maxAmp);
        
        this.stabilityChart.data.labels = labels;
        this.stabilityChart.data.datasets[0].data = maxAmps;
        this.stabilityChart.update();
    }

    /**
     * Mostrar resultados del análisis
     * @param {Array} convergenceData - Datos de convergencia
     * @param {Object} stabilityData - Datos de estabilidad
     * @param {Object} params - Parámetros del modelo
     */
    displayResults(convergenceData, stabilityData, params) {
        // Calcular orden de convergencia
        let convergenceOrder = 0;
        if (convergenceData.length > 1) {
            const lastTwo = convergenceData.slice(-2);
            const ratio = lastTwo[0].error / lastTwo[1].error;
            convergenceOrder = Math.log2(ratio);
        }
        
        // Mostrar resultados de convergencia
        const analysisResults = document.getElementById('analysisResults');
        const convergenceText = document.getElementById('convergenceText');
        const convergenceMetrics = document.getElementById('convergenceMetrics');
        
        if (analysisResults && convergenceText && convergenceMetrics) {
            analysisResults.style.display = 'block';
            convergenceText.textContent = 
                `El método numérico para la ecuación MFSU completa ∂ψ/∂t = α(-Δ)^(∂/2)ψ + β·ξ_H(x,t)·ψ - γψ³ + f(x,t) ` +
                `muestra un orden de convergencia de ${convergenceOrder.toFixed(2)}. ` +
                `Con dimensión fractal ∂ = ${params.fractalDim}, el operador (-Δ)^(∂/2) introduce correlaciones no-locales.`;
            
            convergenceMetrics.innerHTML = 
                `<span class="metric">Orden: ${convergenceOrder.toFixed(2)}</span>` +
                `<span class="metric">Error final: ${convergenceData[convergenceData.length-1]?.error.toExponential(3) || 'N/A'}</span>`;
        }
        
        // Mostrar resultados de estabilidad
        const stabilityResults = document.getElementById('stabilityResults');
        const stabilityText = document.getElementById('stabilityText');
        const stabilityMetrics = document.getElementById('stabilityMetrics');
        
        if (stabilityResults && stabilityText && stabilityMetrics) {
            stabilityResults.style.display = 'block';
            stabilityText.textContent = 
                `El esquema numérico es ${stabilityData.isStable ? 'estable' : 'inestable'} con los parámetros actuales. ` +
                `La tasa de crecimiento es ${stabilityData.growthRate.toExponential(3)}.`;
            
            stabilityMetrics.innerHTML = 
                `<span class="metric">Estabilidad: ${stabilityData.isStable ? '✓ Estable' : '✗ Inestable'}</span>` +
                `<span class="metric">Crecimiento: ${stabilityData.growthRate.toExponential(3)}</span>` +
                `<span class="metric">Amplitud final: ${stabilityData.finalAmplitude.toFixed(4)}</span>`;
        }
        
        // Mostrar advertencias si es necesario
        const dtLimit = 0.1 / (params.alpha + params.beta + params.gamma);
        const showWarning = params.dt > dtLimit || !stabilityData.isStable;
        
        const warningResults = document.getElementById('warningResults');
        const warningText = document.getElementById('warningText');
        
        if (warningResults && warningText) {
            if (showWarning) {
                warningResults.style.display = 'block';
                warningText.textContent = 
                    `Advertencia: El paso temporal Δt = ${params.dt} puede ser demasiado grande para estabilidad. ` +
                    `Se recomienda Δt < ${dtLimit.toFixed(4)} para estos parámetros.`;
            } else {
                warningResults.style.display = 'none';
            }
        }
    }

    /**
     * Ejecutar análisis completo de convergencia y estabilidad
     */
    runConvergenceAnalysis() {
        if (!this.initialized) {
            console.error('MFSUConvergenceAnalysis no está inicializado');
            return;
        }
        
        // Obtener parámetros de los controles
        const params = {
            alpha: parseFloat(document.getElementById('alphaSlider')?.value || 1.0),
            beta: parseFloat(document.getElementById('betaSlider')?.value || 0.1),
            gamma: parseFloat(document.getElementById('gammaSlider')?.value || 0.1),
            fractalDim: parseFloat(document.getElementById('fractalSlider')?.value || 0.921),
            dt: parseFloat(document.getElementById('dtSlider')?.value || 0.01)
        };
        
        // Análisis de convergencia
        const convergenceData = this.analyzeConvergence(params);
        
        // Análisis de estabilidad
        const stabilityData = this.analyzeStability(params);
        
        // Actualizar gráficos
        this.updateConvergenceChart(convergenceData);
        this.updateStabilityChart(stabilityData);
        
        // Mostrar resultados
        this.displayResults(convergenceData, stabilityData, params);
    }

    /**
     * Obtener parámetros actuales del modelo
     * @returns {Object} Parámetros del modelo
     */
    getModelParameters() {
        return {
            alpha: parseFloat(document.getElementById('alphaSlider')?.value || 1.0),
            beta: parseFloat(document.getElementById('betaSlider')?.value || 0.1),
            gamma: parseFloat(document.getElementById('gammaSlider')?.value || 0.1),
            fractalDim: parseFloat(document.getElementById('fractalSlider')?.value || 0.921),
            dt: parseFloat(document.getElementById('dtSlider')?.value || 0.01)
        };
    }

    /**
     * Establecer parámetros del modelo
     * @param {Object} params - Parámetros del modelo
     */
    setModelParameters(params) {
        if (params.alpha !== undefined) {
            const alphaSlider = document.getElementById('alphaSlider');
            const alphaValue = document.getElementById('alphaValue');
            if (alphaSlider) alphaSlider.value = params.alpha;
            if (alphaValue) alphaValue.textContent = params.alpha;
        }
        
        if (params.beta !== undefined) {
            const betaSlider = document.getElementById('betaSlider');
            const betaValue = document.getElementById('betaValue');
            if (betaSlider) betaSlider.value = params.beta;
            if (betaValue) betaValue.textContent = params.beta;
        }
        
        if (params.gamma !== undefined) {
            const gammaSlider = document.getElementById('gammaSlider');
            const gammaValue = document.getElementById('gammaValue');
            if (gammaSlider) gammaSlider.value = params.gamma;
            if (gammaValue) gammaValue.textContent = params.gamma;
        }
        
        if (params.fractalDim !== undefined) {
            const fractalSlider = document.getElementById('fractalSlider');
            const fractalValue = document.getElementById('fractalValue');
            if (fractalSlider) fractalSlider.value = params.fractalDim;
            if (fractalValue) fractalValue.textContent = params.fractalDim;
        }
        
        if (params.dt !== undefined) {
            const dtSlider = document.getElementById('dtSlider');
            const dtValue = document.getElementById('dtValue');
            if (dtSlider) dtSlider.value = params.dt;
            if (dtValue) dtValue.textContent = params.dt;
        }
    }
}

// Crear instancia global
const mfsuAnalysis = new MFSUConvergenceAnalysis();

// Función global para compatibilidad con HTML existente
function runConvergenceAnalysis() {
    mfsuAnalysis.runConvergenceAnalysis();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    mfsuAnalysis.initialize();
});

// Exportar la clase para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MFSUConvergenceAnalysis;
}
