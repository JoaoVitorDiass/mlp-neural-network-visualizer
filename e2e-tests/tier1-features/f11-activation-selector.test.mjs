import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveActivation, ACTIVATION_MATH } from '../helpers/activation-oracle.mjs';

describe('Tier 1 - F11: Activation Function Selector', () => {
  it('F11-1: Supports Logistica, Hiperbolica, and Linear functions', () => {
    assert.strictEqual(resolveActivation('Logistica'), 'Logistica');
    assert.strictEqual(resolveActivation('Hiperbolica'), 'Hiperbolica');
    assert.strictEqual(resolveActivation('Linear'), 'Linear');
  });

  it('F11-2: Normalizes common aliases ("tanh", "sigmoid", accented names)', () => {
    assert.strictEqual(resolveActivation('tanh'), 'Hiperbolica');
    assert.strictEqual(resolveActivation('hiperbólica'), 'Hiperbolica');
    assert.strictEqual(resolveActivation('sigmoid'), 'Logistica');
    assert.strictEqual(resolveActivation('logística'), 'Logistica');
  });

  it('F11-3: Logistica (Sigmoid) activation maps net=0 to 0.5 with derivative 0.25', () => {
    const math = ACTIVATION_MATH.Logistica;
    const outputAtZero = math.activate(0);
    assert.strictEqual(outputAtZero, 0.5);
    const derivAtHalf = math.derivative(0.5);
    assert.strictEqual(derivAtHalf, 0.25);
  });

  it('F11-4: Hiperbolica (Tanh) activation maps net=0 to 0.0 with derivative 1.0', () => {
    const math = ACTIVATION_MATH.Hiperbolica;
    const outputAtZero = math.activate(0);
    assert.strictEqual(outputAtZero, 0.0);
    const derivAtZero = math.derivative(0.0);
    assert.strictEqual(derivAtZero, 1.0);
  });

  it('F11-5: Linear activation maps net=10 to 1.0 with constant derivative 0.1', () => {
    const math = ACTIVATION_MATH.Linear;
    const outputAtTen = math.activate(10);
    assert.strictEqual(outputAtTen, 1.0);
    const deriv = math.derivative(1.0);
    assert.strictEqual(deriv, 0.1);
  });
});
