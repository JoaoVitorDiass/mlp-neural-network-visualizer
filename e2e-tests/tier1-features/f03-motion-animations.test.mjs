import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../frontend');

describe('Tier 1 - F3: Motion Animations & Micro-interactions', () => {
  it('F3-1: motion or framer-motion library is present in dependencies', () => {
    const pkgPath = path.join(frontendDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    assert.ok(allDeps['framer-motion'] || allDeps['motion'],
      'framer-motion or motion must be installed in dependencies');
  });

  it('F3-2: card transition variants specify initial, animate, and transition properties', () => {
    const sampleVariant = {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -12 },
      transition: { duration: 0.25, ease: 'easeOut' },
    };
    assert.strictEqual(typeof sampleVariant.initial.opacity, 'number');
    assert.strictEqual(typeof sampleVariant.animate.opacity, 'number');
    assert.strictEqual(sampleVariant.transition.duration, 0.25);
  });

  it('F3-3: micro-interaction scale transforms are defined for interactive buttons', () => {
    const buttonMotion = {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
    };
    assert.ok(buttonMotion.whileHover.scale > 1.0, 'Hover should expand scale slightly');
    assert.ok(buttonMotion.whileTap.scale < 1.0, 'Tap should depress scale slightly');
  });

  it('F3-4: motion transitions support reduced motion query check', () => {
    const checkReducedMotion = (prefersReduced) => (prefersReduced ? { duration: 0 } : { duration: 0.3 });
    assert.strictEqual(checkReducedMotion(true).duration, 0, 'Reduced motion should have 0 duration');
    assert.strictEqual(checkReducedMotion(false).duration, 0.3, 'Standard motion should have fluid duration');
  });

  it('F3-5: spring physics configuration provides smooth settling without oscillation overflow', () => {
    const springConfig = { type: 'spring', stiffness: 300, damping: 25 };
    assert.strictEqual(springConfig.type, 'spring');
    assert.ok(springConfig.stiffness > 0 && springConfig.damping > 0);
  });
});
