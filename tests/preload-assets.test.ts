import { describe, expect, it, vi } from 'vitest';
import { getAllGameAssets } from '../src/game/assets/assetManifest';
import { preloadGameAssets } from '../src/game/assets/preloadGameAssets';

describe('preloadGameAssets', () => {
  it('把 manifest 中的运行时图片注册到 Phaser loader', () => {
    const image = vi.fn();
    const spritesheet = vi.fn();
    const scene = { load: { image, spritesheet } };

    preloadGameAssets(scene);

    expect(image).toHaveBeenCalledTimes(getAllGameAssets().length);
    expect(spritesheet).not.toHaveBeenCalled();
    expect(image).toHaveBeenCalledWith('player-hover-bike', '/assets/game/player-hover-bike-sheet.png');
    expect(image).toHaveBeenCalledWith('obstacle-hazard', '/assets/game/obstacle-hazard.png');
  });
});
