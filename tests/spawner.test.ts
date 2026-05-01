import { describe, expect, it } from 'vitest';
import { ObstacleSpawner } from '../src/game/spawn/ObstacleSpawner';

describe('ObstacleSpawner', () => {
  it('每个生成窗口至少留出一条可通过轨道', () => {
    const spawner = new ObstacleSpawner(7);

    for (let index = 0; index < 40; index += 1) {
      const pattern = spawner.nextPattern(index * 10);
      expect(pattern.safeLanes.length).toBeGreaterThanOrEqual(1);
      expect(pattern.hazards.length).toBeLessThan(3);
    }
  });

  it('时间越久生成间距越短但不低于下限', () => {
    const spawner = new ObstacleSpawner(11);

    expect(spawner.getSpawnIntervalMs(0)).toBe(950);
    expect(spawner.getSpawnIntervalMs(180)).toBe(520);
  });
});
