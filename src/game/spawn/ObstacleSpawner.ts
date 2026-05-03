import type { LaneItem, ObstacleKind, SpawnPattern } from './patterns';

// 障碍生成间隔下限，防止后期密度过高。
const MIN_SPAWN_INTERVAL_MS = 520;
// 初始障碍生成间隔，开局会更舒缓。
const INITIAL_SPAWN_INTERVAL_MS = 950;
// 随时间缩短生成间隔的速度，单位是毫秒/秒。
const SPAWN_INTERVAL_ACCELERATION = 3.2;
// 开局单车道生成障碍的基础概率。
const BASE_HAZARD_CHANCE = 0.45;
// 单车道生成障碍的概率上限，至少保留一定喘息空间。
const MAX_HAZARD_CHANCE = 0.92;
// 护盾拾取物在安全车道额外出现的概率。
const SHIELD_PICKUP_CHANCE = 0.08;
// 加速拾取物在安全车道额外出现的概率。
const BOOST_PICKUP_CHANCE = 0.06;

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
    return Math.max(MIN_SPAWN_INTERVAL_MS, INITIAL_SPAWN_INTERVAL_MS - Math.floor(secondsElapsed * SPAWN_INTERVAL_ACCELERATION));
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

    if (this.random() < SHIELD_PICKUP_CHANCE) {
      pickups.push({
        kind: 'shield',
        lane: safeLane,
      });
    }

    if (this.random() < BOOST_PICKUP_CHANCE) {
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
    return Math.min(MAX_HAZARD_CHANCE, BASE_HAZARD_CHANCE + secondsElapsed / 260);
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
