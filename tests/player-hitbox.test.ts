import { describe, expect, it } from 'vitest';
import { neonSunsetTheme } from '../src/game/visual/theme';

describe('player hitbox', () => {
  it('uses a compact hitbox inside the lightcycle silhouette', () => {
    expect(neonSunsetTheme.player.height).toBeGreaterThan(neonSunsetTheme.player.width);
    expect(neonSunsetTheme.player.hitbox.width).toBeLessThan(neonSunsetTheme.player.width);
    expect(neonSunsetTheme.player.hitbox.height).toBeLessThan(neonSunsetTheme.player.height + neonSunsetTheme.player.trailLength);
    expect(neonSunsetTheme.player.hitbox.height).toBeLessThanOrEqual(44);
  });
});
