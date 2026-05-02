import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LANE_X } from '../config';
import type { LaneItem } from '../spawn/patterns';
import { getLaneItemVisual, neonSunsetTheme } from './theme';
import { PerspectiveProjector } from './PerspectiveProjector';

export interface PlayerVisual {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  core: Phaser.GameObjects.Ellipse;
  trail: Phaser.GameObjects.Rectangle;
  shieldRing: Phaser.GameObjects.Arc;
  hitArea: Phaser.GameObjects.Rectangle;
}

export interface MovingVisualItem extends LaneItem {
  container: Phaser.GameObjects.Container;
  hitArea: Phaser.GameObjects.Rectangle;
  roadProgress: number;
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
    graphics.lineStyle(2, neonSunsetTheme.colors.laneCyan, 0.34);
    graphics.lineBetween(polygon.topLeft.x, polygon.topLeft.y, polygon.bottomLeft.x, polygon.bottomLeft.y);
    graphics.lineBetween(polygon.topRight.x, polygon.topRight.y, polygon.bottomRight.x, polygon.bottomRight.y);
    container.add(graphics);

    for (let y = this.projector.horizonY + 28; y < GAME_HEIGHT + 24; y += 56) {
      const left = this.projector.trackEdgeX(-1.45, y);
      const right = this.projector.trackEdgeX(1.45, y);
      const grid = this.scene.add.line(0, 0, left, y, right, y, neonSunsetTheme.colors.laneCyan, neonSunsetTheme.track.gridAlpha);
      grid.setOrigin(0, 0);
      container.add(grid);
    }

    for (const edge of [-1.5, -0.5, 0.5, 1.5] as const) {
      const color = Math.abs(edge) === 1.5 ? neonSunsetTheme.colors.lanePurple : neonSunsetTheme.colors.laneCyan;
      this.strokeTrackCurve(graphics, edge, color, Math.abs(edge) === 1.5 ? 0.58 : 0.46, Math.abs(edge) === 1.5 ? 4 : 2);
    }

    container.setDepth(1);
    return container;
  }

  createPlayer(): PlayerVisual {
    const trail = this.scene.add.rectangle(
      0,
      28,
      18,
      neonSunsetTheme.player.trailLength,
      neonSunsetTheme.colors.playerBody,
      0.24,
    );
    const body = this.scene.add.rectangle(
      0,
      0,
      neonSunsetTheme.player.width,
      neonSunsetTheme.player.height,
      neonSunsetTheme.colors.playerBody,
      1,
    );
    const core = this.scene.add.ellipse(0, -6, 14, 18, neonSunsetTheme.colors.playerCore, 1);
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
    shieldRing.setStrokeStyle(2, 0x7ee787, 0);

    const container = this.scene.add.container(LANE_X[1], GAME_HEIGHT - 132, [trail, body, core, shieldRing, hitArea]);
    container.setDepth(4);
    return { container, body, core, trail, shieldRing, hitArea };
  }

  createLaneItem(item: LaneItem): MovingVisualItem {
    const visual = getLaneItemVisual(item.kind);
    const fill = Number(visual.fill);
    const glow = Number(visual.glow);
    const roadProgress = this.projector.spawnProgress;
    const spawn = this.projector.projectLaneAtProgress(item.lane, roadProgress);
    const container = this.scene.add.container(spawn.x, spawn.y);
    const hitArea = this.scene.add.rectangle(0, -22, 44, 44, fill, 0);

    if (visual.shape === 'orb') {
      const orb = this.scene.add.circle(0, -13, 13, fill, 1);
      orb.setStrokeStyle(2, glow, 0.8);
      container.add(orb);
    } else if (visual.shape === 'hex' || visual.shape === 'crystal') {
      const gem = this.scene.add.polygon(0, -22, [0, -20, 18, -8, 16, 14, 0, 22, -16, 14, -18, -8], fill, 1);
      gem.setStrokeStyle(2, glow, 0.82);
      container.add(gem);
    } else if (visual.shape === 'beam') {
      const beam = this.scene.add.rectangle(0, -18, 118, 18, fill, 1);
      beam.setStrokeStyle(2, glow, 0.9);
      hitArea.setY(-18);
      hitArea.setSize(118, 24);
      container.add(beam);
    } else if (visual.shape === 'low-fence') {
      const fence = this.scene.add.rectangle(0, -11, 54, 22, fill, 1);
      fence.setStrokeStyle(2, glow, 0.84);
      hitArea.setY(-11);
      hitArea.setSize(54, 26);
      container.add(fence);
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
    container.setScale(spawn.scale);
    return { ...item, container, hitArea, roadProgress };
  }

  private strokeTrackCurve(graphics: Phaser.GameObjects.Graphics, edge: number, color: number, alpha: number, width: number): void {
    const points = this.projector.trackLanePoints(edge, 18);
    graphics.lineStyle(width, color, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) {
      graphics.lineTo(point.x, point.y);
    }
    graphics.strokePath();
  }
}
