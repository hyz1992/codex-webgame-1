import Phaser from 'phaser';
import { gameAssetManifest, getLaneItemAsset } from '../assets/assetManifest';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { LaneItem } from '../spawn/patterns';
import { GameVisualFactory, type MovingVisualItem, type PlayerVisual } from './GameVisualFactory';
import {
  CITY_BACKGROUND_Y_OFFSET,
  ITEM_GROUND_SHADOW_ALPHA,
  ITEM_VISUAL_SCALE,
  SUNSET_BACKGROUND_Y_OFFSET,
} from './layout';
import { PerspectiveProjector } from './PerspectiveProjector';

export class AssetVisualFactory {
  private readonly projector = new PerspectiveProjector();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly fallback: GameVisualFactory,
  ) {}

  createBackground(): Phaser.GameObjects.Container {
    if (!this.hasTexture('bg-sunset-sky') || !this.hasTexture('bg-city-silhouette')) {
      return this.fallback.createBackground();
    }

    const container = this.scene.add.container(0, 0);
    const sky = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + SUNSET_BACKGROUND_Y_OFFSET, 'bg-sunset-sky');
    sky.setDisplaySize(GAME_WIDTH, GAME_HEIGHT + Math.abs(SUNSET_BACKGROUND_Y_OFFSET) * 2);
    const skyline = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + CITY_BACKGROUND_Y_OFFSET, 'bg-city-silhouette');
    skyline.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    container.add([sky, skyline]);
    container.setDepth(0);
    return container;
  }

  createTrack(): Phaser.GameObjects.Container {
    const track = this.fallback.createTrack();
    return track;
  }

  createPlayer(): PlayerVisual {
    if (!this.hasTexture(gameAssetManifest.player.key)) {
      return this.fallback.createPlayer();
    }

    const fallbackPlayer = this.fallback.createPlayer();
    for (const part of fallbackPlayer.vehicleParts) {
      part.setVisible(false);
    }
    const sprite = this.scene.add.image(0, 0, gameAssetManifest.player.key);
    sprite.setDisplaySize(gameAssetManifest.player.display.width, gameAssetManifest.player.display.height);
    sprite.setOrigin(gameAssetManifest.player.origin.x, gameAssetManifest.player.origin.y);
    fallbackPlayer.container.add(sprite);
    fallbackPlayer.container.bringToTop(sprite);
    return fallbackPlayer;
  }

  createLaneItem(item: LaneItem): MovingVisualItem {
    const asset = getLaneItemAsset(item.kind);
    if (!this.hasTexture(asset.key)) {
      return this.fallback.createLaneItem(item);
    }

    const roadDistance = this.projector.spawnDistance;
    const roadProgress = this.projector.distanceToProgress(roadDistance);
    const projected = this.projector.projectLaneAtDistance(item.lane, roadDistance);
    const container = this.scene.add.container(projected.x, projected.y);
    const hitArea = this.scene.add.rectangle(0, -asset.display.height / 2, asset.display.width, asset.display.height, 0xffffff, 0);
    const shadow = this.scene.add.ellipse(
      0,
      0,
      asset.display.width * 1.18,
      Math.max(10, asset.display.height * 0.22),
      0x020817,
      ITEM_GROUND_SHADOW_ALPHA,
    );
    const sprite = this.scene.add.image(0, 0, asset.key);
    sprite.setDisplaySize(asset.display.width, asset.display.height);
    sprite.setOrigin(asset.origin.x, 1);
    container.add([shadow, sprite, hitArea]);
    container.setDepth(3);
    container.setScale(projected.scale * ITEM_VISUAL_SCALE);
    return { ...item, container, hitArea, roadDistance, roadProgress };
  }

  private hasTexture(key: string): boolean {
    return this.scene.textures.exists(key);
  }
}
