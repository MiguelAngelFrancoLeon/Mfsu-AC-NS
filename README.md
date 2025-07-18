# MFSU Convergence Analysis

## Modelo Fractal-Estocástico del Universo (MFSU)

Un simulador numérico avanzado para el análisis de convergencia y estabilidad del Modelo Fractal-Estocástico del Universo, implementando la ecuación diferencial parcial estocástica fractal:

```
∂ψ/∂t = α(-Δ)^(∂/2)ψ + β·ξ_H(x,t)·ψ - γψ³ + f(x,t)
```

## 🌟 Características Principales

- **Operador Laplaciano Fractal**: Implementación del operador `(-Δ)^(∂/2)` con dimensión fractal configurable
- **Ruido de Hurst**: Generación de ruido estocástico espacialmente correlacionado `ξ_H(x,t)`
- **Análisis de Convergencia**: Evaluación multi-malla del orden de convergencia numérica
- **Análisis de Estabilidad**: Monitoreo de la estabilidad temporal y crecimiento de amplitudes
- **Visualización Interactiva**: Gráficos en tiempo real con Chart.js
- **Interfaz Intuitiva**: Controles deslizantes para exploración paramétrica

## 🔬 Fundamentos Teóricos

### Ecuación MFSU

La ecuación del Modelo Fractal-Estocástico del Universo combina:

1. **Difusión Fractal**: `α(-Δ)^(∂/2)ψ` - Propagación no-local con dimensión fractal ∂
2. **Ruido Estocástico**: `β·ξ_H(x,t)·ψ` - Fluctuaciones cuánticas con correlaciones de Hurst
3. **No-linealidad**: `-γψ³` - Autointeracción del campo
4. **Forzamiento**: `f(x,t)` - Términos de fuente externa

### Parámetros del Modelo

| Parámetro | Símbolo | Descripción | Rango Típico |
|-----------|---------|-------------|--------------|
| Difusión | α | Coeficiente de difusión fractal | 0.1 - 2.0 |
| Ruido | β | Intensidad del ruido estocástico | 0.01 - 0.5 |
| No-linealidad | γ | Coeficiente de autointeracción | 0.01 - 0.5 |
| Dimensión Fractal | ∂ | Dimensión del operador fractal | 0.5 - 1.5 |
| Paso Temporal | Δt | Discretización temporal | 0.001 - 0.1 |

## 🚀 Instalación y Uso

### Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet para CDN de Chart.js y Math.js

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/mfsu-convergence-analysis.git
cd mfsu-convergence-analysis
```

2. Abre `index.html` en tu navegador web

### Uso Básico

#### HTML/JavaScript Standalone

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.11.0/math.min.js"></script>
    <script src="convergence-analysis.js"></script>
</head>
<body>
    <!-- Controles e interfaz -->
    <div id="analysisResults"></div>
    <canvas id="convergenceChart"></canvas>
    <canvas id="stabilityChart"></canvas>
    
    <script>
        // Inicializar análisis
        const mfsuAnalysis = new MFSUConvergenceAnalysis();
        mfsuAnalysis.initialize();
        
        // Ejecutar análisis
        mfsuAnalysis.runConvergenceAnalysis();
    </script>
</body>
</html>
```

#### API Programática

```javascript
// Crear instancia
const analysis = new MFSUConvergenceAnalysis();
analysis.initialize();

// Configurar parámetros
analysis.setModelParameters({
    alpha: 1.2,
    beta: 0.15,
    gamma: 0.08,
    fractalDim: 0.921,
    dt: 0.005
});

// Ejecutar análisis
analysis.runConvergenceAnalysis();

// Obtener parámetros actuales
const params = analysis.getModelParameters();
console.log('Parámetros actuales:', params);
```

## 📊 Análisis Numérico

### Convergencia

El análisis de convergencia evalúa cómo el error numérico decrece con el refinamiento de la malla:

- **Mallas**: 16, 32, 64, 128 puntos espaciales
- **Métrica**: Error L2 entre soluciones
- **Orden**: Calculado como log₂(error_coarse/error_fine)

### Estabilidad

La estabilidad temporal monitorea el crecimiento de amplitudes:

- **Criterio**: Amplitud final < 10 × amplitud inicial
- **Tasa de Crecimiento**: ln(A_final/A_inicial)/tiempo
- **Límite CFL**: Δt < 0.1/(α + β + γ)

## 🔧 Métodos Númericos

### Operador Fractal

```javascript
// Implementación del operador (-Δ)^(∂/2)
fractionalLaplacian(psi, dx, order) {
    // Laplaciano base con diferencias finitas
    const laplacian = computeLaplacian(psi, dx);
    
    // Aplicar potencia fractal
    const fracPower = order / 2;
    
    if (fracPower < 1) {
        // Aproximación de Caputo
        return caputoApproximation(laplacian, fracPower);
    } else {
        // Laplaciano iterado
        return iteratedLaplacian(laplacian, fracPower);
    }
}
```

### Ruido de Hurst

```javascript
// Generación de ruido espacialmente correlacionado
generateHurstNoise(nx, nt, hurst = 0.5) {
    const noise = [];
    
    for (let t = 0; t < nt; t++) {
        const spatialNoise = generateWhiteNoise(nx);
        const correlatedNoise = applyHurstCorrelation(spatialNoise, hurst);
        noise.push(correlatedNoise);
    }
    
    return noise;
}
```

### Esquema Temporal

```javascript
// Integración temporal explícita (Euler)
for (let t = 0; t < nt; t++) {
    const fractalTerm = fractionalLaplacian(psi, dx, fractalDim);
    const stochasticTerm = beta * hurstNoise[t] * psi;
    const nonlinearTerm = -gamma * psi³;
    
    psi_new = psi + dt * (alpha * fractalTerm + stochasticTerm + nonlinearTerm);
    psi = psi_new;
}
```

## 📈 Interpretación de Resultados

### Convergencia Óptima

- **Orden ≈ 2**: Convergencia de segundo orden (ideal)
- **Orden 1-2**: Convergencia aceptable
- **Orden < 1**: Convergencia lenta, revisar parámetros

### Estabilidad Numérica

- **✓ Estable**: Amplitudes controladas, crecimiento limitado
- **✗ Inestable**: Crecimiento exponencial, reducir Δt

### Advertencias

- **Δt muy grande**: Reducir paso temporal
- **Parámetros extremos**: Ajustar α, β, γ
- **Dimensión fractal**: Valores cercanos a 1 son más estables

## 🎛️ Controles Interactivos

### Parámetros Ajustables

- **α (Difusión)**: 0.1 - 2.0, controla la difusión fractal
- **β (Ruido)**: 0.01 - 0.5, intensidad del ruido estocástico
- **γ (No-linealidad)**: 0.01 - 0.5, fuerza de autointeracción
- **∂ (Dimensión Fractal)**: 0.5 - 1.5, orden del operador fractal
- **Δt (Paso Temporal)**: 0.001 - 0.1, discretización temporal

### Visualizaciones

1. **Gráfico de Convergencia**: Error L2 vs refinamiento de malla
2. **Gráfico de Estabilidad**: Amplitud máxima vs tiempo
3. **Métricas Numéricas**: Orden, error final, tasa de crecimiento

## ⚠️ Limitaciones y Consideraciones

### Limitaciones Numéricas

- **Aproximación del Operador Fractal**: Válida para ∂ ∈ [0.5, 1.5]
- **Ruido Pseudo-aleatorio**: Determinista, no verdaderamente estocástico
- **Esquema Explícito**: Limitaciones CFL en el paso temporal

### Consideraciones Físicas

- **Condiciones de Frontera**: Periódicas por defecto
- **Condiciones Iniciales**: Modulación Gaussiana con ruido
- **Interpretación**: Modelo fenomenológico, no derivado ab initio

## 🔬 Aplicaciones Científicas

### Cosmología

- Modelado de fluctuaciones primordiales
- Evolución de estructuras a gran escala
- Análisis de la materia oscura

### Física de Plasma

- Turbulencia magnetohidrodinámica
- Transporte anómalo
- Fenómenos de autoorganización

### Biofísica

- Difusión molecular fractal
- Procesos de señalización celular
- Dinámica de membranas

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📋 Roadmap

- [ ] Implementación de esquemas implícitos
- [ ] Soporte para geometrías no-periódicas
- [ ] Análisis de bifurcaciones
- [ ] Paralelización con Web Workers
- [ ] Exportación de datos en formatos científicos
- [ ] Integración con librerías de cálculo científico

## 📚 Referencias

1. Mandelbrot, B.B. (1982). "The Fractal Geometry of Nature"
2. Hurst, H.E. (1951). "Long-term storage capacity of reservoirs"
3. Metzler, R. & Klafter, J. (2000). "The random walk's guide to anomalous diffusion"
4. Tarasov, V.E. (2010). "Fractional Dynamics: Applications of Fractional Calculus"

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Desarrollador Principal** - *Implementación inicial* - [Tu Nombre]

## 🙏 Agradecimientos

- Comunidad científica de computación fractal
- Desarrolladores de Chart.js y Math.js
- Investigadores en cosmología teórica

---

**Nota**: Este es un modelo teórico para fines de investigación y educación. Los resultados deben interpretarse en el contexto apropiado y validarse contra datos experimentales cuando sea aplicable.
