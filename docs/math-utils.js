/**
 * Utilidades Matemáticas para el Modelo Fractal-Estocástico del Universo (MFSU)
 * Implementa operadores fractales, ruido de Hurst, y análisis de convergencia
 */

class MathUtils {
    /**
     * Implementa el operador fractal (-Δ)^(∂/2) usando aproximación espectral
     * @param {Array<number>} psi - Función de onda
     * @param {number} dx - Paso espacial
     * @param {number} order - Orden fractal ∂
     * @returns {Array<number>} Resultado del operador fractal
     */
    static fractionalLaplacian(psi, dx, order) {
        const n = psi.length;
        const result = new Array(n).fill(0);
        
        // Aproximación del Laplaciano fractal (-Δ)^(∂/2)
        // Usando diferencias finitas de segundo orden para el Laplaciano base
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
            // Para exponente < 1, usar aproximación de Caputo
            for (let i = 0; i < n; i++) {
                result[i] = Math.pow(Math.abs(laplacian[i]) + 1e-10, fracPower) * Math.sign(laplacian[i]);
            }
        } else {
            // Para exponente >= 1, usar Laplaciano iterado
            for (let i = 0; i < n; i++) {
                result[i] = laplacian[i];
            }
            
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
     * Genera ruido de Hurst ξ_H(x,t) con correlaciones espaciales
     * @param {number} nx - Número de puntos espaciales
     * @param {number} nt - Número de pasos temporales
     * @param {number} hurst - Parámetro de Hurst (0.5 por defecto)
     * @returns {Array<Array<number>>} Matriz de ruido correlacionado
     */
    static generateHurstNoise(nx, nt, hurst = 0.5) {
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
     * Resuelve la ecuación MFSU completa
     * ∂ψ/∂t = α(-Δ)^(∂/2)ψ + β·ξ_H(x,t)·ψ - γψ³ + f(x,t)
     * @param {Object} params - Parámetros del modelo
     * @param {number} nx - Número de puntos espaciales
     * @param {number} nt - Número de pasos temporales
     * @returns {Object} Resultado de la simulación
     */
    static solveMFSU(params, nx, nt) {
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
     * @returns {Array<Object>} Datos de convergencia
     */
    static analyzeConvergence(params) {
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
     * Análisis de estabilidad del esquema numérico
     * @param {Object} params - Parámetros del modelo
     * @returns {Object} Datos de estabilidad
     */
    static analyzeStability(params) {
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
     * Calcula el orden de convergencia
     * @param {Array<Object>} convergenceData - Datos de convergencia
     * @returns {number} Orden de convergencia
     */
    static calculateConvergenceOrder(convergenceData) {
        let convergenceOrder = 0;
        if (convergenceData.length > 1) {
            const lastTwo = convergenceData.slice(-2);
            const ratio = lastTwo[0].error / lastTwo[1].error;
            convergenceOrder = Math.log2(ratio);
        }
        return convergenceOrder;
    }

    /**
     * Calcula el límite de paso temporal recomendado para estabilidad
     * @param {Object} params - Parámetros del modelo
     * @returns {number} Límite de Δt
     */
    static calculateDtLimit(params) {
        const { alpha, beta, gamma } = params;
        return 0.1 / (alpha + beta + gamma);
    }

    /**
     * Genera condiciones iniciales con estructura fractal
     * @param {number} nx - Número de puntos espaciales
     * @param {number} fractalDim - Dimensión fractal
     * @returns {Array<number>} Condiciones iniciales
     */
    static generateFractalInitialConditions(nx, fractalDim) {
        const psi = new Array(nx);
        const dx = 1.0 / nx;
        
        for (let i = 0; i < nx; i++) {
            const x = i * dx;
            // Estructura fractal base
            let value = 0.1 * Math.sin(2 * Math.PI * x) * Math.exp(-Math.pow(x - 0.5, 2) / 0.1);
            
            // Agregar componentes fractales
            for (let k = 1; k <= 5; k++) {
                const scale = Math.pow(k, -fractalDim);
                value += scale * 0.02 * Math.sin(2 * Math.PI * k * x);
            }
            
            // Perturbación aleatoria
            value += 0.01 * (Math.random() - 0.5);
            
            psi[i] = value;
        }
        
        return psi;
    }

    /**
     * Calcula la energía total del sistema
     * @param {Array<number>} psi - Función de onda
     * @param {number} dx - Paso espacial
     * @returns {number} Energía total
     */
    static calculateTotalEnergy(psi, dx) {
        let energy = 0;
        const n = psi.length;
        
        for (let i = 0; i < n; i++) {
            // Energía cinética (gradiente)
            const nextIdx = (i + 1) % n;
            const grad = (psi[nextIdx] - psi[i]) / dx;
            energy += 0.5 * grad * grad;
            
            // Energía potencial no lineal
            energy += 0.25 * Math.pow(psi[i], 4);
        }
        
        return energy * dx;
    }

    /**
     * Calcula la norma L2 de una función
     * @param {Array<number>} psi - Función
     * @returns {number} Norma L2
     */
    static calculateL2Norm(psi) {
        const sum = psi.reduce((acc, val) => acc + val * val, 0);
        return Math.sqrt(sum);
    }

    /**
     * Interpola linealmente entre dos grillas de diferentes resoluciones
     * @param {Array<number>} coarseGrid - Grilla gruesa
     * @param {number} fineSize - Tamaño de la grilla fina
     * @returns {Array<number>} Grilla interpolada
     */
    static interpolateGrid(coarseGrid, fineSize) {
        const coarseSize = coarseGrid.length;
        const fineGrid = new Array(fineSize);
        
        for (let i = 0; i < fineSize; i++) {
            const coarseIndex = (i * coarseSize) / fineSize;
            const leftIndex = Math.floor(coarseIndex);
            const rightIndex = Math.ceil(coarseIndex);
            const weight = coarseIndex - leftIndex;
            
            if (leftIndex === rightIndex) {
                fineGrid[i] = coarseGrid[leftIndex];
            } else {
                fineGrid[i] = (1 - weight) * coarseGrid[leftIndex] + 
                              weight * coarseGrid[rightIndex % coarseSize];
            }
        }
        
        return fineGrid;
    }

    /**
     * Calcula estadísticas descriptivas de una serie temporal
     * @param {Array<number>} data - Datos temporales
     * @returns {Object} Estadísticas
     */
    static calculateStatistics(data) {
        const n = data.length;
        const mean = data.reduce((sum, val) => sum + val, 0) / n;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const std = Math.sqrt(variance);
        const min = Math.min(...data);
        const max = Math.max(...data);
        
        return { mean, variance, std, min, max };
    }

    /**
     * Implementa el método de Runge-Kutta de 4to orden para mayor precisión
     * @param {Array<number>} psi - Estado actual
     * @param {number} dt - Paso temporal
     * @param {Function} rhsFunc - Función del lado derecho
     * @returns {Array<number>} Nuevo estado
     */
    static rungeKutta4(psi, dt, rhsFunc) {
        const n = psi.length;
        const k1 = rhsFunc(psi);
        
        const psi1 = new Array(n);
        for (let i = 0; i < n; i++) {
            psi1[i] = psi[i] + 0.5 * dt * k1[i];
        }
        const k2 = rhsFunc(psi1);
        
        const psi2 = new Array(n);
        for (let i = 0; i < n; i++) {
            psi2[i] = psi[i] + 0.5 * dt * k2[i];
        }
        const k3 = rhsFunc(psi2);
        
        const psi3 = new Array(n);
        for (let i = 0; i < n; i++) {
            psi3[i] = psi[i] + dt * k3[i];
        }
        const k4 = rhsFunc(psi3);
        
        const psiNew = new Array(n);
        for (let i = 0; i < n; i++) {
            psiNew[i] = psi[i] + (dt / 6) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]);
        }
        
        return psiNew;
    }
}

// Exportar para uso en módulos ES6
export default MathUtils;

// También disponible como global para uso directo en HTML
if (typeof window !== 'undefined') {
    window.MathUtils = MathUtils;
}
