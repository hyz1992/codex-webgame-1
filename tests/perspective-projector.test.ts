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
});
