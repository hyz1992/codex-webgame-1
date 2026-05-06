import { describe, expect, it } from 'vitest';
import { detectPointerGesture, keyToAction } from '../src/game/input/InputController';

describe('detectPointerGesture', () => {
  it('识别左右快滑并忽略上下快滑', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 40, y: 105, time: 160 }, 800, 400, 0, 0)).toBe('laneLeft');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 170, y: 96, time: 160 }, 800, 400, 0, 0)).toBe('laneRight');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 104, y: 35, time: 160 }, 800, 400, 0, 0)).toBe(null);
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 96, y: 170, time: 160 }, 800, 400, 0, 0)).toBe(null);
  });

  it('慢拖不触发动作', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 170, y: 100, time: 900 }, 800, 400, 0, 0)).toBe(null);
  });

  it('屏幕下半部分短距离点击：左半换左道，右半换右道', () => {
    const vh = 800;
    const vw = 400;
    const bottomY = vh * 0.6;

    expect(detectPointerGesture({ x: vw * 0.1, y: bottomY, time: 0 }, { x: vw * 0.1 + 5, y: bottomY + 3, time: 120 }, vw, vh, 0, 0)).toBe('laneLeft');
    expect(detectPointerGesture({ x: vw * 0.8, y: bottomY, time: 0 }, { x: vw * 0.8 + 3, y: bottomY + 2, time: 120 }, vw, vh, 0, 0)).toBe('laneRight');
    expect(detectPointerGesture({ x: vw * 0.3, y: bottomY, time: 0 }, { x: vw * 0.3 + 2, y: bottomY + 1, time: 120 }, vw, vh, 0, 0)).toBe('laneLeft');
  });

  it('屏幕上半部分短距离点击触发 confirm', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 110, y: 106, time: 120 }, 800, 400, 0, 0)).toBe('confirm');
  });

  it('屏幕下半部分正中间短距离点击触发 laneRight', () => {
    expect(detectPointerGesture({ x: 200, y: 600, time: 0 }, { x: 205, y: 603, time: 100 }, 400, 800, 0, 0)).toBe('laneRight');
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
