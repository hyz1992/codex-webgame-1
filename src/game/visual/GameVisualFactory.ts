import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LANE_X } from '../config';
import type { LaneItem } from '../spawn/patterns';
import { getLaneItemVisual, neonSunsetTheme } from './theme';
import { PerspectiveProjector } from './PerspectiveProjector';
import {
  ITEM_GROUND_SHADOW_ALPHA,
  ITEM_VISUAL_SCALE,
  MAIN_ROAD_EDGE_LANE_OFFSET,
  OUTER_ROAD_EDGE_LANE_OFFSET,
  PLAYER_ANCHOR_Y,
  ROADSIDE_LAMP_LANE_OFFSET,
} from './layout';
import { getObstacleVisualProfile } from './obstacleVisualProfile';

export interface PlayerVisual {
  container: Phaser.GameObjects.Container;
  vehicleParts: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible>;
  body: Phaser.GameObjects.Rectangle;
  core: Phaser.GameObjects.Ellipse;
  trail: Phaser.GameObjects.Rectangle;
  shieldRing: Phaser.GameObjects.Arc;
  hitArea: Phaser.GameObjects.Rectangle;
}

export interface MovingVisualItem extends LaneItem {
  container: Phaser.GameObjects.Container;
  hitArea: Phaser.GameObjects.Rectangle;
  roadDistance: number;
  roadProgress: number;
}

export interface RoadsideLampVisual {
  container: Phaser.GameObjects.Container;
  side: -1 | 1;
  roadDistance: number;
  roadProgress: number;
}

export interface LaneDashVisual {
  line: Phaser.GameObjects.Line;
  edge: -0.5 | 0.5;
  roadDistance: number;
  roadProgress: number;
}

export const TRACK_FAR_FADE_PROGRESS = 0.18;

export const TRACK_HORIZON_MIST = {
  height: 54,
  featherHeight: 92,
  color: 0x06142f,
  glowColor: 0x3f2f88,
  coreAlpha: 0.52,
  featherAlpha: 0.2,
} as const;

export function trackFarFadeAlpha(progress: number, baseAlpha: number): number {
  if (progress <= 0) {
    return 0;
  }

  if (progress >= TRACK_FAR_FADE_PROGRESS) {
    return baseAlpha;
  }

  return baseAlpha * (progress / TRACK_FAR_FADE_PROGRESS);
}

export class GameVisualFactory {
  private readonly projector = new PerspectiveProjector();

  constructor(private readonly scene: Phaser.Scene) {}

  createBackground(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const top = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.25,
      GAME_WIDTH,
      GAME_HEIGHT * 0.55,
      neonSunsetTheme.colors.skyMid,
      0.72,
    );
    const night = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.72,
      GAME_WIDTH,
      GAME_HEIGHT * 0.7,
      neonSunsetTheme.colors.night,
      1,
    );
    const sun = this.scene.add.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.18, 76, neonSunsetTheme.colors.skyTop, 0.24);
    const skyline = this.scene.add.graphics();

    skyline.fillStyle(0x081016, 0.55);
    for (let index = 0; index < 9; index += 1) {
      const width = 28 + (index % 3) * 12;
      const height = 46 + (index % 4) * 18;
      skyline.fillRect(index * 48 - 18, GAME_HEIGHT * 0.44 - height, width, height);
    }

    container.add([top, night, sun, skyline]);
    container.setDepth(0);
    return container;
  }

  createTrack(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const graphics = this.scene.add.graphics();
    const polygon = this.projector.trackPolygon();

    graphics.fillStyle(neonSunsetTheme.colors.track, 0.76);
    graphics.fillPoints([polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft], true);
    container.add(graphics);

    for (const edge of [-MAIN_ROAD_EDGE_LANE_OFFSET, MAIN_ROAD_EDGE_LANE_OFFSET] as const) {
      this.strokeTrackCurve(graphics, edge, neonSunsetTheme.colors.lanePurple, 0.58, 4);
    }

    for (const edge of [-OUTER_ROAD_EDGE_LANE_OFFSET, OUTER_ROAD_EDGE_LANE_OFFSET] as const) {
      this.strokeTrackCurve(graphics, edge, neonSunsetTheme.colors.laneCyan, 0.48, 3);
    }

    container.add(this.createHorizonMist());

    container.setDepth(1);
    return container;
  }

  createPlayer(): PlayerVisual {
    const trail = this.scene.add.rectangle(
      0,
      22,
      14,
      neonSunsetTheme.player.trailLength,
      neonSunsetTheme.colors.playerBody,
      0.24,
    );
    const rearRing = this.scene.add.ellipse(0, 18, 48, 30, 0x020817, 0.82);
    const frontRing = this.scene.add.ellipse(0, -30, 30, 18, 0x020817, 0.82);
    const body = this.scene.add.rectangle(
      0,
      -4,
      24,
      neonSunsetTheme.player.height,
      neonSunsetTheme.colors.playerBody,
      0.92,
    );
    const nose = this.scene.add.triangle(0, -36, -7, 6, 7, 6, 0, -10, neonSunsetTheme.colors.playerCore, 0.92);
    const core = this.scene.add.ellipse(0, -8, 22, 16, neonSunsetTheme.colors.playerCore, 1);
    const leftHandle = this.scene.add.rectangle(-28, 0, 24, 5, neonSunsetTheme.colors.playerBody, 0.88);
    const rightHandle = this.scene.add.rectangle(28, 0, 24, 5, neonSunsetTheme.colors.playerBody, 0.88);
    const shieldRing = this.scene.add.circle(0, 0, 34, neonSunsetTheme.colors.playerBody, 0);
    const hitArea = this.scene.add.rectangle(
      0,
      0,
      neonSunsetTheme.player.hitbox.width,
      neonSunsetTheme.player.hitbox.height,
      0xffffff,
      0,
    );

    body.setStrokeStyle(2, neonSunsetTheme.colors.playerCore, 0.75);
    trail.setOrigin(0.5, 0);
    rearRing.setStrokeStyle(4, neonSunsetTheme.colors.laneCyan, 0.72);
    frontRing.setStrokeStyle(3, neonSunsetTheme.colors.laneCyan, 0.68);
    shieldRing.setStrokeStyle(2, 0x7ee787, 0);
    nose.setStrokeStyle(1, neonSunsetTheme.colors.laneCyan, 0.78);
    leftHandle.setStrokeStyle(1, neonSunsetTheme.colors.laneCyan, 0.72);
    rightHandle.setStrokeStyle(1, neonSunsetTheme.colors.laneCyan, 0.72);

    const container = this.scene.add.container(LANE_X[1], PLAYER_ANCHOR_Y, [
      trail,
      rearRing,
      frontRing,
      body,
      leftHandle,
      rightHandle,
      nose,
      core,
      shieldRing,
      hitArea,
    ]);
    container.setDepth(4);
    return {
      container,
      vehicleParts: [trail, rearRing, frontRing, body, leftHandle, rightHandle, nose, core],
      body,
      core,
      trail,
      shieldRing,
      hitArea,
    };
  }

  createLaneItem(item: LaneItem): MovingVisualItem {
    const visual = getLaneItemVisual(item.kind);
    const fill = Number(visual.fill);
    const glow = Number(visual.glow);
    const roadDistance = this.projector.spawnDistance;
    const roadProgress = this.projector.distanceToProgress(roadDistance);
    const spawn = this.projector.projectLaneAtDistance(item.lane, roadDistance);
    const container = this.scene.add.container(spawn.x, spawn.y);
    const hitArea = this.scene.add.rectangle(0, -22, 44, 44, fill, 0);
    const profile = getObstacleVisualProfile(item.kind);
    const shadowWidth = profile ? profile.width * 1.08 : 62;
    const shadow = this.scene.add.ellipse(0, 0, shadowWidth, 14, 0x020817, ITEM_GROUND_SHADOW_ALPHA);
    shadow.setStrokeStyle(1, glow, 0.18);
    container.add(shadow);

    if (visual.shape === 'orb') {
      const orb = this.scene.add.circle(0, -13, 13, fill, 1);
      orb.setStrokeStyle(2, glow, 0.8);
      container.add(orb);
    } else if (visual.shape === 'hex' || visual.shape === 'crystal') {
      const gem = this.scene.add.polygon(0, -22, [0, -20, 18, -8, 16, 14, 0, 22, -16, 14, -18, -8], fill, 1);
      gem.setStrokeStyle(2, glow, 0.82);
      container.add(gem);
    } else if (visual.shape === 'beam') {
      const gate = profile ?? { width: 124, height: 68, hitArea: { y: -30, width: 122, height: 28 } };
      const leftPost = this.scene.add.rectangle(-gate.width / 2 + 10, -gate.height / 2, 8, gate.height, fill, 0.72);
      const rightPost = this.scene.add.rectangle(gate.width / 2 - 10, -gate.height / 2, 8, gate.height, fill, 0.72);
      const crossBeam = this.scene.add.rectangle(0, gate.hitArea.y, gate.width, gate.hitArea.height, fill, 1);
      const topGlow = this.scene.add.rectangle(0, -gate.height + 8, gate.width * 0.86, 6, glow, 0.48);
      leftPost.setStrokeStyle(2, glow, 0.7);
      rightPost.setStrokeStyle(2, glow, 0.7);
      crossBeam.setStrokeStyle(2, glow, 0.95);
      topGlow.setStrokeStyle(1, glow, 0.65);
      hitArea.setY(gate.hitArea.y);
      hitArea.setSize(gate.hitArea.width, gate.hitArea.height);
      container.add([leftPost, rightPost, crossBeam, topGlow]);
    } else if (visual.shape === 'low-fence') {
      const fenceProfile = profile ?? { width: 76, height: 58, hitArea: { y: -14, width: 68, height: 30 } };
      const leftStrut = this.scene.add.rectangle(-fenceProfile.width / 2 + 12, -fenceProfile.height / 2, 9, fenceProfile.height, fill, 0.72);
      const rightStrut = this.scene.add.rectangle(fenceProfile.width / 2 - 12, -fenceProfile.height / 2, 9, fenceProfile.height, fill, 0.72);
      const lowerRail = this.scene.add.rectangle(0, fenceProfile.hitArea.y, fenceProfile.width, fenceProfile.hitArea.height, fill, 1);
      const crown = this.scene.add.polygon(0, -fenceProfile.height + 8, [-24, 8, 0, -8, 24, 8], glow, 0.42);
      leftStrut.setStrokeStyle(2, glow, 0.68);
      rightStrut.setStrokeStyle(2, glow, 0.68);
      lowerRail.setStrokeStyle(2, glow, 0.9);
      crown.setStrokeStyle(1, glow, 0.72);
      hitArea.setY(fenceProfile.hitArea.y);
      hitArea.setSize(fenceProfile.hitArea.width, fenceProfile.hitArea.height);
      container.add([leftStrut, rightStrut, lowerRail, crown]);
    } else if (visual.shape === 'rift') {
      const rift = this.scene.add.polygon(0, -24, [-16, -24, 16, -14, 4, 0, 18, 24, -18, 14, -5, 0], fill, 1);
      rift.setStrokeStyle(2, glow, 0.95);
      container.add(rift);
    } else {
      const block = this.scene.add.rectangle(0, -21, 46, 42, fill, 1);
      block.setStrokeStyle(2, glow, 0.82);
      container.add(block);
    }

    container.add(hitArea);
    container.setDepth(3);
    container.setScale(spawn.scale * ITEM_VISUAL_SCALE);
    return { ...item, container, hitArea, roadDistance, roadProgress };
  }

  createRoadsideLamp(side: -1 | 1, roadDistance: number): RoadsideLampVisual {
    const roadProgress = this.projector.distanceToProgress(roadDistance);
    const projected = this.projector.projectLaneAtDistance(1, roadDistance);
    const lamp = this.scene.add.container(this.projector.centerX + side * projected.laneSpacing * ROADSIDE_LAMP_LANE_OFFSET, projected.y);
    const foot = this.scene.add.ellipse(0, 0, 20, 6, 0x020817, 0.22);
    const pole = this.scene.add.rectangle(0, -22, 3, 44, 0x18f7ff, 0.24);
    const halo = this.scene.add.circle(0, -44, 13, 0x18f7ff, 0.13);
    const bulb = this.scene.add.circle(0, -44, 5, 0xf6ff5d, 0.78);

    pole.setStrokeStyle(1, 0x7fffff, 0.35);
    bulb.setStrokeStyle(1, 0xffffff, 0.55);
    lamp.add([foot, pole, halo, bulb]);
    lamp.setDepth(2 + roadProgress);
    lamp.setScale(projected.scale);
    lamp.setAlpha(trackFarFadeAlpha(roadProgress, 0.85));
    return { container: lamp, side, roadDistance, roadProgress };
  }

  createLaneDash(edge: -0.5 | 0.5, roadDistance: number): LaneDashVisual {
    const roadProgress = this.projector.distanceToProgress(roadDistance);
    const line = this.scene.add.line(0, 0, 0, 0, 0, 1, neonSunsetTheme.colors.laneCyan, 0.62);
    line.setOrigin(0, 0);
    line.setDepth(2.4);
    return { line, edge, roadDistance, roadProgress };
  }

  private strokeTrackCurve(graphics: Phaser.GameObjects.Graphics, edge: number, color: number, alpha: number, width: number): void {
    const points = this.projector.trackLanePoints(edge, 18);
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const point = points[index];
      const segmentAlpha = trackFarFadeAlpha((previous.progress + point.progress) / 2, alpha);
      if (segmentAlpha <= 0.01) {
        continue;
      }

      graphics.lineStyle(width, color, segmentAlpha);
      graphics.beginPath();
      graphics.moveTo(previous.x, previous.y);
      graphics.lineTo(point.x, point.y);
      graphics.strokePath();
    }
  }

  private createHorizonMist(): Phaser.GameObjects.Graphics {
    const mist = this.scene.add.graphics();
    const y = this.projector.horizonY;
    mist.fillStyle(TRACK_HORIZON_MIST.color, TRACK_HORIZON_MIST.featherAlpha);
    mist.fillRect(0, y - TRACK_HORIZON_MIST.featherHeight / 2, GAME_WIDTH, TRACK_HORIZON_MIST.featherHeight);
    mist.fillStyle(TRACK_HORIZON_MIST.glowColor, 0.14);
    mist.fillRect(0, y - TRACK_HORIZON_MIST.height / 2, GAME_WIDTH, TRACK_HORIZON_MIST.height);
    mist.fillStyle(TRACK_HORIZON_MIST.color, TRACK_HORIZON_MIST.coreAlpha);
    mist.fillRect(0, y - TRACK_HORIZON_MIST.height / 3, GAME_WIDTH, TRACK_HORIZON_MIST.height * 0.56);
    return mist;
  }

}
