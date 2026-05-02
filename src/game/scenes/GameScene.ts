import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LANE_X } from '../config';
import type { GameAction } from '../actions';
import { LaneController } from '../lane/LaneController';
import { addDistance, createInitialRunState, resetRun, startRun, tickBoost, type RunState } from '../state';
import { ObstacleSpawner } from '../spawn/ObstacleSpawner';
import type { LaneItem } from '../spawn/patterns';
import { resolveCollision } from '../collision/CollisionSystem';

export const RUN_STATE_EVENT = 'run-state-change';

interface MovingItem extends LaneItem {
  shape: Phaser.GameObjects.Rectangle;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private laneController = new LaneController();
  private runState: RunState = createInitialRunState();
  private spawner = new ObstacleSpawner(1);
  private items: MovingItem[] = [];
  private elapsedMs = 0;
  private spawnTimerMs = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.resetRuntimeFields();
    this.drawTrack();
    this.player = this.add.rectangle(LANE_X[1], GAME_HEIGHT - 132, 34, 48, 0xf6c453);
    this.publishState();

    this.events.on('game-action', (action: GameAction) => {
      this.applyAction(action);
    });
  }

  private resetRuntimeFields(): void {
    this.laneController = new LaneController();
    this.runState = resetRun(this.runState);
    this.spawner = new ObstacleSpawner(1);
    this.items = [];
    this.elapsedMs = 0;
    this.spawnTimerMs = 0;
  }

  update(_time: number, deltaMs: number): void {
    if (!this.runState.hasStarted || this.runState.isPaused || this.runState.isGameOver) {
      return;
    }

    this.elapsedMs += deltaMs;
    this.spawnTimerMs += deltaMs;
    this.runState = tickBoost(addDistance(this.runState, (this.runState.speed * deltaMs) / 1000 / 18), deltaMs);

    const secondsElapsed = this.elapsedMs / 1000;
    if (this.spawnTimerMs >= this.spawner.getSpawnIntervalMs(secondsElapsed)) {
      this.spawnTimerMs = 0;
      this.spawnPattern(secondsElapsed);
    }

    this.moveItems(deltaMs);
    this.syncPlayerPosition();
    this.publishState();
  }

  private drawTrack(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 290, GAME_HEIGHT, 0x1c2b35);

    for (const laneX of LANE_X) {
      this.add.rectangle(laneX, GAME_HEIGHT / 2, 2, GAME_HEIGHT, 0x39505f, 0.8);
    }
  }

  private applyAction(action: GameAction): void {
    if (action === 'confirm' && !this.runState.hasStarted) {
      this.runState = startRun(this.runState);
      this.publishState();
      return;
    }

    if (action === 'restart') {
      this.scene.restart();
      return;
    }

    if (action === 'pause') {
      if (!this.runState.hasStarted) {
        return;
      }

      this.runState = {
        ...this.runState,
        isPaused: !this.runState.isPaused,
      };
      this.publishState();
      return;
    }

    this.laneController.applyAction(action);
    this.time.delayedCall(280, () => {
      this.laneController.endActionState();
    });
  }

  private spawnPattern(secondsElapsed: number): void {
    const pattern = this.spawner.nextPattern(secondsElapsed);
    const items = [...pattern.hazards, ...pattern.pickups];

    for (const item of items) {
      const color = this.getItemColor(item.kind);
      const size = this.getItemSize(item.kind);
      const shape = this.add.rectangle(LANE_X[item.lane], -40, size.width, size.height, color);
      this.items.push({
        ...item,
        shape,
      });
    }
  }

  private moveItems(deltaMs: number): void {
    const playerBounds = this.player.getBounds();
    const speedMultiplier = this.runState.isBoosting ? 1.12 : 1;
    const pixels = (this.runState.speed * speedMultiplier * deltaMs) / 1000;

    for (const item of this.items) {
      item.shape.y += pixels;

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, item.shape.getBounds())) {
        this.runState = resolveCollision(this.runState, item);
        item.shape.destroy();
      }
    }

    this.items = this.items.filter((item) => {
      const keep = item.shape.active && item.shape.y < GAME_HEIGHT + 80;
      if (!keep && item.shape.active) {
        item.shape.destroy();
      }
      return keep;
    });
  }

  private syncPlayerPosition(): void {
    const snapshot = this.laneController.snapshot();
    this.player.x = Phaser.Math.Linear(this.player.x, LANE_X[snapshot.lane], 0.35);

    if (snapshot.motion === 'jumping') {
      this.player.scaleY = 0.82;
      return;
    }

    if (snapshot.motion === 'sliding') {
      this.player.scaleY = 0.48;
      return;
    }

    this.player.scaleY = 1;
  }

  private getItemColor(kind: LaneItem['kind']): number {
    if (kind === 'energy') {
      return 0x63d2ff;
    }

    if (kind === 'shield') {
      return 0x7ee787;
    }

    if (kind === 'boost') {
      return 0xb78cff;
    }

    if (kind === 'hazard') {
      return 0xef476f;
    }

    return 0xf4a261;
  }

  private getItemSize(kind: LaneItem['kind']): { width: number; height: number } {
    if (kind === 'beam') {
      return { width: 68, height: 24 };
    }

    if (kind === 'lowFence') {
      return { width: 48, height: 20 };
    }

    if (kind === 'energy') {
      return { width: 24, height: 24 };
    }

    return { width: 42, height: 42 };
  }

  private publishState(): void {
    this.game.events.emit(RUN_STATE_EVENT, this.runState);
  }
}
