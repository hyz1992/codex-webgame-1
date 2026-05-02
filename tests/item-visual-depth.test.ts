import { describe, expect, it } from 'vitest';
import { LANE_WIDTH } from '../src/game/config';
import { gameAssetManifest } from '../src/game/assets/assetManifest';
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

  it('uses lane-bound raster assets for formerly thin hazards', () => {
    expect(MIN_OBSTACLE_VISUAL_HEIGHT).toBeGreaterThanOrEqual(52);
    expect(usesProgrammaticObstacleVisual('lowFence')).toBe(false);
    expect(usesProgrammaticObstacleVisual('beam')).toBe(false);
    expect(getObstacleVisualProfile('lowFence')?.height).toBeGreaterThanOrEqual(MIN_OBSTACLE_VISUAL_HEIGHT);
    expect(getObstacleVisualProfile('beam')?.height).toBeGreaterThanOrEqual(MIN_OBSTACLE_VISUAL_HEIGHT);
    expect(getObstacleVisualProfile('lowFence')?.width).toBeLessThanOrEqual(LANE_WIDTH);
    expect(getObstacleVisualProfile('beam')?.width).toBeLessThanOrEqual(LANE_WIDTH);
  });

  it('keeps generated obstacle PNG display boxes inside one lane', () => {
    const lowFence = gameAssetManifest.items.find((item) => item.laneItemKind === 'lowFence');
    const beam = gameAssetManifest.items.find((item) => item.laneItemKind === 'beam');

    expect(lowFence?.display.width).toBeLessThanOrEqual(LANE_WIDTH);
    expect(beam?.display.width).toBeLessThanOrEqual(LANE_WIDTH);
    expect(lowFence?.display.height).toBeGreaterThanOrEqual(MIN_OBSTACLE_VISUAL_HEIGHT);
    expect(beam?.display.height).toBeGreaterThanOrEqual(MIN_OBSTACLE_VISUAL_HEIGHT);
  });
});
