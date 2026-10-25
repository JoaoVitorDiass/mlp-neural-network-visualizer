import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../frontend');

describe('Tier 1 - F2: Tailwind CSS & HeroUI Design System', () => {
  it('F2-1: tailwind.config.js exists and configures HeroUI plugin', () => {
    const tailwindPath = path.join(frontendDir, 'tailwind.config.js');
    assert.ok(fs.existsSync(tailwindPath), 'tailwind.config.js must exist');
    const content = fs.readFileSync(tailwindPath, 'utf-8');
    assert.ok(content.includes('heroui') || content.includes('@heroui/react') || content.includes('@heroui/theme'),
      'tailwind.config.js must register heroui plugin');
  });

  it('F2-2: tailwind content glob includes HeroUI theme package files', () => {
    const tailwindPath = path.join(frontendDir, 'tailwind.config.js');
    const content = fs.readFileSync(tailwindPath, 'utf-8');
    assert.ok(content.includes('@heroui/theme'), 'content globs must include @heroui/theme path for styles');
  });

  it('F2-3: dark mode strategy is configured as class', () => {
    const tailwindPath = path.join(frontendDir, 'tailwind.config.js');
    const content = fs.readFileSync(tailwindPath, 'utf-8');
    assert.ok(content.includes("darkMode: 'class'") || content.includes('darkMode: "class"') || content.includes('darkMode'),
      'darkMode must be configured with class strategy');
  });

  it('F2-4: index.css contains Tailwind directives', () => {
    const cssPath = path.join(frontendDir, 'src/index.css');
    assert.ok(fs.existsSync(cssPath), 'src/index.css must exist');
    const content = fs.readFileSync(cssPath, 'utf-8');
    assert.ok(content.includes('@tailwind base') || content.includes('@tailwind'),
      'src/index.css must contain @tailwind directives');
  });

  it('F2-5: HeroUI dependencies are declared in package.json', () => {
    const pkgPath = path.join(frontendDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    assert.ok(allDeps['@heroui/react'] || allDeps['@heroui/theme'] || allDeps['tailwindcss'],
      'HeroUI and Tailwind dependencies must be declared in package.json');
  });
});
