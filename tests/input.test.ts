import { describe, expect, it } from 'vitest';
import { detectPointerGesture, keyToAction } from '../src/game/input/InputController';

describe('detectPointerGesture', () => {
  it('识别左右快滑并忽略上下快滑', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 40, y: 105, time: 160 })).toBe('laneLeft');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 170, y: 96, time: 160 })).toBe('laneRight');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 104, y: 35, time: 160 })).toBe(null);
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 96, y: 170, time: 160 })).toBe(null);
  });

  it('短距离释放识别为确认，慢拖不触发动作', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 110, y: 106, time: 120 })).toBe('confirm');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 170, y: 100, time: 900 })).toBe(null);
  });
});

describe('keyToAction', () => {
  it('maps space to pause and enter to confirm on PC', () => {
    expect(keyToAction(' ')).toBe('pause');
    expect(keyToAction('Space')).toBe('pause');
    expect(keyToAction('Enter')).toBe('confirm');
  });

  it('ignores vertical movement keys after removing jump and slide actions', () => {
    expect(keyToAction('w')).toBe(null);
    expect(keyToAction('W')).toBe(null);
    expect(keyToAction('ArrowUp')).toBe(null);
    expect(keyToAction('s')).toBe(null);
    expect(keyToAction('S')).toBe(null);
    expect(keyToAction('ArrowDown')).toBe(null);
  });
});
