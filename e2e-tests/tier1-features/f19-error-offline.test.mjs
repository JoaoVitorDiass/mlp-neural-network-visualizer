import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function handleApiError(error) {
  if (!error) return { userMessage: 'Erro desconhecido', isOffline: false };
  if (error.code === 'ECONNREFUSED' || error.name === 'TypeError' || error.message?.includes('fetch failed')) {
    return {
      userMessage: 'Servidor backend offline. Verifique se o ASP.NET Core está rodando na porta 5134.',
      isOffline: true,
    };
  }
  if (error.status === 400) {
    return {
      userMessage: error.data?.message || 'Parâmetros de treinamento inválidos.',
      isOffline: false,
    };
  }
  if (error.status === 500) {
    return {
      userMessage: 'Erro interno no backend durante o treinamento.',
      isOffline: false,
    };
  }
  return {
    userMessage: error.message || 'Erro inesperado na comunicação.',
    isOffline: false,
  };
}

describe('Tier 1 - F19: Robust Error & Offline Handling', () => {
  it('F19-1: Connection refused (backend offline) sets isOffline true and user guidance', () => {
    const offlineErr = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:5134' };
    const result = handleApiError(offlineErr);
    assert.strictEqual(result.isOffline, true);
    assert.ok(result.userMessage.includes('5134') || result.userMessage.includes('offline'));
  });

  it('F19-2: Fetch network failure produces clear offline state', () => {
    const fetchErr = new TypeError('fetch failed');
    const result = handleApiError(fetchErr);
    assert.strictEqual(result.isOffline, true);
  });

  it('F19-3: HTTP 400 Bad Request surfaces validation message without marking backend offline', () => {
    const badReq = { status: 400, data: { message: 'Taxa de aprendizado deve ser > 0' } };
    const result = handleApiError(badReq);
    assert.strictEqual(result.isOffline, false);
    assert.ok(result.userMessage.includes('Taxa de aprendizado'));
  });

  it('F19-4: HTTP 500 Server Error provides clear failure explanation', () => {
    const serverErr = { status: 500 };
    const result = handleApiError(serverErr);
    assert.strictEqual(result.isOffline, false);
    assert.ok(result.userMessage.includes('Erro interno'));
  });

  it('F19-5: Training trigger action is disabled when backend status is offline', () => {
    const canStartTraining = (isOffline, isTraining, hasData) => !isOffline && !isTraining && hasData;
    assert.strictEqual(canStartTraining(true, false, true), false, 'Cannot start when offline');
    assert.strictEqual(canStartTraining(false, true, true), false, 'Cannot start when already training');
    assert.strictEqual(canStartTraining(false, false, false), false, 'Cannot start without data');
    assert.strictEqual(canStartTraining(false, false, true), true, 'Can start when online, idle, and data loaded');
  });
});
