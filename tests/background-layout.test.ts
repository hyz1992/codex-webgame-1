import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  BASE_CITY_BACKGROUND_Y_OFFSET,
  BASE_SUNSET_BACKGROUND_Y_OFFSET,
  BASE_TRACK_HORIZON_Y,
  CITY_BACKGROUND_Y_OFFSET,
  SCENE_ALIGNMENT_Y_OFFSET,
  SUNSET_BACKGROUND_Y_OFFSET,
  TRACK_HORIZON_Y,
} from '../src/game/visual/layout';
import { TRACK_HORIZON_MIST, trackFarFadeAlpha } from '../src/game/visual/GameVisualFactory';

describe('background layout', () => {
  it('keeps the city layer above its original base position', () => {
    expect(CITY_BACKGROUND_Y_OFFSET).toBeLessThan(0);
  });

  it('aligns the track end, city base, and sunset with one shared vertical offset', () => {
    expect(SCENE_ALIGNMENT_Y_OFFSET).toBeLessThan(0);
    expect(TRACK_HORIZON_Y).toBe(BASE_TRACK_HORIZON_Y + SCENE_ALIGNMENT_Y_OFFSET);
    expect(CITY_BACKGROUND_Y_OFFSET).toBe(BASE_CITY_BACKGROUND_Y_OFFSET + SCENE_ALIGNMENT_Y_OFFSET);
    expect(SUNSET_BACKGROUND_Y_OFFSET).toBe(BASE_SUNSET_BACKGROUND_Y_OFFSET + SCENE_ALIGNMENT_Y_OFFSET);
  });

  it('uses the shared layout constants when rendering the asset background', () => {
    const factorySource = readFileSync('src/game/visual/AssetVisualFactory.ts', 'utf8');

    expect(factorySource).not.toMatch(/export const CITY_BACKGROUND_Y_OFFSET/);
    expect(factorySource).toContain('CITY_BACKGROUND_Y_OFFSET');
    expect(factorySource).toContain('SUNSET_BACKGROUND_Y_OFFSET');
  });

  it('softens the bridge vanishing point with fade and mist', () => {
    expect(trackFarFadeAlpha(0, 0.58)).toBe(0);
    expect(trackFarFadeAlpha(0.08, 0.58)).toBeLessThan(0.58);
    expect(trackFarFadeAlpha(0.2, 0.58)).toBe(0.58);
    expect(TRACK_HORIZON_MIST.height).toBeGreaterThanOrEqual(48);
  });

  it('renders the opened track horizon as a trapezoid without duplicate outer edge strokes', () => {
    const factorySource = readFileSync('src/game/visual/GameVisualFactory.ts', 'utf8');

    expect(factorySource).toContain(
      'graphics.fillPoints([polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft], true)',
    );
    expect(factorySource).not.toContain('graphics.lineBetween(polygon.topLeft.x');
    expect(factorySource).not.toContain('graphics.lineBetween(polygon.topRight.x');
  });
});
