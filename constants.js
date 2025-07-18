/**
 * constants.js
 * Constantes matemáticas, físicas y de configuración para el
 * Análisis de Convergencia y Estabilidad Numérica del MFSU
 * (Modelo Fractal-Estocástico del Universo)
 */

// ===== CONSTANTES MATEMÁTICAS =====
const MATH_CONSTANTS = {
    // Constantes fundamentales
    PI: Math.PI,
    E: Math.E,
    SQRT_2: Math.sqrt(2),
    SQRT_PI: Math.sqrt(Math.PI),
    GOLDEN_RATIO: (1 + Math.sqrt(5)) / 2,
    
    // Tolerancias numéricas
    EPSILON: 1e-15,
    SMALL_NUMBER: 1e-10,
    CONVERGENCE_TOL: 1e-6,
    
    // Límites de integración
    INTEGRATION_BOUNDS: {
        SPATIAL: {
            MIN: 0,
            MAX: 1
        },
        TEMPORAL: {
            MIN: 0,
            MAX: 10
        }
    }
};

// ===== CONSTANTES FÍSICAS DEL MODELO MFSU =====
const PHYSICAL_CONSTANTS = {
    // Constantes cosmológicas
    HUBBLE_CONSTANT: 70, // km/s/Mpc
    DARK_ENERGY_DENSITY: 0.685,
    DARK_MATTER_DENSITY: 0.265,
    BARYON_DENSITY: 0.05,
    
    // Parámetros fractales característicos
    FRACTAL_DIMENSIONS: {
        COSMIC_WEB: 2.2,
        GALAXY_DISTRIBUTION: 2.97,
        DARK_MATTER_HALO: 2.16,
        PRIMORDIAL_FLUCTUATIONS: 0.921 // Valor por defecto
    },
    
    // Exponentes de Hurst característicos
    HURST_EXPONENTS: {
        CMB_FLUCTUATIONS: 0.5,
        GALAXY_CLUSTERING: 0.7,
        DARK_ENERGY_FIELD: 0.3,
        QUANTUM_FLUCTUATIONS: 0.5
    }
};

// ===== PARÁMETROS DE LA ECUACIÓN MFSU =====
const MFSU_PARAMETERS = {
    // Rangos permitidos para parámetros
    ALPHA: {
        MIN: 0.1,
        MAX: 2.0,
        DEFAULT: 1.0,
        STEP: 0.1,
        DESCRIPTION: 'Coeficiente de difusión fractal'
    },
    
    BETA: {
        MIN: 0.01,
        MAX: 0.5,
        DEFAULT: 0.1,
        STEP: 0.01,
        DESCRIPTION: 'Intensidad del ruido estocástico'
    },
    
    GAMMA: {
        MIN: 0.01,
        MAX: 0.5,
        DEFAULT: 0.1,
        STEP: 0.01,
        DESCRIPTION: 'Coeficiente de no-linealidad'
    },
    
    FRACTAL_DIM: {
        MIN: 0.5,
        MAX: 1.5,
        DEFAULT: 0.921,
        STEP: 0.001,
        DESCRIPTION: 'Dimensión fractal del operador'
    },
    
    DT: {
        MIN: 0.001,
        MAX: 0.1,
        DEFAULT: 0.01,
        STEP: 0.001,
        DESCRIPTION: 'Paso temporal'
    }
};

// ===== CONFIGURACIÓN NUMÉRICA =====
const NUMERICAL_CONFIG = {
    // Tamaños de malla para análisis de convergencia
    MESH_SIZES: [16, 32, 64, 128, 256],
    
    // Pasos temporales
    TIME_STEPS: {
        COARSE: 1000,
        MEDIUM: 2000,
        FINE: 5000,
        ULTRA_FINE: 10000
    },
    
    // Métodos de integración
    INTEGRATION_METHODS: {
        EULER: 'euler',
        RUNGE_KUTTA_4: 'rk4',
        ADAMS_BASHFORTH: 'ab',
        BACKWARD_EULER: 'backward_euler'
    },
    
    // Criterios de estabilidad
    STABILITY_CRITERIA: {
        CFL_LIMIT: 0.5,
        GROWTH_RATE_LIMIT: 0.1,
        AMPLITUDE_GROWTH_FACTOR: 10
    }
};

// ===== CONFIGURACIÓN DE GRÁFICOS =====
const CHART_CONFIG = {
    // Colores del tema
    COLORS: {
        PRIMARY: '#667eea',
        SECONDARY: '#764ba2',
        SUCCESS: '#2ecc71',
        WARNING: '#e67e22',
        DANGER: '#e74c3c',
        INFO: '#3498db',
        LIGHT: 'rgba(255, 255, 255, 0.1)',
        DARK: 'rgba(0, 0, 0, 0.1)'
    },
    
    // Configuración de líneas
    LINE_STYLES: {
        SOLID: [],
        DASHED: [5, 5],
        DOTTED: [2, 2],
        DASH_DOT: [5, 2, 2, 2]
    },
    
    // Configuración de fuentes
    FONTS: {
        FAMILY: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        SIZE: {
            SMALL: 10,
            MEDIUM: 12,
            LARGE: 14,
            XLARGE: 16
        }
    }
};

// ===== MENSAJES Y TEXTOS =====
const TEXT_CONSTANTS = {
    // Títulos de secciones
    TITLES: {
        CONVERGENCE: 'Análisis de Convergencia',
        STABILITY: 'Análisis de Estabilidad',
        PARAMETERS: 'Parámetros del Modelo',
        RESULTS: 'Resultados del Análisis'
    },
    
    // Mensajes de estado
    STATUS_MESSAGES: {
        STABLE: 'El sistema es estable',
        UNSTABLE: 'El sistema es inestable',
        CONVERGENT: 'El método converge',
        DIVERGENT: 'El método diverge',
        COMPUTING: 'Calculando...',
        READY: 'Listo para análisis'
    },
    
    // Advertencias
    WARNINGS: {
        LARGE_DT: 'El paso temporal puede ser demasiado grande',
        HIGH_BETA: 'El ruido estocástico es muy intenso',
        EXTREME_FRACTAL: 'Dimensión fractal en rango extremo',
        STABILITY_RISK: 'Riesgo de inestabilidad numérica'
    }
};

// ===== FUNCIONES AUXILIARES =====
const HELPER_FUNCTIONS = {
    // Validación de parámetros
    validateParameter: function(param, value) {
        const config = MFSU_PARAMETERS[param.toUpperCase()];
        if (!config) return false;
        return value >= config.MIN && value <= config.MAX;
    },
    
    // Cálculo del número CFL
    calculateCFL: function(alpha, dt, dx) {
        return alpha * dt / (dx * dx);
    },
    
    // Estimación del paso temporal estable
    estimateStableDt: function(alpha, beta, gamma, dx) {
        const diffusionLimit = 0.5 * dx * dx / alpha;
        const stochasticLimit = 1.0 / (beta + gamma);
        return Math.min(diffusionLimit, stochasticLimit);
    },
    
    // Formateo de números científicos
    formatScientific: function(num, precision = 3) {
        return num.toExponential(precision);
    },
    
    // Formateo de números decimales
    formatDecimal: function(num, precision = 4) {
        return num.toFixed(precision);
    }
};

// ===== CONFIGURACIÓN DE ANÁLISIS =====
const ANALYSIS_CONFIG = {
    // Tipos de análisis disponibles
    ANALYSIS_TYPES: {
        CONVERGENCE: 'convergence',
        STABILITY: 'stability',
        SENSITIVITY: 'sensitivity',
        BIFURCATION: 'bifurcation'
    },
    
    // Métricas de error
    ERROR_METRICS: {
        L2_NORM: 'l2',
        L_INFINITY: 'linf',
        RELATIVE_ERROR: 'relative',
        ENERGY_ERROR: 'energy'
    },
    
    // Configuración de ruido
    NOISE_CONFIG: {
        SEED: 42,
        CORRELATION_LENGTH: 0.1,
        VARIANCE: 1.0,
        DISTRIBUTION: 'gaussian'
    }
};

// ===== CONDICIONES INICIALES =====
const INITIAL_CONDITIONS = {
    // Tipos de condiciones iniciales
    TYPES: {
        GAUSSIAN: 'gaussian',
        SINE_WAVE: 'sine',
        STEP_FUNCTION: 'step',
        RANDOM: 'random',
        FRACTAL: 'fractal'
    },
    
    // Parámetros para gaussiana
    GAUSSIAN: {
        AMPLITUDE: 0.1,
        CENTER: 0.5,
        WIDTH: 0.1
    },
    
    // Parámetros para onda sinusoidal
    SINE: {
        AMPLITUDE: 0.1,
        FREQUENCY: 2 * Math.PI,
        PHASE: 0
    }
};

// ===== EXPORTAR CONSTANTES =====
// Para uso en navegador (asignación global)
if (typeof window !== 'undefined') {
    window.MFSU_CONSTANTS = {
        MATH: MATH_CONSTANTS,
        PHYSICS: PHYSICAL_CONSTANTS,
        PARAMETERS: MFSU_PARAMETERS,
        NUMERICAL: NUMERICAL_CONFIG,
        CHARTS: CHART_CONFIG,
        TEXT: TEXT_CONSTANTS,
        HELPERS: HELPER_FUNCTIONS,
        ANALYSIS: ANALYSIS_CONFIG,
        INITIAL: INITIAL_CONDITIONS
    };
}

// Para uso en Node.js (exportación de módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MATH_CONSTANTS,
        PHYSICAL_CONSTANTS,
        MFSU_PARAMETERS,
        NUMERICAL_CONFIG,
        CHART_CONFIG,
        TEXT_CONSTANTS,
        HELPER_FUNCTIONS,
        ANALYSIS_CONFIG,
        INITIAL_CONDITIONS
    };
}

// ===== FUNCIONES DE INICIALIZACIÓN =====
function initializeConstants() {
    console.log('Constantes MFSU inicializadas');
    console.log('Versión: 1.0.0');
    console.log('Ecuación: ∂ψ/∂t = α(-Δ)^(∂/2)ψ + β·ξ_H(x,t)·ψ - γψ³ + f(x,t)');
    
    // Verificar dependencias
    if (typeof Math === 'undefined') {
        console.error('Error: Objeto Math no disponible');
        return false;
    }
    
    return true;
}

// ===== VALIDADORES =====
const VALIDATORS = {
    // Validar configuración completa
    validateConfiguration: function(config) {
        const required = ['alpha', 'beta', 'gamma', 'fractalDim', 'dt'];
        for (let param of required) {
            if (!config.hasOwnProperty(param)) {
                return { valid: false, error: `Parámetro faltante: ${param}` };
            }
        }
        
        // Validar rangos
        if (!HELPER_FUNCTIONS.validateParameter('alpha', config.alpha)) {
            return { valid: false, error: 'Parámetro α fuera de rango' };
        }
        if (!HELPER_FUNCTIONS.validateParameter('beta', config.beta)) {
            return { valid: false, error: 'Parámetro β fuera de rango' };
        }
        if (!HELPER_FUNCTIONS.validateParameter('gamma', config.gamma)) {
            return { valid: false, error: 'Parámetro γ fuera de rango' };
        }
        if (!HELPER_FUNCTIONS.validateParameter('fractal_dim', config.fractalDim)) {
            return { valid: false, error: 'Dimensión fractal fuera de rango' };
        }
        if (!HELPER_FUNCTIONS.validateParameter('dt', config.dt)) {
            return { valid: false, error: 'Paso temporal fuera de rango' };
        }
        
        return { valid: true };
    },
    
    // Validar estabilidad numérica
    validateNumericalStability: function(config, dx) {
        const cfl = HELPER_FUNCTIONS.calculateCFL(config.alpha, config.dt, dx);
        const stableDt = HELPER_FUNCTIONS.estimateStableDt(config.alpha, config.beta, config.gamma, dx);
        
        const warnings = [];
        
        if (cfl > NUMERICAL_CONFIG.STABILITY_CRITERIA.CFL_LIMIT) {
            warnings.push('Número CFL excede el límite de estabilidad');
        }
        
        if (config.dt > stableDt) {
            warnings.push('Paso temporal puede causar inestabilidad');
        }
        
        return {
            stable: warnings.length === 0,
            warnings: warnings,
            cfl: cfl,
            recommendedDt: stableDt
        };
    }
};

// Agregar validadores al objeto global
if (typeof window !== 'undefined') {
    window.MFSU_CONSTANTS.VALIDATORS = VALIDATORS;
}

// Inicializar automáticamente
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeConstants();
    });
} else {
    initializeConstants();
}
