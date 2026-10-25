/**
 * Lightweight in-process mock server for REST and SignalR emulation.
 * Used for deterministic E2E client/protocol verification.
 */
import http from 'node:http';

export function createMockBackendServer(port = 0) {
  const state = {
    healthStatus: 'Online',
    healthMessage: 'MLP Visualizer API está em execução.',
    simulateFailure: false,
    failureStatusCode: 500,
    recordedRequests: [],
  };

  const server = http.createServer((req, res) => {
    // CORS headers matching Program.cs
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/api/mlp/health' && req.method === 'GET') {
      if (state.simulateFailure) {
        res.writeHead(state.failureStatusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal Server Error' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: state.healthStatus,
          message: state.healthMessage,
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    if (req.url === '/api/mlp/runPerceptron' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          state.recordedRequests.push(payload);

          if (state.simulateFailure) {
            res.writeHead(state.failureStatusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Erro interno no treinamento simulado' }));
            return;
          }

          // Validate payload contract
          if (!payload.parameters || !payload.data) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Parâmetros ou dados ausentes' }));
            return;
          }

          const { parameters } = payload;
          if (parameters.inputLayer < 1 || parameters.outputLayer < 1 || parameters.epochs < 1) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Camadas e épocas devem ser >= 1' }));
            return;
          }

          const K = parameters.outputLayer;
          // Generate realistic mock confusion matrix
          const confusionMatrix = Array.from({ length: K }, (_, r) =>
            Array.from({ length: K }, (_, c) => (r === c ? 15 : 0))
          );

          const responseData = {
            message: 'OK',
            data: {
              arrAvaregeError: [
                { epoch: 1, avarageError: 0.45 },
                { epoch: Math.floor(parameters.epochs / 2), avarageError: 0.08 },
                { epoch: parameters.epochs, avarageError: 0.009 },
              ],
              confusionMatrix,
              accuracyPercentage: 100.0,
              totalEpochs: parameters.epochs,
              finalError: 0.009,
              converged: true,
            },
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(responseData));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Malformed JSON' }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not Found' }));
  });

  return {
    server,
    state,
    start: () =>
      new Promise((resolve) => {
        server.listen(port, () => {
          const actualPort = server.address().port;
          resolve(`http://127.0.0.1:${actualPort}`);
        });
      }),
    stop: () =>
      new Promise((resolve) => {
        server.close(resolve);
      }),
  };
}
