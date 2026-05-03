import { describe, expect, it, vi } from 'vitest';
import { getAllGameAssets } from '../src/game/assets/assetManifest';
import { preloadGameAssets } from '../src/game/assets/preloadGameAssets';

describe('preloadGameAssets', () => {
  it('把 manifest 中的图片和序列帧资源注册到 Phaser loader', () => {
    const image = vi.fn();
    const spritesheet = vi.fn();
    const scene = { load: { image, spritesheet } };

    preloadGameAssets(scene);

    expect(image).toHaveBeenCalledTimes(getAllGameAssets().length - 1);
    expect(spritesheet).toHaveBeenCalledTimes(1);
    expect(spritesheet).toHaveBeenCalledWith('player-hover-bike', '/assets/game/player-hover-bike-sheet.png', {
      frameWidth: 384,
      frameHeight: 480,
    });
    expect(image).toHaveBeenCalledWith('obstacle-hazard', '/assets/game/obstacle-hazard.png');
  });
});
