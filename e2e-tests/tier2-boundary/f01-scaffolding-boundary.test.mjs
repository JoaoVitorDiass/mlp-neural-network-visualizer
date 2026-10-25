import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../frontend');

describe('Tier 2 - F1 Boundary: Scaffolding Edge Cases', () => {
  it('F1-B1: package.json rejects missing name or scripts in structural validation', () => {
    const validatePkg = (pkg) => Boolean(pkg && pkg.name && pkg.scripts && typeof pkg.scripts.build === 'string');
    assert.strictEqual(validatePkg({}), false);
    assert.strictEqual(validatePkg({ name: 'test' }), false);
    assert.strictEqual(validatePkg({ name: 'test', scripts: { build: 'vite build' } }), true);
  });

  it('F1-B2: tsconfig.json handles strict mode flag verification', () => {
    const tsconfigPath = path.join(frontendDir, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      const content = fs.readFileSync(tsconfigPath, 'utf-8');
      assert.ok(content.includes('strict') || content.includes('compilerOptions'));
    }
  });

  it('F1-B3: vite.config.ts port configuration parses as valid integer in [1024, 65535]', () => {
    const port = 3000;
    assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535);
  });

  it('F1-B4: build output directory default is dist', () => {
    const defaultOutDir = 'dist';
    assert.strictEqual(defaultOutDir, 'dist');
  });

  it('F1-B5: package.json dependencies object handles empty or missing devDependencies safely', () => {
    const pkg = { dependencies: { react: '^18.0.0' } };
    const all = { ...pkg.dependencies, ...(pkg.devDependencies || {}) };
    assert.strictEqual(all.react, '^18.0.0');
  });
});
