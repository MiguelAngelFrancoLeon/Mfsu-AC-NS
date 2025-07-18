/**
 * ui-controls.js
 * Controles de Interfaz de Usuario para el Análisis de Convergencia y Estabilidad Numérica
 * Modelo Fractal-Estocástico del Universo (MFSU)
 */

class UIControls {
    constructor() {
        this.controls = {};
        this.callbacks = {};
        this.initialized = false;
    }

    /**
     * Inicializa todos los controles de la interfaz
     */
    initialize() {
        if (this.initialized) return;
        
        this.setupSliders();
        this.setupButtons();
        this.setupEventListeners();
        this.setupTooltips();
        this.updateParameterDisplay();
        
        this.initialized = true;
        console.log('UI Controls initialized successfully');
    }

    /**
     * Configurar todos los sliders con sus valores y rangos
     */
    setupSliders() {
        const sliderConfigs = {
            alpha: {
                min: 0.1,
                max: 2.0,
                step: 0.1,
                default: 1.0,
                label: 'Parámetro α (difusión)',
                description: 'Controla la difusión fractal del sistema'
            },
            beta: {
                min: 0.01,
                max: 0.5,
                step: 0.01,
                default: 0.1,
                label: 'Parámetro β (ruido)',
                description: 'Intensidad del ruido estocástico de Hurst'
            },
            gamma: {
                min: 0.01,
                max: 0.5,
                step: 0.01,
                default: 0.1,
                label: 'Parámetro γ (no linealidad)',
                description: 'Término no lineal cúbico de estabilización'
            },
            fractal: {
                min: 0.5,
                max: 1.5,
                step: 0.001,
                default: 0.921,
                label: 'Dimensión fractal ∂',
                description: 'Orden del operador Laplaciano fractal'
            },
            dt: {
                min: 0.001,
                max: 0.1,
                step: 0.001,
                default: 0.01,
                label: 'Paso temporal Δt',
                description: 'Discretización temporal para la evolución'
            }
        };

        Object.entries(sliderConfigs).forEach(([param, config]) => {
            this.setupSlider(param, config);
        });
    }

    /**
     * Configurar un slider individual
     */
    setupSlider(param, config) {
        const slider = document.getElementById(param + 'Slider');
        const valueSpan = document.getElementById(param + 'Value');
        
        if (!slider || !valueSpan) {
            console.warn(`Slider elements not found for parameter: ${param}`);
            return;
        }

        // Configurar propiedades del slider
        slider.min = config.min;
        slider.max = config.max;
        slider.step = config.step;
        slider.value = config.default;
        
        // Mostrar valor inicial
        valueSpan.textContent = this.formatValue(config.default, param);
        
        // Almacenar configuración
        this.controls[param] = {
            slider: slider,
            valueSpan: valueSpan,
            config: config
        };

        // Event listener para actualización en tiempo real
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            valueSpan.textContent = this.formatValue(value, param);
            this.triggerParameterChange(param, value);
        });

        // Event listener para cuando se suelta el slider
        slider.addEventListener('change', (e) => {
            const value = parseFloat(e.target.value);
            this.triggerParameterUpdate(param, value);
        });
    }

    /**
     * Configurar botones de la interfaz
     */
    setupButtons() {
        const buttons = {
            runAnalysis: {
                id: 'runAnalysisBtn',
                callback: () => this.runAnalysis(),
                tooltip: 'Ejecutar análisis completo de convergencia y estabilidad'
            },
            resetParams: {
                id: 'resetParamsBtn',
                callback: () => this.resetParameters(),
                tooltip: 'Restablecer todos los parámetros a valores por defecto'
            },
            exportData: {
                id: 'exportDataBtn',
                callback: () => this.exportData(),
                tooltip: 'Exportar datos de análisis en formato JSON'
            },
            quickPresets: {
                id: 'quickPresetsBtn',
                callback: () => this.showPresets(),
                tooltip: 'Cargar configuraciones predefinidas'
            }
        };

        Object.entries(buttons).forEach(([key, config]) => {
            const button = document.getElementById(config.id);
            if (button) {
                button.addEventListener('click', config.callback);
                if (config.tooltip) {
                    button.title = config.tooltip;
                }
            }
        });
    }

    /**
     * Configurar event listeners globales
     */
    setupEventListeners() {
        // Detección de cambios en parámetros críticos
        document.addEventListener('parameterChange', (e) => {
            this.validateParameters(e.detail);
        });

        // Prevenir envío de formularios
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.type === 'range') {
                e.preventDefault();
                this.runAnalysis();
            }
        });

        // Manejo de resize para gráficos
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Configurar tooltips informativos
     */
    setupTooltips() {
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(element => {
            const tooltip = element.getAttribute('data-tooltip');
            element.title = tooltip;
        });
    }

    /**
     * Formatear valores para mostrar
     */
    formatValue(value, param) {
        switch (param) {
            case 'alpha':
            case 'beta':
            case 'gamma':
                return value.toFixed(2);
            case 'fractal':
                return value.toFixed(3);
            case 'dt':
                return value.toFixed(3);
            default:
                return value.toString();
        }
    }

    /**
     * Obtener todos los parámetros actuales
     */
    getParameters() {
        const params = {};
        Object.entries(this.controls).forEach(([param, control]) => {
            params[param] = parseFloat(control.slider.value);
        });
        return params;
    }

    /**
     * Establecer parámetros programáticamente
     */
    setParameters(params) {
        Object.entries(params).forEach(([param, value]) => {
            if (this.controls[param]) {
                this.controls[param].slider.value = value;
                this.controls[param].valueSpan.textContent = this.formatValue(value, param);
            }
        });
        this.updateParameterDisplay();
    }

    /**
     * Restablecer parámetros a valores por defecto
     */
    resetParameters() {
        Object.entries(this.controls).forEach(([param, control]) => {
            const defaultValue = control.config.default;
            control.slider.value = defaultValue;
            control.valueSpan.textContent = this.formatValue(defaultValue, param);
        });
        this.updateParameterDisplay();
        this.triggerParameterReset();
    }

    /**
     * Validar parámetros y mostrar advertencias
     */
    validateParameters(params = null) {
        const currentParams = params || this.getParameters();
        const warnings = [];

        // Validación de estabilidad de Courant
        const courantNumber = currentParams.alpha * currentParams.dt / Math.pow(0.1, 2);
        if (courantNumber > 0.5) {
            warnings.push({
                type: 'stability',
                message: `Número de Courant (${courantNumber.toFixed(3)}) > 0.5. Reducir Δt o α.`
            });
        }

        // Validación de ruido estocástico
        if (currentParams.beta > 0.3) {
            warnings.push({
                type: 'noise',
                message: 'Nivel de ruido β muy alto. Puede causar inestabilidad numérica.'
            });
        }

        // Validación de dimensión fractal
        if (currentParams.fractal < 0.5 || currentParams.fractal > 1.5) {
            warnings.push({
                type: 'fractal',
                message: 'Dimensión fractal fuera del rango estable [0.5, 1.5].'
            });
        }

        // Validación de paso temporal
        const maxDt = 0.1 / (currentParams.alpha + currentParams.beta + currentParams.gamma);
        if (currentParams.dt > maxDt) {
            warnings.push({
                type: 'timestep',
                message: `Δt demasiado grande. Recomendado: Δt < ${maxDt.toFixed(4)}`
            });
        }

        this.displayWarnings(warnings);
        return warnings.length === 0;
    }

    /**
     * Mostrar advertencias en la interfaz
     */
    displayWarnings(warnings) {
        const warningContainer = document.getElementById('parameterWarnings');
        if (!warningContainer) return;

        if (warnings.length === 0) {
            warningContainer.style.display = 'none';
            return;
        }

        warningContainer.style.display = 'block';
        warningContainer.innerHTML = warnings.map(w => 
            `<div class="warning-item ${w.type}">⚠️ ${w.message}</div>`
        ).join('');
    }

    /**
     * Actualizar display de parámetros
     */
    updateParameterDisplay() {
        const params = this.getParameters();
        const displayContainer = document.getElementById('parameterSummary');
        
        if (displayContainer) {
            displayContainer.innerHTML = `
                <div class="param-summary">
                    <span class="param-item">α=${params.alpha?.toFixed(2)}</span>
                    <span class="param-item">β=${params.beta?.toFixed(2)}</span>
                    <span class="param-item">γ=${params.gamma?.toFixed(2)}</span>
                    <span class="param-item">∂=${params.fractal?.toFixed(3)}</span>
                    <span class="param-item">Δt=${params.dt?.toFixed(3)}</span>
                </div>
            `;
        }
    }

    /**
     * Configuraciones predefinidas
     */
    showPresets() {
        const presets = {
            stable: {
                name: 'Configuración Estable',
                params: { alpha: 1.0, beta: 0.05, gamma: 0.1, fractal: 0.921, dt: 0.01 }
            },
            chaotic: {
                name: 'Régimen Caótico',
                params: { alpha: 0.5, beta: 0.3, gamma: 0.05, fractal: 1.2, dt: 0.005 }
            },
            fractal: {
                name: 'Máxima Fractalidad',
                params: { alpha: 1.5, beta: 0.1, gamma: 0.2, fractal: 1.5, dt: 0.001 }
            },
            minimal: {
                name: 'Mínima Complejidad',
                params: { alpha: 0.5, beta: 0.01, gamma: 0.01, fractal: 0.5, dt: 0.01 }
            }
        };

        this.displayPresetModal(presets);
    }

    /**
     * Mostrar modal de presets
     */
    displayPresetModal(presets) {
        const modal = document.createElement('div');
        modal.className = 'preset-modal';
        modal.innerHTML = `
            <div class="preset-content">
                <h3>Configuraciones Predefinidas</h3>
                <div class="preset-list">
                    ${Object.entries(presets).map(([key, preset]) => `
                        <div class="preset-item" data-preset="${key}">
                            <h4>${preset.name}</h4>
                            <p>${Object.entries(preset.params).map(([p, v]) => `${p}=${v}`).join(', ')}</p>
                        </div>
                    `).join('')}
                </div>
                <button onclick="this.parentElement.parentElement.remove()">Cerrar</button>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('preset-item') || e.target.parentElement.classList.contains('preset-item')) {
                const presetKey = e.target.dataset.preset || e.target.parentElement.dataset.preset;
                this.setParameters(presets[presetKey].params);
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    /**
     * Exportar datos de configuración
     */
    exportData() {
        const data = {
            parameters: this.getParameters(),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mfsu_config_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Manejar redimensionamiento de ventana
     */
    handleResize() {
        // Ajustar layouts responsivos
        const container = document.querySelector('.controls');
        if (container) {
            const width = container.offsetWidth;
            container.classList.toggle('compact', width < 768);
        }
    }

    /**
     * Ejecutar análisis completo
     */
    runAnalysis() {
        if (!this.validateParameters()) {
            return;
        }

        const params = this.getParameters();
        this.triggerAnalysis(params);
    }

    /**
     * Eventos personalizados
     */
    triggerParameterChange(param, value) {
        const event = new CustomEvent('parameterChange', {
            detail: { param, value, allParams: this.getParameters() }
        });
        document.dispatchEvent(event);
    }

    triggerParameterUpdate(param, value) {
        const event = new CustomEvent('parameterUpdate', {
            detail: { param, value, allParams: this.getParameters() }
        });
        document.dispatchEvent(event);
    }

    triggerParameterReset() {
        const event = new CustomEvent('parameterReset', {
            detail: { params: this.getParameters() }
        });
        document.dispatchEvent(event);
    }

    triggerAnalysis(params) {
        const event = new CustomEvent('runAnalysis', {
            detail: { params }
        });
        document.dispatchEvent(event);
    }

    /**
     * Registrar callbacks externos
     */
    onParameterChange(callback) {
        document.addEventListener('parameterChange', callback);
    }

    onParameterUpdate(callback) {
        document.addEventListener('parameterUpdate', callback);
    }

    onParameterReset(callback) {
        document.addEventListener('parameterReset', callback);
    }

    onAnalysisRun(callback) {
        document.addEventListener('runAnalysis', callback);
    }

    /**
     * Utilidades de estado
     */
    getState() {
        return {
            parameters: this.getParameters(),
            isValid: this.validateParameters(),
            initialized: this.initialized
        };
    }

    setState(state) {
        if (state.parameters) {
            this.setParameters(state.parameters);
        }
    }

    /**
     * Destruir controles y limpiar eventos
     */
    destroy() {
        Object.values(this.controls).forEach(control => {
            control.slider.removeEventListener('input', null);
            control.slider.removeEventListener('change', null);
        });
        
        this.controls = {};
        this.callbacks = {};
        this.initialized = false;
    }
}

// Crear instancia global
const uiControls = new UIControls();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => uiControls.initialize());
} else {
    uiControls.initialize();
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIControls, uiControls };
}
