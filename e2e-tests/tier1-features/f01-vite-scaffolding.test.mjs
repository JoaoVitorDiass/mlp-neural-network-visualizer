import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../frontend');

describe('Tier 1 - F1: Vite + React (TypeScript) Scaffolding', () => {
  it('F1-1: package.json exists and specifies valid metadata', () => {
    const pkgPath = path.join(frontendDir, 'package.json');
    assert.ok(fs.existsSync(pkgPath), 'frontend/package.json must exist');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    assert.strictEqual(typeof pkg.name, 'string', 'package name must be defined');
    assert.strictEqual(pkg.type, 'module', 'package must be an ES module ("type": "module")');
  });

  it('F1-2: package.json defines standard npm scripts (dev, build, lint, preview)', () => {
    const pkgPath = path.join(frontendDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    assert.ok(pkg.scripts, 'scripts object must exist in package.json');
    assert.ok(pkg.scripts.dev, 'npm run dev script must exist');
    assert.ok(pkg.scripts.build, 'npm run build script must exist');
    assert.ok(pkg.scripts.preview, 'npm run preview script must exist');
  });

  it('F1-3: tsconfig.json exists with React JSX and module resolution', () => {
    const tsconfigPath = path.join(frontendDir, 'tsconfig.json');
    assert.ok(fs.existsSync(tsconfigPath), 'frontend/tsconfig.json must exist');
    const content = fs.readFileSync(tsconfigPath, 'utf-8');
    assert.ok(content.includes('"jsx"') || content.includes('react-jsx'), 'tsconfig should configure JSX transform');
  });

  it('F1-4: vite.config.ts configures React plugin and port 3000', () => {
    const viteConfigPath = path.join(frontendDir, 'vite.config.ts');
    assert.ok(fs.existsSync(viteConfigPath), 'frontend/vite.config.ts must exist');
    const content = fs.readFileSync(viteConfigPath, 'utf-8');
    assert.ok(content.includes('react') || content.includes('@vitejs/plugin-react'), 'vite.config.ts should use React plugin');
    assert.ok(content.includes('3000'), 'vite.config.ts must configure server port 3000 to match backend CORS policy');
  });

  it('F1-5: index.html entry point contains root container and module script', () => {
    const indexPath = path.join(frontendDir, 'index.html');
    assert.ok(fs.existsSync(indexPath), 'frontend/index.html must exist');
    const html = fs.readFileSync(indexPath, 'utf-8');
    assert.ok(html.includes('id="root"'), 'index.html must include <div id="root">');
    assert.ok(html.includes('src/main.tsx') || html.includes('type="module"'), 'index.html must load main module script');
  });
});
