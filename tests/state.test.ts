import { describe, expect, it } from 'vitest';
import {
  addDistance,
  collectEnergy,
  createInitialRunState,
  damagePlayer,
  resetRun,
  startRun,
  tickBoost,
} from '../src/game/state';

describe('RunState', () => {
  it('用距离、能量球和连击倍率计算分数', () => {
    let state = startRun(createInitialRunState());
    state = addDistance(state, 12);
    state = collectEnergy(state);
    state = collectEnergy(state);

    expect(state.distance).toBe(12);
    expect(state.combo).toBe(2);
    expect(state.score).toBe(35);
    expect(state.boostMeter).toBe(40);
  });

  it('护盾吸收第一次普通伤害，第二次普通伤害结束本局', () => {
    let state = startRun(createInitialRunState());
    state = collectEnergy(state);
    state = damagePlayer(state, 'normal');

    expect(state.shields).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.isGameOver).toBe(false);

    state = damagePlayer(state, 'normal');
    expect(state.isGameOver).toBe(true);
  });

  it('危险伤害直接结束本局', () => {
    const state = damagePlayer(startRun(createInitialRunState()), 'fatal');
    expect(state.isGameOver).toBe(true);
  });

  it('疾跑槽满后触发 3 秒磁吸冲刺并在计时结束后关闭', () => {
    let state = startRun(createInitialRunState());
    for (let index = 0; index < 5; index += 1) {
      state = collectEnergy(state);
    }

    expect(state.boostMeter).toBe(0);
    expect(state.isBoosting).toBe(true);
    expect(state.boostMsRemaining).toBe(3000);

    state = tickBoost(state, 3000);
    expect(state.isBoosting).toBe(false);
    expect(state.boostMsRemaining).toBe(0);
  });

  it('重开时把结束状态恢复为未开始的新局', () => {
    let state = startRun(createInitialRunState());
    state = collectEnergy(state);
    state = damagePlayer(state, 'fatal');

    const resetState = resetRun(state);

    expect(resetState.hasStarted).toBe(false);
    expect(resetState.isGameOver).toBe(false);
    expect(resetState.score).toBe(0);
    expect(resetState.distance).toBe(0);
    expect(resetState.combo).toBe(0);
    expect(resetState.shields).toBe(1);
  });
});
