import { describe, expect, it } from 'vitest';
import { getLaneItemVisual, neonSunsetTheme } from '../src/game/visual/theme';
import type { LaneItem } from '../src/game/spawn/patterns';

describe('neonSunsetTheme', () => {
  it('为所有障碍和道具提供可区分的视觉配置', () => {
    const kinds: LaneItem['kind'][] = ['barrier', 'lowFence', 'beam', 'hazard', 'energy', 'shield', 'boost'];

    for (const kind of kinds) {
      const visual = getLaneItemVisual(kind);
      expect(visual.fill).toMatch(/^0x[0-9a-f]{6}$/i);
      expect(visual.glow).toMatch(/^0x[0-9a-f]{6}$/i);
      expect(visual.shape.length).toBeGreaterThan(0);
    }

    expect(getLaneItemVisual('hazard').shape).toBe('rift');
    expect(getLaneItemVisual('beam').shape).toBe('beam');
    expect(getLaneItemVisual('energy').shape).toBe('orb');
  });

  it('定义移动端跑道和动画所需的核心尺寸', () => {
    expect(neonSunsetTheme.track.width).toBe(290);
    expect(neonSunsetTheme.track.laneGlowWidth).toBeGreaterThan(1);
    expect(neonSunsetTheme.motion.laneTweenMs).toBeLessThanOrEqual(160);
    expect(neonSunsetTheme.motion.impactShakeMs).toBeLessThanOrEqual(180);
  });
});
