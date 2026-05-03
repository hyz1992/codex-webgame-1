import { describe, expect, it } from 'vitest';
import { playerRunPose } from '../src/game/visual/playerRunPose';

describe('playerRunPose', () => {
  it('adds a subtle hover bob while the run is active', () => {
    const first = playerRunPose(0, true, false);
    const later = playerRunPose(120, true, false);

    expect(first.yOffset).not.toBe(later.yOffset);
    expect(Math.abs(later.yOffset)).toBeLessThanOrEqual(4);
  });

  it('keeps the vehicle visually anchored when the run is inactive', () => {
    expect(playerRunPose(120, false, false).yOffset).toBe(0);
  });

  it('uses a stronger hover pulse while boosting', () => {
    const cruising = playerRunPose(120, true, false);
    const boosting = playerRunPose(120, true, true);

    expect(Math.abs(boosting.yOffset)).toBeGreaterThan(Math.abs(cruising.yOffset));
  });
});
