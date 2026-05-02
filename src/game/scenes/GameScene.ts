import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config';
import type { GameAction } from '../actions';
import { preloadGameAssets } from '../assets/preloadGameAssets';
import { LaneController } from '../lane/LaneController';
import { addDistance, createInitialRunState, resetRun, startRun, tickBoost, type RunState } from '../state';
import { ObstacleSpawner } from '../spawn/ObstacleSpawner';
import { resolvePlayerCollision } from '../collision/CollisionSystem';
import { AssetVisualFactory } from '../visual/AssetVisualFactory';
import { EffectController } from '../visual/EffectController';
import { GameVisualFactory, type MovingVisualItem, type PlayerVisual, type RoadsideLampVisual } from '../visual/GameVisualFactory';
import { ITEM_VISUAL_SCALE, PLAYER_ANCHOR_Y } from '../visual/layout';
import { PerspectiveProjector } from '../visual/PerspectiveProjector';
import { playerRunPose } from '../visual/playerRunPose';
import { neonSunsetTheme } from '../visual/theme';

export const RUN_STATE_EVENT = 'run-state-change';
const GAME_ACTION_EVENT = 'game-action';

export class GameScene extends Phaser.Scene {
  private player!: PlayerVisual;
  private visualFactory!: GameVisualFactory;
  private assetVisualFactory!: AssetVisualFactory;
  private effects!: EffectController;
  private readonly projector = new PerspectiveProjector();
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private readonly debugModeEnabled = new URLSearchParams(window.location.search).get('debug') === '1';
  private laneController = new LaneController();
  private runState: RunState = createInitialRunState();
  private spawner = new ObstacleSpawner(1);
  private items: MovingVisualItem[] = [];
  private roadsideLamps: RoadsideLampVisual[] = [];
  private elapsedMs = 0;
  private spawnTimerMs = 0;
  private motionStartedMs = 0;

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
    this.roadsideLamps = this.createRoadsideLamps();
    this.player = this.assetVisualFactory.createPlayer();
    this.effects = new EffectController(this);
    this.effects.createSpeedLines();
    this.debugGraphics = this.debugModeEnabled ? this.add.graphics().setDepth(20) : undefined;
    this.publishState();

    this.bindActionHandler();
  }

  private resetRuntimeFields(): void {
    this.laneController = new LaneController();
    this.runState = resetRun(this.runState, { debug: this.debugModeEnabled });
    this.spawner = new ObstacleSpawner(1);
    this.items = [];
    this.roadsideLamps = [];
    this.elapsedMs = 0;
    this.spawnTimerMs = 0;
    this.motionStartedMs = 0;
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

    this.syncPlayerPosition();
    this.moveItems(deltaMs);
    this.moveRoadsideLamps(deltaMs);
    this.effects.updateBoost(this.runState.isBoosting);
    this.drawDebugHitboxes();
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
    if (action === 'jump' || action === 'slide') {
      this.motionStartedMs = this.elapsedMs;
    }
    this.laneController.applyAction(action);
    const afterLane = this.laneController.snapshot().lane;
    if (afterLane !== beforeLane) {
      this.effects.playLaneChange(this.player, afterLane);
    }

    const actionDurationMs =
      action === 'jump' ? neonSunsetTheme.motion.jumpMs : action === 'slide' ? neonSunsetTheme.motion.slideMs : 280;
    this.time.delayedCall(actionDurationMs, () => {
      this.laneController.endActionState();
    });
  }

  private spawnPattern(secondsElapsed: number): void {
    const pattern = this.spawner.nextPattern(secondsElapsed);
    const items = [...pattern.hazards, ...pattern.pickups];

    for (const item of items) {
      const visualItem = this.assetVisualFactory.createLaneItem(item);
      this.projectMovingItem(visualItem);
      this.items.push(visualItem);
    }
  }

  private moveItems(deltaMs: number): void {
    const playerBounds = this.player.hitArea.getBounds();
    const playerMotion = this.laneController.snapshot().motion;
    const speedMultiplier = this.runState.isBoosting ? 1.12 : 1;
    const pixels = (this.runState.speed * speedMultiplier * deltaMs) / 1000;

    for (const item of this.items) {
      const progressDelta =
        (pixels / (this.projector.bottomY - this.projector.horizonY)) *
        this.projector.movementRateAtProgress(item.roadProgress);
      item.roadProgress += progressDelta;
      this.projectMovingItem(item);

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
      const keep = item.container.active && item.roadProgress < this.projector.exitProgress;
      if (!keep && item.container.active) {
        item.container.destroy();
      }
      return keep;
    });
  }

  private createRoadsideLamps(): RoadsideLampVisual[] {
    const lamps: RoadsideLampVisual[] = [];

    for (const side of [-1, 1] as const) {
      for (const point of this.projector.roadsideMarkerPoints(side, 8)) {
        const lamp = this.visualFactory.createRoadsideLamp(side, point.progress);
        this.projectRoadsideLamp(lamp);
        lamps.push(lamp);
      }
    }

    return lamps;
  }

  private moveRoadsideLamps(deltaMs: number): void {
    const speedMultiplier = this.runState.isBoosting ? 1.12 : 1;
    const pixels = (this.runState.speed * speedMultiplier * deltaMs) / 1000;

    for (const lamp of this.roadsideLamps) {
      const progressDelta =
        (pixels / (this.projector.bottomY - this.projector.horizonY)) *
        this.projector.movementRateAtProgress(lamp.roadProgress);
      lamp.roadProgress = this.projector.loopRoadsideProgress(lamp.roadProgress + progressDelta);
      this.projectRoadsideLamp(lamp);
    }
  }

  private syncPlayerPosition(): void {
    const snapshot = this.laneController.snapshot();
    const projected = this.projector.projectLane(snapshot.lane, PLAYER_ANCHOR_Y);
    const pose = playerRunPose(
      this.elapsedMs,
      this.runState.hasStarted && !this.runState.isPaused && !this.runState.isGameOver,
      this.runState.isBoosting,
      snapshot.motion,
      this.elapsedMs - this.motionStartedMs,
    );
    const motionScaleY = snapshot.motion === 'sliding' ? 0.62 : snapshot.motion === 'jumping' ? 1.04 : 1;
    this.player.container.x = Phaser.Math.Linear(this.player.container.x, projected.x, 0.35);
    this.player.container.y = projected.y + pose.yOffset;
    this.player.container.setScale(projected.scale * pose.scalePulse, projected.scale * motionScaleY);
    this.player.container.setDepth(6);
  }

  private projectMovingItem(item: MovingVisualItem): void {
    const projected = this.projector.projectLaneAtProgress(item.lane, item.roadProgress);
    item.container.x = projected.x;
    item.container.y = projected.y;
    item.container.setScale(projected.scale * ITEM_VISUAL_SCALE);
    item.container.setAlpha(projected.alpha);
    item.container.setDepth(projected.depth);
  }

  private projectRoadsideLamp(lamp: RoadsideLampVisual): void {
    const projected = this.projector.projectLaneAtProgress(1, lamp.roadProgress);
    lamp.container.x = this.projector.centerX + lamp.side * projected.laneSpacing * 1.72;
    lamp.container.y = projected.y;
    lamp.container.setScale(projected.scale);
    lamp.container.setAlpha(projected.alpha * 0.85);
    lamp.container.setDepth(2 + lamp.roadProgress * 4);
  }

  private drawDebugHitboxes(): void {
    if (!this.debugGraphics) {
      return;
    }

    this.debugGraphics.clear();
    const playerBounds = this.player.hitArea.getBounds();
    this.debugGraphics.lineStyle(2, 0x7ee787, 0.9);
    this.debugGraphics.strokeRect(playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height);

    this.debugGraphics.lineStyle(1, 0xef476f, 0.85);
    for (const item of this.items) {
      if (!item.container.active) {
        continue;
      }

      const itemBounds = item.hitArea.getBounds();
      this.debugGraphics.strokeRect(itemBounds.x, itemBounds.y, itemBounds.width, itemBounds.height);
    }
  }

  private publishState(): void {
    this.game.events.emit(RUN_STATE_EVENT, this.runState);
  }
}
