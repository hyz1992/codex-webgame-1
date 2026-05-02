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
});
