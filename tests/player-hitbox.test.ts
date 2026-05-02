import { describe, expect, it } from 'vitest';
import { neonSunsetTheme } from '../src/game/visual/theme';

describe('player hitbox', () => {
  it('使用独立碰撞盒，尺寸小于视觉主体和拖尾范围', () => {
    expect(neonSunsetTheme.player.hitbox.width).toBeLessThan(neonSunsetTheme.player.width);
    expect(neonSunsetTheme.player.hitbox.height).toBeLessThan(neonSunsetTheme.player.height + neonSunsetTheme.player.trailLength);
    expect(neonSunsetTheme.player.hitbox.height).toBeLessThanOrEqual(44);
  });
});
