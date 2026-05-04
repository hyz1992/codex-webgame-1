import { describe, expect, it } from 'vitest';
import {
  PLAYER_HEADING_MAX_DEGREES,
  calculatePlayerPerspectiveHeading,
} from '../src/game/visual/playerPerspectiveHeading';

describe('calculatePlayerPerspectiveHeading', () => {
  it('keeps the player upright in the center lane', () => {
    expect(
      calculatePlayerPerspectiveHeading({
        playerX: 195,
        playerY: 760,
        vanishX: 195,
        vanishY: 360,
      }),
    ).toBeCloseTo(0, 5);
  });

  it('points side-lane players toward the road vanishing point', () => {
    const leftLaneHeading = calculatePlayerPerspectiveHeading({
      playerX: 42,
      playerY: 760,
      vanishX: 195,
      vanishY: 360,
    });
    const rightLaneHeading = calculatePlayerPerspectiveHeading({
      playerX: 348,
      playerY: 760,
      vanishX: 195,
      vanishY: 360,
    });

    expect(leftLaneHeading).toBeGreaterThan(0);
    expect(rightLaneHeading).toBeLessThan(0);
    expect(Math.abs(leftLaneHeading)).toBeCloseTo(Math.abs(rightLaneHeading), 5);
  });

  it('clamps extreme offsets so the sprite never over-rotates', () => {
    const heading = calculatePlayerPerspectiveHeading({
      playerX: -300,
      playerY: 760,
      vanishX: 195,
      vanishY: 360,
    });

    expect(heading).toBeCloseTo((PLAYER_HEADING_MAX_DEGREES * Math.PI) / 180, 5);
  });
});
