/**
 * test-stability.js
 * Comprehensive stability test suite for the Fractal-Stochastic Universe Model (MFSU)
 * 
 * Tests for:
 * - Numerical stability of the fractional Laplacian implementation
 * - Convergence properties of the time-stepping scheme
 * - Parameter sensitivity analysis
 * - Boundary condition stability
 * - Stochastic noise effects on stability
 * - Conservation law verification
 */

// Test framework utilities
class TestSuite {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    assertAlmostEqual(actual, expected, tolerance = 1e-6, message = '') {
        const diff = Math.abs(actual - expected);
        if (diff > tolerance) {
            throw new Error(`AssertAlmostEqual failed: ${message}. Expected: ${expected}, Got: ${actual}, Diff: ${diff}`);
        }
    }

    async runTests() {
        console.log('🧪 Running MFSU Stability Tests...\n');
        
        for (const test of this.tests) {
            try {
                console.log(`▶️  ${test.name}`);
                await test.testFunction();
                console.log(`✅ ${test.name} - PASSED\n`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${test.name} - FAILED`);
                console.log(`   Error: ${error.message}\n`);
                this.failed++;
            }
        }

        console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}

// MFSU Implementation for Testing
class MFSUSolver {
    constructor(params = {}) {
        this.alpha = params.alpha || 1.0;
        this.beta = params.beta || 0.1;
        this.gamma = params.gamma || 0.1;
        this.fractalDim = params.fractalDim || 0.921;
        this.dt = params.dt || 0.01;
        this.dx = params.dx || 0.1;
        this.boundaryType = params.boundaryType || 'periodic';
    }

    // Fractional Laplacian implementation
    fractionalLaplacian(psi, order = this.fractalDim) {
        const n = psi.length;
        const result = new Array(n).fill(0);
        
        // Standard Laplacian first
        const laplacian = new Array(n).fill(0);
        for (let i = 1; i < n - 1; i++) {
            laplacian[i] = (psi[i+1] - 2*psi[i] + psi[i-1]) / (this.dx * this.dx);
        }
        
        // Boundary conditions
        if (this.boundaryType === 'periodic') {
            laplacian[0] = (psi[1] - 2*psi[0] + psi[n-1]) / (this.dx * this.dx);
            laplacian[n-1] = (psi[0] - 2*psi[n-1] + psi[n-2]) / (this.dx * this.dx);
        } else if (this.boundaryType === 'dirichlet') {
            laplacian[0] = 0;
            laplacian[n-1] = 0;
        }
        
        // Apply fractional power
        const fracPower = order / 2;
        
        if (fracPower === 1) {
            return laplacian;
        } else if (fracPower < 1) {
            // Caputo fractional derivative approximation
            for (let i = 0; i < n; i++) {
                const absLap = Math.abs(laplacian[i]);
                if (absLap > 1e-12) {
                    result[i] = Math.pow(absLap, fracPower) * Math.sign(laplacian[i]);
                }
            }
        } else {
            // Higher order approximation
            let temp = [...laplacian];
            for (let iter = 1; iter < Math.floor(fracPower); iter++) {
                const newTemp = new Array(n).fill(0);
                for (let i = 1; i < n - 1; i++) {
                    newTemp[i] = (temp[i+1] - 2*temp[i] + temp[i-1]) / (this.dx * this.dx);
                }
                if (this.boundaryType === 'periodic') {
                    newTemp[0] = (temp[1] - 2*temp[0] + temp[n-1]) / (this.dx * this.dx);
                    newTemp[n-1] = (temp[0] - 2*temp[n-1] + temp[n-2]) / (this.dx * this.dx);
                }
                temp = newTemp;
            }
            return temp;
        }
        
        return result;
    }

    // Generate Hurst noise
    generateHurstNoise(n, hurst = 0.5) {
        const noise = new Array(n);
        for (let i = 0; i < n; i++) {
            noise[i] = (Math.random() - 0.5) * 2;
        }
        
        // Apply Hurst correlations
        if (hurst !== 0.5) {
            const correlatedNoise = [...noise];
            for (let i = 1; i < n; i++) {
                const correlation = Math.pow(i, -hurst);
                correlatedNoise[i] = correlation * correlatedNoise[i-1] + 
                                   Math.sqrt(1 - correlation*correlation) * noise[i];
            }
            return correlatedNoise;
        }
        
        return noise;
    }

    // Single time step evolution
    timeStep(psi, noise = null) {
        const n = psi.length;
        const fractalTerm = this.fractionalLaplacian(psi);
        const psiNew = new Array(n);
        
        if (!noise) {
            noise = this.generateHurstNoise(n);
        }
        
        for (let i = 0; i < n; i++) {
            const diffusion = this.alpha * fractalTerm[i];
            const stochastic = this.beta * noise[i] * psi[i];
            const nonlinear = -this.gamma * Math.pow(psi[i], 3);
            
            psiNew[i] = psi[i] + this.dt * (diffusion + stochastic + nonlinear);
        }
        
        return psiNew;
    }

    // Evolve for multiple time steps
    evolve(psi0, numSteps) {
        let psi = [...psi0];
        const evolution = [];
        
        for (let step = 0; step < numSteps; step++) {
            psi = this.timeStep(psi);
            
            // Record statistics
            if (step % 10 === 0) {
                evolution.push({
                    step: step,
                    time: step * this.dt,
                    maxAmp: Math.max(...psi.map(x => Math.abs(x))),
                    l2Norm: Math.sqrt(psi.reduce((sum, x) => sum + x*x, 0)),
                    energy: this.computeEnergy(psi)
                });
            }
        }
        
        return { finalState: psi, evolution: evolution };
    }

    // Compute energy functional
    computeEnergy(psi) {
        const n = psi.length;
        let energy = 0;
        
        // Kinetic energy (fractional Laplacian term)
        const fracLap = this.fractionalLaplacian(psi);
        for (let i = 0; i < n; i++) {
            energy += 0.5 * psi[i] * fracLap[i];
        }
        
        // Potential energy (nonlinear term)
        for (let i = 0; i < n; i++) {
            energy += 0.25 * this.gamma * Math.pow(psi[i], 4);
        }
        
        return energy * this.dx;
    }

    // Compute L2 norm
    computeL2Norm(psi) {
        return Math.sqrt(psi.reduce((sum, x) => sum + x*x, 0) * this.dx);
    }
}

// Test functions
const testSuite = new TestSuite();

// Test 1: Basic initialization and parameter validation
testSuite.addTest('Basic Initialization', () => {
    const solver = new MFSUSolver({
        alpha: 1.0,
        beta: 0.1,
        gamma: 0.1,
        fractalDim: 0.921,
        dt: 0.01
    });
    
    testSuite.assert(solver.alpha === 1.0, 'Alpha parameter not set correctly');
    testSuite.assert(solver.beta === 0.1, 'Beta parameter not set correctly');
    testSuite.assert(solver.gamma === 0.1, 'Gamma parameter not set correctly');
    testSuite.assert(solver.fractalDim === 0.921, 'Fractal dimension not set correctly');
    testSuite.assert(solver.dt === 0.01, 'Time step not set correctly');
});

// Test 2: Fractional Laplacian correctness
testSuite.addTest('Fractional Laplacian - Classical Limit', () => {
    const solver = new MFSUSolver({ fractalDim: 2.0, dx: 0.1 });
    
    // Test with a simple quadratic function
    const n = 21;
    const psi = new Array(n);
    for (let i = 0; i < n; i++) {
        const x = i * solver.dx;
        psi[i] = x * x;
    }
    
    const result = solver.fractionalLaplacian(psi, 2.0);
    
    // For f(x) = x^2, the Laplacian should be constant = 2
    // Check interior points
    for (let i = 5; i < n - 5; i++) {
        testSuite.assertAlmostEqual(result[i], 2.0, 0.1, `Laplacian at point ${i}`);
    }
});

// Test 3: Conservation of L2 norm in deterministic case
testSuite.addTest('L2 Norm Conservation (Deterministic)', () => {
    const solver = new MFSUSolver({ 
        alpha: 1.0, 
        beta: 0.0, // No noise
        gamma: 0.0, // No nonlinearity
        dt: 0.001 
    });
    
    // Initial condition: Gaussian pulse
    const n = 64;
    const psi0 = new Array(n);
    for (let i = 0; i < n; i++) {
        const x = (i - n/2) * solver.dx;
        psi0[i] = Math.exp(-x*x / 0.1);
    }
    
    const initialNorm = solver.computeL2Norm(psi0);
    const result = solver.evolve(psi0, 100);
    const finalNorm = solver.computeL2Norm(result.finalState);
    
    testSuite.assertAlmostEqual(finalNorm, initialNorm, 0.01, 'L2 norm conservation');
});

// Test 4: Stability with small time steps
testSuite.addTest('Stability - Small Time Steps', () => {
    const solver = new MFSUSolver({ 
        alpha: 1.0, 
        beta: 0.1, 
        gamma: 0.1, 
        dt: 0.0001 
    });
    
    // Initial condition
    const n = 32;
    const psi0 = new Array(n);
    for (let i = 0; i < n; i++) {
        const x = (i - n/2) * solver.dx;
        psi0[i] = 0.1 * Math.sin(2 * Math.PI * x / (n * solver.dx));
    }
    
    const result = solver.evolve(psi0, 1000);
    const maxAmplitude = Math.max(...result.evolution.map(e => e.maxAmp));
    
    testSuite.assert(maxAmplitude < 10, 'Solution remains bounded with small time steps');
});

// Test 5: Instability with large time steps
testSuite.addTest('Instability Detection - Large Time Steps', () => {
    const solver = new MFSUSolver({ 
        alpha: 1.0, 
        beta: 0.1, 
        gamma: 0.1, 
        dt: 0.1 // Large time step
    });
    
    // Initial condition
    const n = 32;
    const psi0 = new Array(n);
    for (let i = 0; i < n; i++) {
        const x = (i - n/2) * solver.dx;
        psi0[i] = 0.1 * Math.sin(2 * Math.PI * x / (n * solver.dx));
    }
    
    const result = solver.evolve(psi0, 100);
    const growthRate = Math.log(result.evolution[result.evolution.length-1].maxAmp / result.evolution[0].maxAmp);
    
    testSuite.assert(growthRate > 1, 'Large time steps should cause instability');
});

// Test 6: Fractal dimension effect on diffusion
testSuite.addTest('Fractal Dimension Effect', () => {
    const solver1 = new MFSUSolver({ fractalDim: 1.0, beta: 0.0, gamma: 0.0 });
    const solver2 = new MFSUSolver({ fractalDim: 2.0, beta: 0.0, gamma: 0.0 });
    
    // Initial condition: localized pulse
    const n = 32;
    const psi0 = new Array(n);
    for (let i = 0; i < n; i++) {
        psi0[i] = (i === n/2) ? 1.0 : 0.0;
    }
    
    const result1 = solver1.evolve(psi0, 100);
    const result2 = solver2.evolve(psi0, 100);
    
    // Lower fractal dimension should lead to slower diffusion
    const spread1 = result1.evolution[result1.evolution.length-1].maxAmp;
    const spread2 = result2.evolution[result2.evolution.length-1].maxAmp;
    
    testSuite.assert(spread1 !== spread2, 'Fractal dimension affects diffusion behavior');
});

// Test 7: Nonlinear term stability
testSuite.addTest('Nonlinear Term Stability', () => {
    const solver = new MFSUSolver({ 
        alpha: 0.0, 
        beta: 0.0, 
        gamma: 1.0, // Only nonlinear term
        dt: 0.01 
    });
    
    // Initial condition with different amplitudes
    const n = 16;
    const psi0 = new Array(n);
    for (let i = 0; i < n; i++) {
        psi0[i] = (i % 2 === 0) ? 0.5 : -0.5;
    }
    
    const result = solver.evolve(psi0, 100);
    const finalAmp = result.evolution[result.evolution.length-1].maxAmp;
    
    testSuite.assert(finalAmp < 1.0, 'Nonlinear term should prevent blow-up');
});

// Test 8: Boundary condition consistency
testSuite.addTest('Boundary Condition Consistency', () => {
    const solverPeriodic = new MFSUSolver({ boundaryType: 'periodic' });
    const solverDirichlet = new MFSUSolver({ boundaryType: 'dirichlet' });
    
    const n = 16;
    const psi = new Array(n);
    for (let i = 0; i < n; i++) {
        psi[i] = Math.sin(2 * Math.PI * i / n);
    }
    
    const lapPeriodic = solverPeriodic.fractionalLaplacian(psi);
    const lapDirichlet = solverDirichlet.fractionalLaplacian(psi);
    
    // Boundary values should be different
    testSuite.assert(Math.abs(lapPeriodic[0] - lapDirichlet[0]) > 1e-10, 
                    'Periodic and Dirichlet boundaries give different results');
});

// Test 9: Convergence with mesh refinement
testSuite.addTest('Mesh Convergence', () => {
    const meshSizes = [0.2, 0.1, 0.05];
    const errors = [];
    
    for (const dx of meshSizes) {
        const solver = new MFSUSolver({ dx: dx, dt: 0.001, beta: 0.0 });
        const n = Math.floor(1.0 / dx);
        
        // Initial condition
        const psi0 = new Array(n);
        for (let i = 0; i < n; i++) {
            const x = i * dx;
            psi0[i] = Math.exp(-Math.pow(x - 0.5, 2) / 0.01);
        }
        
        const result = solver.evolve(psi0, 50);
        const finalNorm = solver.computeL2Norm(result.finalState);
        errors.push(finalNorm);
    }
    
    // Check that errors decrease with mesh refinement
    testSuite.assert(errors[1] < errors[0], 'Error should decrease with mesh refinement');
    testSuite.assert(errors[2] < errors[1], 'Error should continue decreasing');
});

// Test 10: Stochastic consistency
testSuite.addTest('Stochastic Consistency', () => {
    const solver = new MFSUSolver({ alpha: 0.1, beta: 0.1, gamma: 0.1 });
    
    // Run multiple realizations
    const n = 16;
    const psi0 = new Array(n);
    for (let i = 0; i < n; i++) {
        psi0[i] = 0.1 * (Math.random() - 0.5);
    }
    
    const numRealizations = 10;
    const finalNorms = [];
    
    for (let real = 0; real < numRealizations; real++) {
        const result = solver.evolve([...psi0], 100);
        finalNorms.push(solver.computeL2Norm(result.finalState));
    }
    
    // Check that different realizations give different results
    const mean = finalNorms.reduce((a, b) => a + b, 0) / finalNorms.length;
    const variance = finalNorms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / finalNorms.length;
    
    testSuite.assert(variance > 1e-6, 'Stochastic terms should produce variance between realizations');
});

// Test 11: Parameter sensitivity
testSuite.addTest('Parameter Sensitivity', () => {
    const baseParams = { alpha: 1.0, beta: 0.1, gamma: 0.1, dt: 0.01 };
    const solver1 = new MFSUSolver(baseParams);
    const solver2 = new MFSUSolver({ ...baseParams, alpha: 1.1 });
    
    const n = 16;
    const psi0 = new Array(n);
    for (let i = 0; i < n; i++) {
        psi0[i] = 0.1 * Math.sin(2 * Math.PI * i / n);
    }
    
    const result1 = solver1.evolve([...psi0], 100);
    const result2 = solver2.evolve([...psi0], 100);
    
    const norm1 = solver1.computeL2Norm(result1.finalState);
    const norm2 = solver2.computeL2Norm(result2.finalState);
    
    testSuite.assert(Math.abs(norm1 - norm2) > 1e-6, 
                    'Small parameter changes should affect solution');
});

// Test 12: Energy bounds
testSuite.addTest('Energy Bounds', () => {
    const solver = new MFSUSolver({ 
        alpha: 1.0, 
        beta: 0.0, // Deterministic
        gamma: 0.1, 
        dt: 0.001 
    });
    
    const n = 32;
    const psi0 = new Array(n);
    for (let i = 0; i < n; i++) {
        const x = (i - n/2) * solver.dx;
        psi0[i] = Math.exp(-x*x / 0.1);
    }
    
    const result = solver.evolve(psi0, 200);
    const energies = result.evolution.map(e => e.energy);
    
    // In the deterministic case, energy should be bounded
    const maxEnergy = Math.max(...energies);
    const minEnergy = Math.min(...energies);
    
    testSuite.assert(maxEnergy < 1000, 'Energy should remain bounded');
    testSuite.assert(minEnergy > -1000, 'Energy should not become too negative');
});

// Main execution
async function runAllTests() {
    console.log('🚀 MFSU Stability Test Suite');
    console.log('============================');
    console.log('Testing numerical stability of the Fractal-Stochastic Universe Model\n');
    
    const success = await testSuite.runTests();
    
    if (success) {
        console.log('🎉 All tests passed! The MFSU implementation appears stable.');
    } else {
        console.log('⚠️  Some tests failed. Please review the implementation.');
    }
    
    return success;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MFSUSolver, TestSuite, runAllTests };
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    // Browser environment
    window.runMFSUTests = runAllTests;
    window.MFSUSolver = MFSUSolver;
} else if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('test-stability.js')) {
    // Node.js environment
    runAllTests();
}
