import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function validateHyperparameters(params) {
  const errors = [];
  if (typeof params.learningRate !== 'number' || params.learningRate <= 0) {
    errors.push('learningRate must be a positive number (> 0)');
  }
  if (typeof params.errorValue !== 'number' || params.errorValue <= 0) {
    errors.push('errorValue must be a positive number (> 0)');
  }
  if (!Number.isInteger(params.epochs) || params.epochs < 1) {
    errors.push('epochs must be an integer >= 1');
  }
  return errors;
}

describe('Tier 1 - F10: Hyperparameters Configuration', () => {
  it('F10-1: Standard default hyperparameters pass validation', () => {
    const defaults = {
      learningRate: 0.1,
      errorValue: 0.01,
      epochs: 1000,
    };
    const errors = validateHyperparameters(defaults);
    assert.deepStrictEqual(errors, []);
  });

  it('F10-2: Non-positive learning rate (<= 0) is rejected', () => {
    assert.ok(validateHyperparameters({ learningRate: 0, errorValue: 0.01, epochs: 100 }).length > 0);
    assert.ok(validateHyperparameters({ learningRate: -0.05, errorValue: 0.01, epochs: 100 }).length > 0);
  });

  it('F10-3: Non-positive target error (<= 0) is rejected', () => {
    assert.ok(validateHyperparameters({ learningRate: 0.1, errorValue: 0, epochs: 100 }).length > 0);
    assert.ok(validateHyperparameters({ learningRate: 0.1, errorValue: -0.01, epochs: 100 }).length > 0);
  });

  it('F10-4: Epochs < 1 or floating point epochs are rejected', () => {
    assert.ok(validateHyperparameters({ learningRate: 0.1, errorValue: 0.01, epochs: 0 }).length > 0);
    assert.ok(validateHyperparameters({ learningRate: 0.1, errorValue: 0.01, epochs: 10.5 }).length > 0);
  });

  it('F10-5: High epoch limits (e.g. 5000) pass validation cleanly', () => {
    const highEpochs = { learningRate: 0.05, errorValue: 0.001, epochs: 5000 };
    assert.deepStrictEqual(validateHyperparameters(highEpochs), []);
  });
});
