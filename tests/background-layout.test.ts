import { describe, expect, it } from 'vitest';
import { CITY_BACKGROUND_Y_OFFSET } from '../src/game/visual/AssetVisualFactory';

describe('background layout', () => {
  it('moves only the city layer upward to meet the bridge horizon', () => {
    expect(CITY_BACKGROUND_Y_OFFSET).toBeLessThan(0);
    expect(CITY_BACKGROUND_Y_OFFSET).toBeGreaterThanOrEqual(-52);
  });
});
