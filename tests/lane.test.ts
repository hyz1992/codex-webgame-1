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

  it('移除跳跃和下滑后始终保持巡航状态并允许变道', () => {
    const lanes = new LaneController();

    lanes.applyAction('laneRight');
    lanes.applyAction('laneLeft');

    expect(lanes.snapshot()).toEqual({ lane: 1, motion: 'cruising' });
  });
});
