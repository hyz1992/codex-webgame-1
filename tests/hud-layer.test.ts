import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('HUD layer', () => {
  it('keeps the HUD above the Phaser canvas so pause controls receive clicks', () => {
    const css = readFileSync('src/styles.css', 'utf8');

    expect(css).toMatch(/#game-root\s*{[^}]*z-index:\s*0;/s);
    expect(css).toMatch(/#hud-root\s*{[^}]*z-index:\s*10;/s);
  });
});
