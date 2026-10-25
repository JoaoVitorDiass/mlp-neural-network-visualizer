/**
 * Activation Function Oracle: Authoritative mathematical reference for activation functions and derivatives.
 * Matches backend Mlp.Domain/Activation/ActivationFunctionFactory.cs
 */

export function resolveActivation(name) {
  const normalized = (name || '').trim().toLowerCase();
  if (normalized === 'hiperbólica' || normalized === 'hiperbolica' || normalized === 'tanh') {
    return 'Hiperbolica';
  }
  if (normalized === 'linear') {
    return 'Linear';
  }
  // Default is Sigmoid / Logistica
  return 'Logistica';
}

export const ACTIVATION_MATH = {
  Logistica: {
    activate: (net) => 1.0 / (1.0 + Math.exp(-net)),
    derivative: (output) => output * (1.0 - output),
    weightRange: [0.0, 1.0],
  },
  Hiperbolica: {
    activate: (net) => Math.tanh(net),
    derivative: (output) => 1.0 - output * output,
    weightRange: [-1.0, 1.0],
  },
  Linear: {
    activate: (net) => net / 10.0,
    derivative: (_output) => 1.0 / 10.0,
    weightRange: [0.0, 1.0],
  },
};
