import Phaser from 'phaser';
import { GAME_HEIGHT, LANE_X } from '../config';
import type { GameAction } from '../actions';
import { preloadGameAssets } from '../assets/preloadGameAssets';
import { LaneController } from '../lane/LaneController';
import { addDistance, createInitialRunState, resetRun, startRun, tickBoost, type RunState } from '../state';
import { ObstacleSpawner } from '../spawn/ObstacleSpawner';
import { resolvePlayerCollision } from '../collision/CollisionSystem';
import { AssetVisualFactory } from '../visual/AssetVisualFactory';
import { EffectController } from '../visual/EffectController';
import { GameVisualFactory, type MovingVisualItem, type PlayerVisual } from '../visual/GameVisualFactory';

export const RUN_STATE_EVENT = 'run-state-change';
const GAME_ACTION_EVENT = 'game-action';

export class GameScene extends Phaser.Scene {
  private player!: PlayerVisual;
  private visualFactory!: GameVisualFactory;
  private assetVisualFactory!: AssetVisualFactory;
  private effects!: EffectController;
  private laneController = new LaneController();
  private runState: RunState = createInitialRunState();
  private spawner = new ObstacleSpawner(1);
  private items: MovingVisualItem[] = [];
  private elapsedMs = 0;
  private spawnTimerMs = 0;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    preloadGameAssets(this);
  }

  create(): void {
    this.resetRuntimeFields();
    this.visualFactory = new GameVisualFactory(this);
    this.assetVisualFactory = new AssetVisualFactory(this, this.visualFactory);
    this.assetVisualFactory.createBackground();
    this.assetVisualFactory.createTrack();
    this.player = this.assetVisualFactory.createPlayer();
    this.effects = new EffectController(this);
    this.effects.createSpeedLines();
    this.publishState();

    this.bindActionHandler();
  }

  private resetRuntimeFields(): void {
    this.laneController = new LaneController();
    this.runState = resetRun(this.runState);
    this.spawner = new ObstacleSpawner(1);
    this.items = [];
    this.elapsedMs = 0;
    this.spawnTimerMs = 0;
  }

  private readonly handleGameAction = (action: GameAction): void => {
    this.applyAction(action);
  };

  private bindActionHandler(): void {
    this.events.off(GAME_ACTION_EVENT, this.handleGameAction);
    this.events.on(GAME_ACTION_EVENT, this.handleGameAction);
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
    this.effects.updateBoost(this.runState.isBoosting);
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

    const beforeLane = this.laneController.snapshot().lane;
    this.laneController.applyAction(action);
    const afterLane = this.laneController.snapshot().lane;
    if (afterLane !== beforeLane) {
      this.effects.playLaneChange(this.player, afterLane);
    }

    this.time.delayedCall(280, () => {
      this.laneController.endActionState();
    });
  }

  private spawnPattern(secondsElapsed: number): void {
    const pattern = this.spawner.nextPattern(secondsElapsed);
    const items = [...pattern.hazards, ...pattern.pickups];

    for (const item of items) {
      this.items.push(this.assetVisualFactory.createLaneItem(item));
    }
  }

  private moveItems(deltaMs: number): void {
    const playerBounds = this.player.hitArea.getBounds();
    const playerMotion = this.laneController.snapshot().motion;
    const speedMultiplier = this.runState.isBoosting ? 1.12 : 1;
    const pixels = (this.runState.speed * speedMultiplier * deltaMs) / 1000;

    for (const item of this.items) {
      item.container.y += pixels;

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, item.hitArea.getBounds())) {
        const beforeGameOver = this.runState.isGameOver;
        const beforeState = this.runState;
        this.runState = resolvePlayerCollision(this.runState, item, playerMotion);
        if (item.kind === 'energy' || item.kind === 'shield' || item.kind === 'boost') {
          this.effects.playPickup(item, item.container.x, item.container.y);
        }
        if (item.kind === 'shield') {
          this.effects.playShield(this.player);
        }
        if (this.runState.isGameOver && !beforeGameOver) {
          this.effects.playGameOver(this.player.container.x, this.player.container.y);
        } else if (this.runState !== beforeState && item.kind !== 'energy' && item.kind !== 'shield' && item.kind !== 'boost') {
          this.effects.playImpact(this.player);
        }
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
