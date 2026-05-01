import { describe, expect, it } from 'vitest';
import { detectPointerGesture } from '../src/game/input/InputController';

describe('detectPointerGesture', () => {
  it('识别四个方向的快速滑动', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 40, y: 105, time: 160 })).toBe('laneLeft');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 170, y: 96, time: 160 })).toBe('laneRight');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 104, y: 35, time: 160 })).toBe('jump');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 96, y: 170, time: 160 })).toBe('slide');
  });

  it('短距离释放识别为确认，慢拖不触发动作', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 110, y: 106, time: 120 })).toBe('confirm');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 170, y: 100, time: 900 })).toBe(null);
  });
});
