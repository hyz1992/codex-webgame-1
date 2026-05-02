import Phaser from 'phaser';
import { gameAssetManifest, getLaneItemAsset } from '../assets/assetManifest';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { LaneItem } from '../spawn/patterns';
import { GameVisualFactory, type MovingVisualItem, type PlayerVisual } from './GameVisualFactory';
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
    const sky = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-sunset-sky');
    sky.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    const skyline = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-city-silhouette');
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
    fallbackPlayer.body.setVisible(false);
    fallbackPlayer.core.setVisible(false);
    fallbackPlayer.trail.setVisible(false);
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

    const projected = this.projector.projectLane(item.lane, this.projector.spawnY);
    const container = this.scene.add.container(projected.x, projected.y);
    const hitArea = this.scene.add.rectangle(0, 0, asset.display.width, asset.display.height, 0xffffff, 0);
    const sprite = this.scene.add.image(0, 0, asset.key);
    sprite.setDisplaySize(asset.display.width, asset.display.height);
    sprite.setOrigin(asset.origin.x, asset.origin.y);
    container.add([sprite, hitArea]);
    container.setDepth(3);
    container.setScale(projected.scale);
    return { ...item, container, hitArea };
  }

  private hasTexture(key: string): boolean {
    return this.scene.textures.exists(key);
  }
}
