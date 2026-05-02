import { describe, expect, it } from 'vitest';
import { playerRunPose } from '../src/game/visual/playerRunPose';

describe('playerRunPose', () => {
  it('adds a subtle running bob while the run is active', () => {
    const first = playerRunPose(0, true, false);
    const later = playerRunPose(120, true, false);

    expect(first.yOffset).not.toBe(later.yOffset);
    expect(Math.abs(later.yOffset)).toBeLessThanOrEqual(5);
  });

  it('keeps the player visually anchored when the run is inactive', () => {
    expect(playerRunPose(120, false, false).yOffset).toBe(0);
  });

  it('uses an upward arc for jumps instead of only squashing the sprite', () => {
    const start = playerRunPose(0, true, false, 'jumping', 0);
    const airborne = playerRunPose(160, true, false, 'jumping', 160);
    const landing = playerRunPose(320, true, false, 'jumping', 320);

    expect(start.yOffset).toBe(0);
    expect(airborne.yOffset).toBeLessThan(-36);
    expect(landing.yOffset).toBeCloseTo(0, 5);
  });
});
