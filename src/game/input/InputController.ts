import type { GameAction } from '../actions';
import { GESTURE_AXIS_RATIO, GESTURE_MAX_MS, GESTURE_MIN_DISTANCE } from '../config';

export interface PointerSample {
  x: number;
  y: number;
  time: number;
}

export type ActionListener = (action: GameAction) => void;

export function detectPointerGesture(start: PointerSample, end: PointerSample): GameAction | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const elapsed = end.time - start.time;

  if (absX < GESTURE_MIN_DISTANCE && absY < GESTURE_MIN_DISTANCE) {
    return 'confirm';
  }

  if (elapsed > GESTURE_MAX_MS) {
    return null;
  }

  if (absX > absY * GESTURE_AXIS_RATIO) {
    return dx < 0 ? 'laneLeft' : 'laneRight';
  }

  if (absY > absX * GESTURE_AXIS_RATIO) {
    return dy < 0 ? 'jump' : 'slide';
  }

  return null;
}

export class InputController {
  private pointerStart: PointerSample | null = null;

  constructor(
    private readonly target: HTMLElement,
    private readonly onAction: ActionListener,
  ) {}

  bind(): void {
    this.target.addEventListener('pointerdown', this.handlePointerDown);
    this.target.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  destroy(): void {
    this.target.removeEventListener('pointerdown', this.handlePointerDown);
    this.target.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerStart = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.pointerStart) {
      return;
    }

    const action = detectPointerGesture(this.pointerStart, {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    });

    this.pointerStart = null;

    if (action) {
      this.onAction(action);
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const action = keyToAction(event.key);

    if (action) {
      event.preventDefault();
      this.onAction(action);
    }
  };
}

export function keyToAction(key: string): GameAction | null {
  if (key === 'a' || key === 'A' || key === 'ArrowLeft') {
    return 'laneLeft';
  }

  if (key === 'd' || key === 'D' || key === 'ArrowRight') {
    return 'laneRight';
  }

  if (key === 'w' || key === 'W' || key === 'ArrowUp') {
    return 'jump';
  }

  if (key === 's' || key === 'S' || key === 'ArrowDown') {
    return 'slide';
  }

  if (key === 'Escape' || key === ' ' || key === 'Space' || key === 'Spacebar') {
    return 'pause';
  }

  if (key === 'r' || key === 'R') {
    return 'restart';
  }

  if (key === 'Enter') {
    return 'confirm';
  }

  return null;
}
