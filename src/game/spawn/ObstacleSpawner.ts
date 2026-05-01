import type { LaneItem, ObstacleKind, SpawnPattern } from './patterns';

function createRandom(seed: number): () => number {
  let value = seed;

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export class ObstacleSpawner {
  private readonly random: () => number;

  constructor(seed = Date.now()) {
    this.random = createRandom(seed);
  }

  getSpawnIntervalMs(secondsElapsed: number): number {
    return Math.max(520, 950 - Math.floor(secondsElapsed * 3.2));
  }

  nextPattern(secondsElapsed: number): SpawnPattern {
    const safeLane = Math.floor(this.random() * 3);
    const hazards: LaneItem[] = [];
    const pickups: LaneItem[] = [];

    for (let lane = 0; lane < 3; lane += 1) {
      if (lane === safeLane) {
        pickups.push({
          kind: 'energy',
          lane,
        });
        continue;
      }

      if (this.random() < this.hazardChance(secondsElapsed)) {
        hazards.push({
          kind: this.pickHazard(secondsElapsed),
          lane,
        });
      }
    }

    if (this.random() < 0.08) {
      pickups.push({
        kind: 'shield',
        lane: safeLane,
      });
    }

    if (this.random() < 0.06) {
      pickups.push({
        kind: 'boost',
        lane: safeLane,
      });
    }

    return {
      hazards,
      pickups,
      safeLanes: [safeLane],
    };
  }

  private hazardChance(secondsElapsed: number): number {
    return Math.min(0.92, 0.45 + secondsElapsed / 260);
  }

  private pickHazard(secondsElapsed: number): ObstacleKind {
    const roll = this.random();

    if (secondsElapsed > 90 && roll > 0.88) {
      return 'hazard';
    }

    if (roll > 0.66) {
      return 'beam';
    }

    if (roll > 0.33) {
      return 'lowFence';
    }

    return 'barrier';
  }
}
