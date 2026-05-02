import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT } from '../src/game/config';
import { PerspectiveProjector } from '../src/game/visual/PerspectiveProjector';

describe('PerspectiveProjector', () => {
  it('远处轨道收束，近处轨道展开', () => {
    const projector = new PerspectiveProjector();
    const farLeft = projector.projectLane(0, 210);
    const farCenter = projector.projectLane(1, 210);
    const nearLeft = projector.projectLane(0, 720);
    const nearCenter = projector.projectLane(1, 720);

    expect(farCenter.x - farLeft.x).toBeLessThan(nearCenter.x - nearLeft.x);
    expect(farCenter.x).toBe(195);
    expect(nearCenter.x).toBe(195);
  });

  it('物件越接近玩家越大且层级越靠前', () => {
    const projector = new PerspectiveProjector();
    const far = projector.projectLane(1, 210);
    const near = projector.projectLane(1, 720);

    expect(far.scale).toBeLessThan(near.scale);
    expect(far.depth).toBeLessThan(near.depth);
    expect(near.scale).toBeGreaterThan(1.2);
  });

  it('跑道近端比远端更宽', () => {
    const projector = new PerspectiveProjector();
    const polygon = projector.trackPolygon();

    expect(polygon.bottomRight.x - polygon.bottomLeft.x).toBeGreaterThan(polygon.topRight.x - polygon.topLeft.x);
    expect(polygon.bottomRight.x - polygon.bottomLeft.x).toBeGreaterThan(620);
    expect(polygon.topLeft.y).toBeLessThan(polygon.bottomLeft.y);
  });

  it('跑道从天边开始并在近端宽出屏幕边缘', () => {
    const projector = new PerspectiveProjector();
    const polygon = projector.trackPolygon();

    expect(projector.horizonY).toBeGreaterThan(GAME_HEIGHT * 0.45);
    expect(projector.horizonY).toBeLessThan(GAME_HEIGHT * 0.54);
    expect(projector.spawnY).toBeLessThanOrEqual(projector.horizonY + 48);
    expect(polygon.bottomLeft.x).toBeLessThan(0);
    expect(polygon.bottomRight.x).toBeGreaterThan(390);
  });

  it('障碍从跑道远端生成，而不是从屏幕上方掉落', () => {
    const projector = new PerspectiveProjector();
    const spawn = projector.projectLane(1, projector.spawnY);

    expect(projector.spawnY).toBeGreaterThanOrEqual(projector.horizonY);
    expect(projector.spawnY).toBeLessThan(projector.horizonY + 80);
    expect(spawn.y).toBe(projector.spawnY);
    expect(spawn.scale).toBeLessThan(0.45);
  });

  it('track edges collapse exactly into the vanishing point at the horizon', () => {
    const projector = new PerspectiveProjector();
    const polygon = projector.trackPolygon();

    expect(polygon.topLeft.x).toBe(projector.centerX);
    expect(polygon.topRight.x).toBe(projector.centerX);
    expect(projector.trackEdgeX(-1.5, projector.horizonY)).toBe(projector.centerX);
    expect(projector.trackEdgeX(1.5, projector.horizonY)).toBe(projector.centerX);
  });

  it('side lane objects spawn near the track end and then diverge along fixed lanes', () => {
    const projector = new PerspectiveProjector();
    const left = projector.projectLane(0, projector.spawnY);
    const center = projector.projectLane(1, projector.spawnY);
    const right = projector.projectLane(2, projector.spawnY);
    const nearLeft = projector.projectLaneAtProgress(0, 0.6);
    const nearCenter = projector.projectLaneAtProgress(1, 0.6);

    expect(projector.spawnProgress).toBeLessThanOrEqual(0.08);
    expect(projector.spawnY).toBeLessThanOrEqual(projector.horizonY + 80);
    expect(center.x - left.x).toBeLessThan(16);
    expect(right.x - center.x).toBeLessThan(16);
    expect(nearCenter.x - nearLeft.x).toBeGreaterThan(center.x - left.x);
    expect(left.scale).toBeLessThan(0.55);
    expect(right.scale).toBeLessThan(0.55);
  });

  it('projects moving items from world progress instead of screen position', () => {
    const projector = new PerspectiveProjector();
    const spawn = projector.projectLaneAtProgress(0, projector.spawnProgress);
    const mid = projector.projectLaneAtProgress(0, 0.5);
    const near = projector.projectLaneAtProgress(0, 0.95);

    expect(spawn.y).toBeGreaterThan(projector.horizonY);
    expect(spawn.x).toBeLessThan(projector.centerX);
    expect(mid.x).toBeLessThan(spawn.x);
    expect(near.x).toBeLessThan(mid.x);
    expect(near.scale / spawn.scale).toBeGreaterThan(2.8);
  });

  it('uses the same projection for lane guide points and objects', () => {
    const projector = new PerspectiveProjector();
    const laneGuide = projector.trackLanePoints(-1, 8);

    for (const point of laneGuide) {
      const object = projector.projectLaneAtProgress(0, point.progress);
      expect(object.x).toBeCloseTo(point.x, 5);
      expect(object.y).toBeCloseTo(point.y, 5);
    }
  });

  it('derives perspective from a trigonometric camera focal length', () => {
    const projector = new PerspectiveProjector();
    const expectedFocalLength = projector.viewportHalfHeight / Math.tan(projector.verticalFovRadians / 2);

    expect(projector.focalLength).toBeCloseTo(expectedFocalLength, 5);
  });

  it('keeps object scale locked to the same depth ratio as lane spacing', () => {
    const projector = new PerspectiveProjector();
    const spawn = projector.projectLaneAtProgress(0, projector.spawnProgress);
    const near = projector.projectLaneAtProgress(0, 0.9);
    const spawnOffset = projector.centerX - spawn.x;
    const nearOffset = projector.centerX - near.x;

    expect(near.scale / spawn.scale).toBeCloseTo(nearOffset / spawnOffset, 4);
  });

  it('starts decelerating projected obstacle motion before the near end', () => {
    const projector = new PerspectiveProjector();
    const earlyRate = projector.movementRateAtProgress(0.15);
    const midRate = projector.movementRateAtProgress(0.5);
    const lateRate = projector.movementRateAtProgress(0.85);

    expect(earlyRate).toBeGreaterThan(midRate);
    expect(midRate).toBeGreaterThan(lateRate);
    expect(lateRate).toBeLessThan(earlyRate * 0.35);
  });
});
