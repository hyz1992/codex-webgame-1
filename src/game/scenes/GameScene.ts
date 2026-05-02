import Phaser from 'phaser';
import { GAME_HEIGHT, LANE_X } from '../config';
import type { GameAction } from '../actions';
import { LaneController } from '../lane/LaneController';
import { addDistance, createInitialRunState, resetRun, startRun, tickBoost, type RunState } from '../state';
import { ObstacleSpawner } from '../spawn/ObstacleSpawner';
import { resolveCollision } from '../collision/CollisionSystem';
import { GameVisualFactory, type MovingVisualItem, type PlayerVisual } from '../visual/GameVisualFactory';

export const RUN_STATE_EVENT = 'run-state-change';

export class GameScene extends Phaser.Scene {
  private player!: PlayerVisual;
  private visualFactory!: GameVisualFactory;
  private laneController = new LaneController();
  private runState: RunState = createInitialRunState();
  private spawner = new ObstacleSpawner(1);
  private items: MovingVisualItem[] = [];
  private elapsedMs = 0;
  private spawnTimerMs = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.resetRuntimeFields();
    this.visualFactory = new GameVisualFactory(this);
    this.visualFactory.createBackground();
    this.visualFactory.createTrack();
    this.player = this.visualFactory.createPlayer();
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
      this.items.push(this.visualFactory.createLaneItem(item));
    }
  }

  private moveItems(deltaMs: number): void {
    const playerBounds = this.player.container.getBounds();
    const speedMultiplier = this.runState.isBoosting ? 1.12 : 1;
    const pixels = (this.runState.speed * speedMultiplier * deltaMs) / 1000;

    for (const item of this.items) {
      item.container.y += pixels;

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, item.hitArea.getBounds())) {
        this.runState = resolveCollision(this.runState, item);
        item.container.destroy();
      }
    }

    this.items = this.items.filter((item) => {
      const keep = item.container.active && item.container.y < GAME_HEIGHT + 80;
      if (!keep && item.container.active) {
        item.container.destroy();
      }
      return keep;
    });
  }

  private syncPlayerPosition(): void {
    const snapshot = this.laneController.snapshot();
    this.player.container.x = Phaser.Math.Linear(this.player.container.x, LANE_X[snapshot.lane], 0.35);
    this.player.container.setScale(1, snapshot.motion === 'sliding' ? 0.62 : snapshot.motion === 'jumping' ? 0.86 : 1);
  }

  private publishState(): void {
    this.game.events.emit(RUN_STATE_EVENT, this.runState);
  }
}
