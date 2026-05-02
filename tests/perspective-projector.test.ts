import { describe, expect, it } from 'vitest';
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
    expect(near.scale).toBeGreaterThan(0.9);
  });

  it('跑道近端比远端更宽', () => {
    const projector = new PerspectiveProjector();
    const polygon = projector.trackPolygon();

    expect(polygon.bottomRight.x - polygon.bottomLeft.x).toBeGreaterThan(polygon.topRight.x - polygon.topLeft.x);
    expect(polygon.topLeft.y).toBeLessThan(polygon.bottomLeft.y);
  });

  it('跑道从天边开始并在近端宽出屏幕边缘', () => {
    const projector = new PerspectiveProjector();
    const polygon = projector.trackPolygon();

    expect(projector.horizonY).toBeLessThanOrEqual(120);
    expect(polygon.bottomLeft.x).toBeLessThan(0);
    expect(polygon.bottomRight.x).toBeGreaterThan(390);
  });

  it('障碍从跑道远端生成，而不是从屏幕上方掉落', () => {
    const projector = new PerspectiveProjector();
    const spawn = projector.projectLane(1, projector.spawnY);

    expect(projector.spawnY).toBeGreaterThanOrEqual(projector.horizonY);
    expect(projector.spawnY).toBeLessThan(160);
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

  it('side lane objects spawn visibly on their own perspective lanes', () => {
    const projector = new PerspectiveProjector();
    const left = projector.projectLane(0, projector.spawnY);
    const center = projector.projectLane(1, projector.spawnY);
    const right = projector.projectLane(2, projector.spawnY);

    expect(center.x - left.x).toBeGreaterThan(24);
    expect(right.x - center.x).toBeGreaterThan(24);
    expect(left.scale).toBeLessThan(0.55);
    expect(right.scale).toBeLessThan(0.55);
  });
});
