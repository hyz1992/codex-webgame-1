import { describe, expect, it, vi } from 'vitest';
import { getAllGameAssets } from '../src/game/assets/assetManifest';
import { preloadGameAssets } from '../src/game/assets/preloadGameAssets';

describe('preloadGameAssets', () => {
  it('把 manifest 中的每个资源注册到 Phaser loader', () => {
    const image = vi.fn();
    const scene = { load: { image } };

    preloadGameAssets(scene);

    expect(image).toHaveBeenCalledTimes(getAllGameAssets().length);
    expect(image).toHaveBeenCalledWith('player-hover-bike', '/assets/game/player-hover-bike.png');
    expect(image).toHaveBeenCalledWith('obstacle-hazard', '/assets/game/obstacle-hazard.png');
  });
});
