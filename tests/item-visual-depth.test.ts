import { describe, expect, it } from 'vitest';
import { ITEM_GROUND_SHADOW_ALPHA, ITEM_VISUAL_SCALE } from '../src/game/visual/layout';

describe('item visual depth', () => {
  it('keeps obstacles readable at near depth and grounded on the track', () => {
    expect(ITEM_VISUAL_SCALE).toBeGreaterThanOrEqual(1.18);
    expect(ITEM_GROUND_SHADOW_ALPHA).toBeGreaterThan(0);
    expect(ITEM_GROUND_SHADOW_ALPHA).toBeLessThan(0.4);
  });
});
