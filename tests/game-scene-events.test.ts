import { describe, expect, it, vi } from 'vitest';
import type { GameAction } from '../src/game/actions';

class MiniEvents {
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  on(event: string, listener: (...args: unknown[]) => void): void {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
  }

  off(event: string, listener: (...args: unknown[]) => void): void {
    this.listeners.set(
      event,
      (this.listeners.get(event) ?? []).filter((current) => current !== listener),
    );
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }
}

vi.mock('phaser', () => ({
  default: {
    Scene: class {
      events = new MiniEvents();

      constructor(_key: string) {}
    },
    Geom: {
      Intersects: {
        RectangleToRectangle: () => false,
      },
    },
    Math: {
      Linear: (from: number, to: number, amount: number) => from + (to - from) * amount,
    },
  },
}));

describe('GameScene action events', () => {
  it('重建场景时不会重复绑定输入动作监听器', async () => {
    const { GameScene } = await import('../src/game/scenes/GameScene');
    const scene = new GameScene();
    const handledActions: GameAction[] = [];

    vi.spyOn(scene as unknown as { applyAction: (action: GameAction) => void }, 'applyAction').mockImplementation(
      (action: GameAction) => {
        handledActions.push(action);
      },
    );

    const bindActionHandler = (scene as unknown as { bindActionHandler: () => void }).bindActionHandler;

    bindActionHandler.call(scene);
    bindActionHandler.call(scene);
    scene.events.emit('game-action', 'laneLeft');

    expect(handledActions).toEqual(['laneLeft']);
  });
});
