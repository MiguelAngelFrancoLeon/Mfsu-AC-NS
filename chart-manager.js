/**
 * chart-manager.js
 * Gestor de gráficos y visualizaciones para el Modelo Fractal-Estocástico del Universo (MFSU)
 * Maneja la creación, actualización y renderizado de gráficos interactivos
 */

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.defaultColors = {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#2ecc71',
            warning: '#f39c12',
            danger: '#e74c3c',
            info: '#3498db',
            light: '#ecf0f1',
            dark: '#2c3e50'
        };
        this.gradients = new Map();
        this.animationConfig = {
            duration: 750,
            easing: 'easeInOutQuart'
        };
    }

    /**
     * Crear gradiente para un contexto de canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {string} color1 - Color inicial
     * @param {string} color2 - Color final
     * @param {string} direction - Dirección del gradiente
     * @returns {CanvasGradient} - Gradiente creado
     */
    createGradient(ctx, color1, color2, direction = 'vertical') {
        const canvas = ctx.canvas;
        let gradient;
        
        switch (direction) {
            case 'horizontal':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                break;
            case 'diagonal':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                break;
            case 'radial':
                gradient = ctx.createRadialGradient(
                    canvas.width / 2, canvas.height / 2, 0,
                    canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2
                );
                break;
            default: // vertical
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        }
        
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        return gradient;
    }

    /**
     * Configuración base para gráficos
     * @param {string} title - Título del gráfico
     * @param {string} xLabel - Etiqueta del eje X
     * @param {string} yLabel - Etiqueta del eje Y
     * @param {boolean} logarithmic - Si el eje Y es logarítmico
     * @returns {Object} - Configuración de Chart.js
     */
    getBaseConfig(title, xLabel = '', yLabel = '', logarithmic = false) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: this.animationConfig,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: this.defaultColors.dark
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: this.defaultColors.primary,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: !!xLabel,
                        text: xLabel,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    display: true,
                    type: logarithmic ? 'logarithmic' : 'linear',
                    title: {
                        display: !!yLabel,
                        text: yLabel,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        };
    }

    /**
     * Crear gráfico de convergencia
     * @param {string} canvasId - ID del canvas
     * @param {Array} data - Datos de convergencia
     * @returns {Chart} - Instancia del gráfico
     */
    createConvergenceChart(canvasId, data = []) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const gradient = this.createGradient(ctx, this.defaultColors.primary, this.defaultColors.secondary);
        
        const config = {
            type: 'line',
            data: {
                labels: data.map(d => d.order?.toFixed(0) || ''),
                datasets: [{
                    label: 'Error L2',
                    data: data.map(d => d.error || 0),
                    borderColor: this.defaultColors.primary,
                    backgroundColor: gradient,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.defaultColors.primary,
                    pointBorderColor: 'white',
                    pointBorderWidth: 2
                }]
            },
            options: {
                ...this.getBaseConfig(
                    'Convergencia del Método Numérico',
                    'Refinamiento de Malla (log₂)',
                    'Error L2',
                    true
                ),
                plugins: {
                    ...this.getBaseConfig().plugins,
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                scaleID: 'x',
                                value: 'ideal',
                                borderColor: this.defaultColors.success,
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: 'Convergencia Ideal',
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Crear gráfico de estabilidad temporal
     * @param {string} canvasId - ID del canvas
     * @param {Array} data - Datos de evolución temporal
     * @returns {Chart} - Instancia del gráfico
     */
    createStabilityChart(canvasId, data = []) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const gradient = this.createGradient(ctx, this.defaultColors.secondary, this.defaultColors.primary);
        
        const config = {
            type: 'line',
            data: {
                labels: data.map(d => d.time?.toFixed(2) || ''),
                datasets: [{
                    label: 'Máximo |ψ|',
                    data: data.map(d => d.maxAmp || 0),
                    borderColor: this.defaultColors.secondary,
                    backgroundColor: gradient,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                ...this.getBaseConfig(
                    'Estabilidad Temporal',
                    'Tiempo',
                    'Amplitud Máxima'
                ),
                scales: {
                    ...this.getBaseConfig().scales,
                    y: {
                        ...this.getBaseConfig().scales.y,
                        beginAtZero: true
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Crear gráfico de energía y entropía
     * @param {string} canvasId - ID del canvas
     * @param {Array} data - Datos de evolución
     * @returns {Chart} - Instancia del gráfico
     */
    createEnergyEntropyChart(canvasId, data = []) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const config = {
            type: 'line',
            data: {
                labels: data.map(d => d.time?.toFixed(2) || ''),
                datasets: [{
                    label: 'Energía',
                    data: data.map(d => d.energy || 0),
                    borderColor: this.defaultColors.danger,
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    yAxisID: 'y',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 2
                }, {
                    label: 'Entropía',
                    data: data.map(d => d.entropy || 0),
                    borderColor: this.defaultColors.success,
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 2
                }]
            },
            options: {
                ...this.getBaseConfig(
                    'Evolución de Energía y Entropía',
                    'Tiempo',
                    ''
                ),
                scales: {
                    x: this.getBaseConfig().scales.x,
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Energía',
                            color: this.defaultColors.danger
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Entropía',
                            color: this.defaultColors.success
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Crear gráfico de superficie 3D (usando Chart.js con datos simulados)
     * @param {string} canvasId - ID del canvas
     * @param {Array} psi - Datos de la función de onda
     * @returns {Chart} - Instancia del gráfico
     */
    createSurfaceChart(canvasId, psi = []) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Crear representación 2D de la superficie
        const x = psi.map((_, i) => i / psi.length);
        const y = psi.map(val => val);
        
        const config = {
            type: 'line',
            data: {
                labels: x.map(val => val.toFixed(2)),
                datasets: [{
                    label: 'ψ(x,t)',
                    data: y,
                    borderColor: this.defaultColors.info,
                    backgroundColor: this.createGradient(ctx, this.defaultColors.info, this.defaultColors.light),
                    tension: 0.4,
                    fill: true,
                    pointRadius: 1,
                    pointHoverRadius: 4
                }]
            },
            options: {
                ...this.getBaseConfig(
                    'Función de Onda ψ(x,t)',
                    'Posición x',
                    'Amplitud ψ'
                ),
                elements: {
                    line: {
                        borderCapStyle: 'round',
                        borderJoinStyle: 'round'
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Crear gráfico de espectro de frecuencias
     * @param {string} canvasId - ID del canvas
     * @param {Array} psi - Datos de la función de onda
     * @returns {Chart} - Instancia del gráfico
     */
    createSpectrumChart(canvasId, psi = []) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Calcular FFT simplificada
        const spectrum = this.calculateSpectrum(psi);
        
        const config = {
            type: 'bar',
            data: {
                labels: spectrum.frequencies.map(f => f.toFixed(2)),
                datasets: [{
                    label: 'Amplitud Espectral',
                    data: spectrum.amplitudes,
                    backgroundColor: this.createGradient(ctx, this.defaultColors.warning, this.defaultColors.danger),
                    borderColor: this.defaultColors.warning,
                    borderWidth: 1
                }]
            },
            options: {
                ...this.getBaseConfig(
                    'Espectro de Frecuencias',
                    'Frecuencia',
                    'Amplitud'
                ),
                scales: {
                    ...this.getBaseConfig().scales,
                    y: {
                        ...this.getBaseConfig().scales.y,
                        type: 'logarithmic'
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Crear gráfico de análisis de estabilidad von Neumann
     * @param {string} canvasId - ID del canvas
     * @param {Object} stabilityData - Datos de análisis von Neumann
     * @returns {Chart} - Instancia del gráfico
     */
    createVonNeumannChart(canvasId, stabilityData = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const config = {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Factor de Amplificación',
                    data: (stabilityData.kValues || []).map((k, i) => ({
                        x: k,
                        y: stabilityData.amplificationFactors?.[i] || 0
                    })),
                    backgroundColor: this.defaultColors.primary,
                    borderColor: this.defaultColors.primary,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                ...this.getBaseConfig(
                    'Análisis de Estabilidad von Neumann',
                    'Número de Onda k',
                    'Factor de Amplificación'
                ),
                plugins: {
                    ...this.getBaseConfig().plugins,
                    annotation: {
                        annotations: {
                            stabilityLine: {
                                type: 'line',
                                scaleID: 'y',
                                value: 1,
                                borderColor: this.defaultColors.danger,
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: 'Límite de Estabilidad',
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Crear gráfico de métricas múltiples
     * @param {string} canvasId - ID del canvas
     * @param {Object} metrics - Métricas del sistema
     * @returns {Chart} - Instancia del gráfico
     */
    createMetricsChart(canvasId, metrics = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const config = {
            type: 'radar',
            data: {
                labels: ['Convergencia', 'Estabilidad', 'Precisión', 'Eficiencia', 'Robustez'],
                datasets: [{
                    label: 'Métricas del Sistema',
                    data: [
                        metrics.convergence || 0,
                        metrics.stability || 0,
                        metrics.precision || 0,
                        metrics.efficiency || 0,
                        metrics.robustness || 0
                    ],
                    fill: true,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: this.defaultColors.primary,
                    pointBackgroundColor: this.defaultColors.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.defaultColors.primary
                }]
            },
            options: {
                ...this.getBaseConfig('Métricas del Sistema MFSU'),
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Actualizar gráfico existente
     * @param {string} canvasId - ID del canvas
     * @param {Array} newData - Nuevos datos
     * @param {number} datasetIndex - Índice del dataset a actualizar
     */
    updateChart(canvasId, newData, datasetIndex = 0) {
        const chart = this.charts.get(canvasId);
        if (!chart) return;
        
        if (Array.isArray(newData)) {
            if (newData.length > 0 && typeof newData[0] === 'object') {
                // Datos con estructura {x, y} o {time, value}
                chart.data.labels = newData.map(d => d.x || d.time || '');
                chart.data.datasets[datasetIndex].data = newData.map(d => d.y || d.value || 0);
            } else {
                // Datos simples
                chart.data.datasets[datasetIndex].data = newData;
            }
        }
        
        chart.update('none'); // Actualización sin animación para mejor rendimiento
    }

    /**
     * Actualizar múltiples datasets
     * @param {string} canvasId - ID del canvas
     * @param {Array} datasetsData - Array de datos para cada dataset
     */
    updateMultipleDatasets(canvasId, datasetsData) {
        const chart = this.charts.get(canvasId);
        if (!chart) return;
        
        datasetsData.forEach((data, index) => {
            if (chart.data.datasets[index]) {
                chart.data.datasets[index].data = data;
            }
        });
        
        chart.update('none');
    }

    /**
     * Calcular espectro de frecuencias (FFT simplificada)
     * @param {Array} signal - Señal de entrada
     * @returns {Object} - Espectro calculado
     */
    calculateSpectrum(signal) {
        const n = signal.length;
        const frequencies = [];
        const amplitudes = [];
        
        // FFT simplificada para visualización
        for (let k = 0; k < n / 2; k++) {
            let real = 0, imag = 0;
            
            for (let i = 0; i < n; i++) {
                const angle = -2 * Math.PI * k * i / n;
                real += signal[i] * Math.cos(angle);
                imag += signal[i] * Math.sin(angle);
            }
            
            frequencies.push(k / n);
            amplitudes.push(Math.sqrt(real * real + imag * imag));
        }
        
        return { frequencies, amplitudes };
    }

    /**
     * Añadir punto de datos en tiempo real
     * @param {string} canvasId - ID del canvas
     * @param {*} label - Etiqueta del nuevo punto
     * @param {*} value - Valor del nuevo punto
     * @param {number} maxPoints - Máximo número de puntos a mantener
     */
    addRealtimeData(canvasId, label, value, maxPoints = 100) {
        const chart = this.charts.get(canvasId);
        if (!chart) return;
        
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(value);
        
        // Mantener solo los últimos maxPoints puntos
        if (chart.data.labels.length > maxPoints) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        
        chart.update('none');
    }

    /**
     * Exportar gráfico como imagen
     * @param {string} canvasId - ID del canvas
     * @param {string} filename - Nombre del archivo
     */
    exportChart(canvasId, filename = 'chart.png') {
        const chart = this.charts.get(canvasId);
        if (!chart) return;
        
        const canvas = chart.canvas;
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL();
        link.click();
    }

    /**
     * Cambiar tema de los gráficos
     * @param {string} theme - Tema ('light' o 'dark')
     */
    setTheme(theme) {
        const isDark = theme === 'dark';
        
        this.charts.forEach(chart => {
            chart.options.plugins.title.color = isDark ? '#ecf0f1' : '#2c3e50';
            chart.options.plugins.legend.labels.color = isDark ? '#ecf0f1' : '#2c3e50';
            chart.options.scales.x.title.color = isDark ? '#ecf0f1' : '#2c3e50';
            chart.options.scales.y.title.color = isDark ? '#ecf0f1' : '#2c3e50';
            chart.options.scales.x.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            chart.update();
        });
    }

    /**
     * Destruir gráfico
     * @param {string} canvasId - ID del canvas
     */
    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.destroy();
            this.charts.delete(canvasId);
        }
    }

    /**
     * Destruir todos los gráficos
     */
    destroyAllCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }

    /**
     * Redimensionar todos los gráficos
     */
    resizeAllCharts() {
        this.charts.forEach(chart => chart.resize());
    }

    /**
     * Obtener estadísticas de un gráfico
     * @param {string} canvasId - ID del canvas
     * @returns {Object} - Estadísticas del gráfico
     */
    getChartStats(canvasId) {
        const chart = this.charts.get(canvasId);
        if (!chart) return null;
        
        const data = chart.data.datasets[0].data;
        const stats = {
            count: data.length,
            min: Math.min(...data),
            max: Math.max(...data),
            mean: data.reduce((a, b) => a + b, 0) / data.length,
            std: 0
        };
        
        // Calcular desviación estándar
        const variance = data.reduce((acc, val) => acc + Math.pow(val - stats.mean, 2), 0) / data.length;
        stats.std = Math.sqrt(variance);
        
        return stats;
    }
}

// Función de inicialización para uso global
function initializeChartManager() {
    window.chartManager = new ChartManager();
    
    // Configurar Chart.js globalmente
    Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    
    // Registrar plugin personalizado para animaciones
    Chart.register({
        id: 'customAnimations',
        beforeUpdate: function(chart) {
            chart.options.animation.duration = window.chartManager.animationConfig.duration;
            chart.options.animation.easing = window.chartManager.animationConfig.easing;
        }
    });
    
    return window.chartManager;
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartManager, initializeChartManager };
}

// Auto-inicializar si estamos en un navegador
if (typeof window !== 'undefined' && typeof Chart !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeChartManager);
}
