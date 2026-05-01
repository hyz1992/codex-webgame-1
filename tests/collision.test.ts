import { describe, expect, it } from 'vitest';
import { createInitialRunState, startRun } from '../src/game/state';
import { resolveCollision } from '../src/game/collision/CollisionSystem';

describe('CollisionSystem', () => {
  it('收集能量球增加分数和连击', () => {
    const state = resolveCollision(startRun(createInitialRunState()), { kind: 'energy', lane: 1 });

    expect(state.combo).toBe(1);
    expect(state.score).toBe(11);
  });

  it('收集护盾最多保持 1 层护盾', () => {
    const state = resolveCollision(startRun(createInitialRunState()), { kind: 'shield', lane: 1 });
    expect(state.shields).toBe(1);
  });

  it('危险区直接结束本局', () => {
    const state = resolveCollision(startRun(createInitialRunState()), { kind: 'hazard', lane: 1 });
    expect(state.isGameOver).toBe(true);
  });
});
