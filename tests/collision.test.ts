import { describe, expect, it } from 'vitest';
import { resolveCollision, resolvePlayerCollision } from '../src/game/collision/CollisionSystem';
import { createInitialRunState, startRun } from '../src/game/state';

describe('CollisionSystem', () => {
  it('收集能量球增加分数和连击', () => {
    const state = resolveCollision(startRun(createInitialRunState()), { kind: 'energy', lane: 1 });

    expect(state.combo).toBe(1);
    expect(state.score).toBe(11);
  });

  it('收集护盾会增加一层护盾', () => {
    const state = resolveCollision(startRun(createInitialRunState()), { kind: 'shield', lane: 1 });

    expect(state.shields).toBe(2);
  });

  it('危险区直接结束本局', () => {
    const state = resolveCollision(startRun(createInitialRunState()), { kind: 'hazard', lane: 1 });

    expect(state.isGameOver).toBe(true);
  });

  it('低栏和横梁在去掉跳跃下滑后都是普通车道障碍', () => {
    const running = startRun({ ...createInitialRunState(), shields: 0 });

    expect(resolvePlayerCollision(running, { kind: 'lowFence', lane: 1 }, 'cruising').isGameOver).toBe(true);
    expect(resolvePlayerCollision(running, { kind: 'beam', lane: 1 }, 'cruising').isGameOver).toBe(true);
  });
});
