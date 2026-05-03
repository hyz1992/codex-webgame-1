import { getAllGameAssets } from './assetManifest';

export interface ImageLoaderScene {
  load: {
    image: (key: string, url: string) => void;
    spritesheet: (key: string, url: string, config: { frameWidth: number; frameHeight: number }) => void;
  };
}

export function preloadGameAssets(scene: ImageLoaderScene): void {
  for (const asset of getAllGameAssets()) {
    if (asset.frame) {
      scene.load.spritesheet(asset.key, asset.path, {
        frameWidth: asset.frame.width,
        frameHeight: asset.frame.height,
      });
      continue;
    }

    scene.load.image(asset.key, asset.path);
  }
}
