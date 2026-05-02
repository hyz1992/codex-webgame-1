import { describe, expect, it } from 'vitest';
import { CITY_BACKGROUND_Y_OFFSET } from '../src/game/visual/AssetVisualFactory';
import { TRACK_HORIZON_MIST, trackFarFadeAlpha } from '../src/game/visual/GameVisualFactory';

describe('background layout', () => {
  it('moves only the city layer upward to meet the bridge horizon', () => {
    expect(CITY_BACKGROUND_Y_OFFSET).toBeLessThan(0);
    expect(CITY_BACKGROUND_Y_OFFSET).toBeGreaterThanOrEqual(-52);
  });

  it('softens the bridge vanishing point with fade and mist', () => {
    expect(trackFarFadeAlpha(0, 0.58)).toBe(0);
    expect(trackFarFadeAlpha(0.08, 0.58)).toBeLessThan(0.58);
    expect(trackFarFadeAlpha(0.2, 0.58)).toBe(0.58);
    expect(TRACK_HORIZON_MIST.height).toBeGreaterThanOrEqual(48);
  });
});
