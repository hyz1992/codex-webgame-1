import { getAllGameAssets } from './assetManifest';

export interface ImageLoaderScene {
  load: {
    image: (key: string, url: string) => void;
  };
}

export function preloadGameAssets(scene: ImageLoaderScene): void {
  for (const asset of getAllGameAssets()) {
    scene.load.image(asset.key, asset.path);
  }
}
