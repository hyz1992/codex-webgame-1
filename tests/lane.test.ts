import { describe, expect, it } from 'vitest';
import { LaneController } from '../src/game/lane/LaneController';

describe('LaneController', () => {
  it('限制玩家只能在 3 条轨道内移动', () => {
    const lanes = new LaneController();

    lanes.applyAction('laneLeft');
    lanes.applyAction('laneLeft');
    expect(lanes.snapshot().lane).toBe(0);

    lanes.applyAction('laneRight');
    lanes.applyAction('laneRight');
    lanes.applyAction('laneRight');
    expect(lanes.snapshot().lane).toBe(2);
  });

  it('跳跃时允许换轨，滑铲时禁止换轨', () => {
    const lanes = new LaneController();

    lanes.applyAction('jump');
    lanes.applyAction('laneRight');
    expect(lanes.snapshot().lane).toBe(2);

    lanes.endActionState();
    lanes.applyAction('slide');
    lanes.applyAction('laneLeft');
    expect(lanes.snapshot().lane).toBe(2);
  });
});
