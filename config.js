/**
 * Configuración del Modelo Fractal-Estocástico del Universo (MFSU)
 * Contiene parámetros por defecto, configuraciones de análisis y validaciones
 */

class Config {
    /**
     * Parámetros por defecto del modelo MFSU
     */
    static get DEFAULT_PARAMS() {
        return {
            // Parámetros principales de la ecuación
            alpha: 1.0,        // Coeficiente de difusión fractal
            beta: 0.1,         // Intensidad del ruido estocástico
            gamma: 0.1,        // Coeficiente de no linealidad
            fractalDim: 0.921, // Dimensión fractal ∂
            dt: 0.01,          // Paso temporal
            
            // Parámetros del dominio
            nx: 64,            // Número de puntos espaciales
            nt: 1000,          // Número de pasos temporales
            domainSize: 1.0,   // Tamaño del dominio espacial
            
            // Parámetros del ruido de Hurst
            hurstExponent: 0.5,  // Exponente de Hurst
            noiseAmplitude: 1.0, // Amplitud del ruido
            
            // Configuración de la simulación
            saveInterval: 10,    // Intervalo para guardar datos
            tolerance: 1e-6,     // Tolerancia numérica
            maxIterations: 10000 // Máximo número de iteraciones
        };
    }

    /**
     * Límites válidos para cada parámetro
     */
    static get PARAMETER_BOUNDS() {
        return {
            alpha: { min: 0.01, max: 5.0, step: 0.01 },
            beta: { min: 0.001, max: 1.0, step: 0.001 },
            gamma: { min: 0.001, max: 1.0, step: 0.001 },
            fractalDim: { min: 0.1, max: 2.0, step: 0.001 },
            dt: { min: 0.0001, max: 0.1, step: 0.0001 },
            nx: { min: 16, max: 512, step: 16 },
            nt: { min: 100, max: 10000, step: 100 },
            hurstExponent: { min: 0.1, max: 0.9, step: 0.01 }
        };
    }

    /**
     * Configuración de análisis de convergencia
     */
    static get CONVERGENCE_CONFIG() {
        return {
            meshSizes: [16, 32, 64, 128, 256],
            testCases: [
                {
                    name: "Difusión pura",
                    params: { alpha: 1.0, beta: 0.0, gamma: 0.0, fractalDim: 1.0 }
                },
                {
                    name: "Ruido dominante",
                    params: { alpha: 0.1, beta: 0.5, gamma: 0.0, fractalDim: 0.8 }
                },
                {
                    name: "No linealidad fuerte",
                    params: { alpha: 0.5, beta: 0.1, gamma: 0.3, fractalDim: 1.2 }
                },
                {
                    name: "Fractal extremo",
                    params: { alpha: 1.0, beta: 0.2, gamma: 0.1, fractalDim: 0.5 }
                }
            ],
            expectedOrders: {
                euler: 1.0,
                rungeKutta4: 4.0,
                implicit: 2.0
            }
        };
    }

    /**
     * Configuración de análisis de estabilidad
     */
    static get STABILITY_CONFIG() {
        return {
            testDuration: 2000,     // Pasos temporales para test de estabilidad
            amplitudeThreshold: 10.0, // Factor máximo de crecimiento permitido
            energyThreshold: 1e10,   // Umbral de energía para detectar explosión
            oscillationDetection: {
                windowSize: 100,     // Ventana para detectar oscilaciones
                maxFrequency: 0.1    // Frecuencia máxima permitida
            },
            stabilityMetrics: [
                'maxAmplitude',
                'totalEnergy',
                'l2Norm',
                'growthRate',
                'oscillationIndex'
            ]
        };
    }

    /**
     * Configuración de visualización
     */
    static get VISUALIZATION_CONFIG() {
        return {
            colors: {
                primary: '#667eea',
                secondary: '#764ba2',
                accent: '#2ecc71',
                warning: '#e67e22',
                error: '#e74c3c',
                info: '#3498db'
            },
            charts: {
                convergence: {
                    type: 'line',
                    scales: {
                        y: { type: 'logarithmic' }
                    },
                    tension: 0.4
                },
                stability: {
                    type: 'line',
                    scales: {
                        y: { type: 'linear' }
                    },
                    tension: 0.2
                },
                evolution: {
                    type: 'line',
                    scales: {
                        y: { type: 'linear' }
                    },
                    tension: 0.1
                }
            },
            animations: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        };
    }

    /**
     * Configuración de condiciones iniciales
     */
    static get INITIAL_CONDITIONS() {
        return {
            gaussian: {
                amplitude: 0.1,
                width: 0.1,
                center: 0.5
            },
            sineWave: {
                amplitude: 0.1,
                frequency: 2.0,
                phase: 0.0
            },
            fractalNoise: {
                amplitude: 0.05,
                octaves: 5,
                persistence: 0.5
            },
            soliton: {
                amplitude: 0.2,
                width: 0.05,
                velocity: 0.1
            }
        };
    }

    /**
     * Configuración de métodos numéricos
     */
    static get NUMERICAL_METHODS() {
        return {
            timeIntegration: {
                euler: {
                    name: "Euler Explícito",
                    order: 1,
                    stabilityFactor: 0.5
                },
                rk4: {
                    name: "Runge-Kutta 4º Orden",
                    order: 4,
                    stabilityFactor: 2.0
                },
                implicit: {
                    name: "Euler Implícito",
                    order: 1,
                    stabilityFactor: 100.0
                }
            },
            spatialDiscretization: {
                finiteDifference: {
                    name: "Diferencias Finitas",
                    order: 2,
                    stencilSize: 3
                },
                spectral: {
                    name: "Métodos Espectrales",
                    order: "exponencial",
                    accuracy: "alta"
                }
            }
        };
    }

    /**
     * Configuración de exportación de datos
     */
    static get EXPORT_CONFIG() {
        return {
            formats: ['json', 'csv', 'txt', 'mat'],
            precision: 8,
            compression: true,
            metadata: {
                includeParameters: true,
                includeTimestamp: true,
                includeVersion: true
            }
        };
    }

    /**
     * Configuración de debugging y logging
     */
    static get DEBUG_CONFIG() {
        return {
            levels: {
                ERROR: 0,
                WARN: 1,
                INFO: 2,
                DEBUG: 3,
                TRACE: 4
            },
            defaultLevel: 2, // INFO
            logToConsole: true,
            logToFile: false,
            maxLogSize: 10 * 1024 * 1024, // 10MB
            performanceMonitoring: true
        };
    }

    /**
     * Validar parámetros del modelo
     * @param {Object} params - Parámetros a validar
     * @returns {Object} Resultado de validación
     */
    static validateParameters(params) {
        const errors = [];
        const warnings = [];
        const bounds = this.PARAMETER_BOUNDS;

        for (const [key, value] of Object.entries(params)) {
            if (bounds[key]) {
                const { min, max } = bounds[key];
                
                if (value < min || value > max) {
                    errors.push(`${key}: ${value} está fuera del rango [${min}, ${max}]`);
                }
            }
        }

        // Validaciones específicas del modelo MFSU
        if (params.dt && params.alpha && params.beta && params.gamma) {
            const dtLimit = this.calculateStabilityLimit(params);
            if (params.dt > dtLimit) {
                warnings.push(`dt=${params.dt} puede ser inestable. Recomendado: dt < ${dtLimit.toFixed(6)}`);
            }
        }

        if (params.fractalDim && (params.fractalDim < 0.1 || params.fractalDim > 2.0)) {
            errors.push(`Dimensión fractal ${params.fractalDim} está fuera del rango físico válido`);
        }

        if (params.beta && params.alpha && params.beta > params.alpha) {
            warnings.push("El ruido estocástico domina sobre la difusión fractal");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Calcular límite de estabilidad para el paso temporal
     * @param {Object} params - Parámetros del modelo
     * @returns {number} Límite de estabilidad
     */
    static calculateStabilityLimit(params) {
        const { alpha, beta, gamma, fractalDim } = params;
        
        // Factor de corrección para dimensión fractal
        const fractalCorrection = Math.pow(2, fractalDim - 1);
        
        // Límite basado en la condición CFL generalizada
        const diffusionLimit = 0.5 / (alpha * fractalCorrection);
        const stochasticLimit = 0.1 / beta;
        const nonlinearLimit = 0.1 / gamma;
        
        return Math.min(diffusionLimit, stochasticLimit, nonlinearLimit);
    }

    /**
     * Obtener configuración completa con parámetros personalizados
     * @param {Object} userParams - Parámetros del usuario
     * @returns {Object} Configuración completa
     */
    static getCompleteConfig(userParams = {}) {
        const config = {
            ...this.DEFAULT_PARAMS,
            ...userParams
        };

        // Validar parámetros
        const validation = this.validateParameters(config);
        
        return {
            parameters: config,
            validation,
            convergence: this.CONVERGENCE_CONFIG,
            stability: this.STABILITY_CONFIG,
            visualization: this.VISUALIZATION_CONFIG,
            initialConditions: this.INITIAL_CONDITIONS,
            numericalMethods: this.NUMERICAL_METHODS,
            export: this.EXPORT_CONFIG,
            debug: this.DEBUG_CONFIG
        };
    }

    /**
     * Generar conjunto de parámetros para análisis paramétrico
     * @param {Object} baseParams - Parámetros base
     * @param {Object} variations - Variaciones para cada parámetro
     * @returns {Array} Conjunto de configuraciones
     */
    static generateParameterSweep(baseParams, variations) {
        const configs = [];
        const paramNames = Object.keys(variations);
        
        function generateCombinations(index, currentConfig) {
            if (index === paramNames.length) {
                configs.push({ ...currentConfig });
                return;
            }
            
            const paramName = paramNames[index];
            const values = variations[paramName];
            
            for (const value of values) {
                currentConfig[paramName] = value;
                generateCombinations(index + 1, currentConfig);
            }
        }
        
        generateCombinations(0, { ...baseParams });
        return configs;
    }

    /**
     * Configuración de presets comunes
     */
    static get PRESETS() {
        return {
            standard: {
                name: "Configuración Estándar",
                description: "Parámetros equilibrados para análisis general",
                params: this.DEFAULT_PARAMS
            },
            highPrecision: {
                name: "Alta Precisión",
                description: "Configuración para análisis de alta precisión",
                params: {
                    ...this.DEFAULT_PARAMS,
                    dt: 0.001,
                    nx: 256,
                    tolerance: 1e-10
                }
            },
            fastCompute: {
                name: "Cómputo Rápido",
                description: "Configuración optimizada para velocidad",
                params: {
                    ...this.DEFAULT_PARAMS,
                    dt: 0.05,
                    nx: 32,
                    nt: 500
                }
            },
            fractalFocus: {
                name: "Enfoque Fractal",
                description: "Configuración para estudiar efectos fractales",
                params: {
                    ...this.DEFAULT_PARAMS,
                    fractalDim: 0.7,
                    alpha: 2.0,
                    beta: 0.05
                }
            },
            stochasticDominant: {
                name: "Dominancia Estocástica",
                description: "Configuración con ruido dominante",
                params: {
                    ...this.DEFAULT_PARAMS,
                    beta: 0.4,
                    alpha: 0.5,
                    gamma: 0.02
                }
            }
        };
    }

    /**
     * Obtener preset por nombre
     * @param {string} presetName - Nombre del preset
     * @returns {Object} Configuración del preset
     */
    static getPreset(presetName) {
        const preset = this.PRESETS[presetName];
        if (!preset) {
            throw new Error(`Preset '${presetName}' no encontrado`);
        }
        return preset;
    }

    /**
     * Obtener lista de presets disponibles
     * @returns {Array} Lista de nombres de presets
     */
    static getAvailablePresets() {
        return Object.keys(this.PRESETS);
    }
}

// Exportar para uso en módulos ES6
export default Config;

// También disponible como global para uso directo en HTML
if (typeof window !== 'undefined') {
    window.Config = Config;
}
