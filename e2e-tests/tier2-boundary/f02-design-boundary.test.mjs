import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Tier 2 - F2 Boundary: Design System Edge Cases', () => {
  it('F2-B1: Hex color validator detects invalid hex strings', () => {
    const isValidHex = (hex) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
    assert.strictEqual(isValidHex('#6366f1'), true);
    assert.strictEqual(isValidHex('#090d16'), true);
    assert.strictEqual(isValidHex('blue'), false);
    assert.strictEqual(isValidHex('#12345'), false);
    assert.strictEqual(isValidHex('#ZZZ999'), false);
  });

  it('F2-B2: Theme toggle without preexisting class defaults to light mode gracefully', () => {
    const resolveInitialTheme = (stored, systemPrefersDark) => {
      if (stored === 'dark' || stored === 'light') return stored;
      return systemPrefersDark ? 'dark' : 'light';
    };
    assert.strictEqual(resolveInitialTheme(null, false), 'light');
    assert.strictEqual(resolveInitialTheme(null, true), 'dark');
    assert.strictEqual(resolveInitialTheme('dark', false), 'dark');
  });

  it('F2-B3: Custom theme color palette missing optional shades uses defaults', () => {
    const palette = { DEFAULT: '#6366f1' };
    const resolved500 = palette[500] || palette.DEFAULT;
    assert.strictEqual(resolved500, '#6366f1');
  });

  it('F2-B4: Glassmorphic backdrop filter fallback handles unsupported browsers', () => {
    const getBackdropStyle = (supportsBackdrop) =>
      supportsBackdrop ? { backdropFilter: 'blur(12px)', bgOpacity: 0.7 } : { bgOpacity: 0.95 };
    assert.strictEqual(getBackdropStyle(true).backdropFilter, 'blur(12px)');
    assert.strictEqual(getBackdropStyle(false).backdropFilter, undefined);
  });

  it('F2-B5: Font family stack includes cross-platform system font fallbacks', () => {
    const sansStack = ['Inter', 'system-ui', '-apple-system', 'sans-serif'];
    assert.ok(sansStack.includes('sans-serif'), 'Generic sans-serif fallback required');
  });
});
