import { describe, expect, it } from 'vitest';
import { ITEM_GROUND_SHADOW_ALPHA, ITEM_VISUAL_SCALE } from '../src/game/visual/layout';
import {
  MIN_OBSTACLE_VISUAL_HEIGHT,
  getObstacleVisualProfile,
  usesProgrammaticObstacleVisual,
} from '../src/game/visual/obstacleVisualProfile';

describe('item visual depth', () => {
  it('keeps obstacles readable at near depth and grounded on the track', () => {
    expect(ITEM_VISUAL_SCALE).toBeGreaterThanOrEqual(1.18);
    expect(ITEM_GROUND_SHADOW_ALPHA).toBeGreaterThan(0);
    expect(ITEM_GROUND_SHADOW_ALPHA).toBeLessThan(0.4);
  });

  it('replaces thin hazards with taller programmatic silhouettes', () => {
    expect(MIN_OBSTACLE_VISUAL_HEIGHT).toBeGreaterThanOrEqual(52);
    expect(usesProgrammaticObstacleVisual('lowFence')).toBe(true);
    expect(usesProgrammaticObstacleVisual('beam')).toBe(true);
    expect(getObstacleVisualProfile('lowFence')?.height).toBeGreaterThanOrEqual(MIN_OBSTACLE_VISUAL_HEIGHT);
    expect(getObstacleVisualProfile('beam')?.height).toBeGreaterThanOrEqual(MIN_OBSTACLE_VISUAL_HEIGHT);
  });
});
