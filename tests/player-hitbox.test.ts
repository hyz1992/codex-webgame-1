import { describe, expect, it } from 'vitest';
import { neonSunsetTheme } from '../src/game/visual/theme';

describe('player hitbox', () => {
  it('uses a wider and lower hitbox suited to a hover bike silhouette', () => {
    expect(neonSunsetTheme.player.width).toBeGreaterThan(neonSunsetTheme.player.height);
    expect(neonSunsetTheme.player.hitbox.width).toBeLessThan(neonSunsetTheme.player.width);
    expect(neonSunsetTheme.player.hitbox.height).toBeLessThan(neonSunsetTheme.player.height + neonSunsetTheme.player.trailLength);
    expect(neonSunsetTheme.player.hitbox.height).toBeLessThanOrEqual(36);
  });
});
