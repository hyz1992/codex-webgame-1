import { describe, expect, it } from 'vitest';
import { gameAssetManifest, getLaneItemAsset } from '../src/game/assets/assetManifest';

describe('gameAssetManifest', () => {
  it('覆盖首批正式资产包要求的所有运行时图片', () => {
    expect(gameAssetManifest.player.key).toBe('player-seed');
    expect(gameAssetManifest.backgrounds.map((asset) => asset.key)).toEqual(['bg-sunset-sky', 'bg-city-silhouette']);
    expect(gameAssetManifest.track.map((asset) => asset.key)).toEqual(['track-edge-glow', 'track-speed-grid']);
    expect(gameAssetManifest.items.map((asset) => asset.laneItemKind)).toEqual([
      'energy',
      'shield',
      'boost',
      'barrier',
      'lowFence',
      'beam',
      'hazard',
    ]);
  });

  it('所有运行时资源都来自 public/assets/game 并使用 PNG', () => {
    const assets = [
      gameAssetManifest.player,
      ...gameAssetManifest.backgrounds,
      ...gameAssetManifest.track,
      ...gameAssetManifest.items,
    ];

    for (const asset of assets) {
      expect(asset.path).toMatch(/^\/assets\/game\/.+\.png$/);
      expect(asset.key.length).toBeGreaterThan(0);
      expect(asset.display.width).toBeGreaterThan(0);
      expect(asset.display.height).toBeGreaterThan(0);
    }
  });

  it('可根据 LaneItem kind 找到稳定的图片资产', () => {
    expect(getLaneItemAsset('energy').key).toBe('item-energy');
    expect(getLaneItemAsset('lowFence').key).toBe('obstacle-low-fence');
    expect(getLaneItemAsset('hazard').path).toBe('/assets/game/obstacle-hazard.png');
  });
});
