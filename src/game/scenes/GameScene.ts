import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config';
import type { GameAction } from '../actions';
import { preloadGameAssets } from '../assets/preloadGameAssets';
import { playerAnimationKeys } from '../assets/assetManifest';
import { LaneController } from '../lane/LaneController';
import { addDistance, createInitialRunState, resetRun, startRun, tickBoost, type RunState } from '../state';
import { ObstacleSpawner } from '../spawn/ObstacleSpawner';
import { resolvePlayerCollision } from '../collision/CollisionSystem';
import { AssetVisualFactory } from '../visual/AssetVisualFactory';
import { EffectController } from '../visual/EffectController';
import {
  GameVisualFactory,
  trackFarFadeAlpha,
  type LaneDashVisual,
  type MovingVisualItem,
  type PlayerVisual,
  type RoadsideLampVisual,
} from '../visual/GameVisualFactory';
import { ITEM_VISUAL_SCALE, LANE_SEPARATOR_OFFSET, PLAYER_ANCHOR_Y, ROADSIDE_LAMP_LANE_OFFSET } from '../visual/layout';
import { PerspectiveProjector } from '../visual/PerspectiveProjector';
import { calculatePlayerPerspectiveHeading } from '../visual/playerPerspectiveHeading';
import { playerRunPose } from '../visual/playerRunPose';
import { neonSunsetTheme } from '../visual/theme';

export const RUN_STATE_EVENT = 'run-state-change';
// 调试碰撞框开关；打开后会显示主角和物件 hitbox。
export const DEBUG_HITBOX_OVERLAY_ENABLED = false;
const GAME_ACTION_EVENT = 'game-action';
// 单侧路灯数量，越多远处越连续，但绘制对象也越多。
const ROADSIDE_LAMP_COUNT = 32;
// 每条车道虚线的循环段数，越多远端越不容易凭空出现。
const LANE_DASH_COUNT = 42;
// 单段车道虚线在道路世界中的长度。
const LANE_DASH_LENGTH = 190;

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
  private laneDashes: LaneDashVisual[] = [];
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
    this.laneDashes = this.createLaneDashes();
    this.roadsideLamps = this.createRoadsideLamps();
    this.player = this.assetVisualFactory.createPlayer();
    this.effects = new EffectController(this);
    this.effects.createSpeedLines();
    this.debugGraphics =
      this.debugModeEnabled && DEBUG_HITBOX_OVERLAY_ENABLED ? this.add.graphics().setDepth(20) : undefined;
    this.publishState();

    this.bindActionHandler();
  }

  private resetRuntimeFields(): void {
    this.laneController = new LaneController();
    this.runState = resetRun(this.runState, { debug: this.debugModeEnabled });
    this.spawner = new ObstacleSpawner(1);
    this.items = [];
    this.roadsideLamps = [];
    this.laneDashes = [];
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

    this.syncPlayerPosition();
    this.moveItems(deltaMs);
    this.moveLaneDashes(deltaMs);
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
    this.laneController.applyAction(action);
    const afterLane = this.laneController.snapshot().lane;
    if (afterLane !== beforeLane) {
      this.playPlayerLaneChangeAnimation(action);
      this.effects.playLaneChange(this.player, afterLane);
    }
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
    const travelDistance = this.projector.roadTravelDistanceForPixels(pixels);

    for (const item of this.items) {
      item.roadDistance -= travelDistance;
      item.roadProgress = this.projector.distanceToProgress(item.roadDistance);
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
      const keep = item.container.active && item.roadDistance > this.projector.nearExitDistance;
      if (!keep && item.container.active) {
        item.container.destroy();
      }
      return keep;
    });
  }

  private createRoadsideLamps(): RoadsideLampVisual[] {
    const lamps: RoadsideLampVisual[] = [];

    for (const side of [-1, 1] as const) {
      for (const point of this.projector.roadsideMarkerPoints(side, ROADSIDE_LAMP_COUNT)) {
        const lamp = this.visualFactory.createRoadsideLamp(side, point.distance);
        this.projectRoadsideLamp(lamp);
        lamps.push(lamp);
      }
    }

    return lamps;
  }

  private createLaneDashes(): LaneDashVisual[] {
    const dashes: LaneDashVisual[] = [];

    for (const edge of [-LANE_SEPARATOR_OFFSET, LANE_SEPARATOR_OFFSET]) {
      for (const point of this.projector.laneDashMarkerPoints(edge, LANE_DASH_COUNT)) {
        const dash = this.visualFactory.createLaneDash(edge, point.distance);
        this.projectLaneDash(dash);
        dashes.push(dash);
      }
    }

    return dashes;
  }

  private moveLaneDashes(deltaMs: number): void {
    const speedMultiplier = this.runState.isBoosting ? 1.12 : 1;
    const pixels = (this.runState.speed * speedMultiplier * deltaMs) / 1000;
    const travelDistance = this.projector.roadTravelDistanceForPixels(pixels);

    for (const dash of this.laneDashes) {
      dash.roadDistance = this.projector.advanceRoadDistance(
        dash.roadDistance,
        travelDistance,
        this.projector.markerSpawnDistance,
      );
      dash.roadProgress = this.projector.distanceToProgress(dash.roadDistance);
      this.projectLaneDash(dash);
    }
  }

  private moveRoadsideLamps(deltaMs: number): void {
    const speedMultiplier = this.runState.isBoosting ? 1.12 : 1;
    const pixels = (this.runState.speed * speedMultiplier * deltaMs) / 1000;
    const travelDistance = this.projector.roadTravelDistanceForPixels(pixels);

    for (const lamp of this.roadsideLamps) {
      lamp.roadDistance = this.projector.advanceRoadDistance(
        lamp.roadDistance,
        travelDistance,
        this.projector.markerSpawnDistance,
      );
      lamp.roadProgress = this.projector.distanceToProgress(lamp.roadDistance);
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
      0,
    );
    this.player.container.x = Phaser.Math.Linear(this.player.container.x, projected.x, 0.35);
    this.player.container.y = projected.y + pose.yOffset;
    this.player.container.setScale(projected.scale * pose.scalePulse, projected.scale);
    this.player.container.setDepth(6);
    this.syncPlayerPerspectiveHeading();
    this.playPlayerCruiseAnimation();
  }

  private syncPlayerPerspectiveHeading(): void {
    if (!this.player.sprite) {
      return;
    }

    this.player.sprite.setRotation(
      calculatePlayerPerspectiveHeading({
        playerX: this.player.container.x,
        playerY: this.player.container.y,
        vanishX: this.projector.centerX,
        vanishY: this.projector.horizonY,
      }),
    );
  }

  private playPlayerLaneChangeAnimation(action: GameAction): void {
    if (!this.player.sprite) {
      return;
    }

    const animationKey = action === 'laneLeft' ? playerAnimationKeys.laneLeft : playerAnimationKeys.laneRight;
    this.player.sprite.play(animationKey, true);
    this.player.sprite.once('animationcomplete', () => this.playPlayerCruiseAnimation());
  }

  private playPlayerCruiseAnimation(): void {
    const sprite = this.player.sprite;
    if (!sprite) {
      return;
    }

    const currentKey = sprite.anims.currentAnim?.key;
    const isLaneChanging =
      sprite.anims.isPlaying && (currentKey === playerAnimationKeys.laneLeft || currentKey === playerAnimationKeys.laneRight);
    if (isLaneChanging) {
      return;
    }

    const animationKey = this.runState.hasStarted ? playerAnimationKeys.boost : playerAnimationKeys.idle;
    if (currentKey !== animationKey || !sprite.anims.isPlaying) {
      sprite.play(animationKey, true);
    }
  }

  private projectMovingItem(item: MovingVisualItem): void {
    const projected = this.projector.projectLaneAtDistance(item.lane, item.roadDistance);
    item.roadProgress = this.projector.distanceToProgress(item.roadDistance);
    item.container.x = projected.x;
    item.container.y = projected.y;
    item.container.setScale(projected.scale * ITEM_VISUAL_SCALE);
    item.container.setAlpha(projected.alpha);
    item.container.setDepth(projected.depth);
  }

  private projectRoadsideLamp(lamp: RoadsideLampVisual): void {
    const projected = this.projector.projectLaneAtDistance(1, lamp.roadDistance);
    lamp.roadProgress = this.projector.distanceToProgress(lamp.roadDistance);
    lamp.container.x = this.projector.centerX + lamp.side * projected.laneSpacing * ROADSIDE_LAMP_LANE_OFFSET;
    lamp.container.y = projected.y;
    lamp.container.setScale(projected.scale);
    lamp.container.setAlpha(trackFarFadeAlpha(lamp.roadProgress, projected.alpha * 0.85));
    lamp.container.setDepth(2 + lamp.roadProgress * 4);
  }

  private projectLaneDash(dash: LaneDashVisual): void {
    const far = this.projector.projectLaneAtDistance(1, dash.roadDistance);
    const nearDistance = Math.max(this.projector.nearExitDistance, dash.roadDistance - LANE_DASH_LENGTH);
    const near = this.projector.projectLaneAtDistance(1, nearDistance);
    const farX = this.projector.centerX + dash.edge * far.laneSpacing;
    const nearX = this.projector.centerX + dash.edge * near.laneSpacing;
    const alpha = trackFarFadeAlpha(this.projector.distanceToProgress(nearDistance), Math.min(far.alpha, near.alpha) * 0.74);
    const strokeWidth = Phaser.Math.Clamp(1 + near.scale * 2.2, 1, 6.5);

    dash.roadProgress = this.projector.distanceToProgress(dash.roadDistance);
    dash.line.setTo(farX, far.y, nearX, near.y);
    dash.line.setStrokeStyle(strokeWidth, neonSunsetTheme.colors.laneCyan, alpha);
    dash.line.setDepth(2.2 + dash.roadProgress * 2);
  }

  private drawDebugHitboxes(): void {
    if (!DEBUG_HITBOX_OVERLAY_ENABLED || !this.debugGraphics) {
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
