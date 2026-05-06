import { describe, expect, it } from 'vitest';
import {
  gameAssetManifest,
  getLaneItemAsset,
  playerAnimationFrames,
  playerSourceFrames,
} from '../src/game/assets/assetManifest';

describe('gameAssetManifest', () => {
  it('覆盖正式资源包需要的所有运行时图片', () => {
    expect(gameAssetManifest.player.key).toBe('player-hover-bike');
    expect(gameAssetManifest.player.path).toBe('./assets/game/player-hover-bike-sheet.png');
    expect('frame' in gameAssetManifest.player).toBe(false);
    expect(gameAssetManifest.player.display.width).toBeGreaterThanOrEqual(120);
    expect(gameAssetManifest.player.display.height).toBeGreaterThanOrEqual(150);
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

  it('直接使用原始摩托网格图，并用裁剪矩形排除网格线', () => {
    expect(playerSourceFrames).toHaveLength(21);
    expect(playerSourceFrames[0]).toEqual({ name: 'player-idle-0', x: 3, y: 3, width: 219, height: 219 });
    expect(playerSourceFrames[4]).toEqual({ name: 'player-idle-4', x: 888, y: 3, width: 219, height: 219 });
    expect(playerSourceFrames[5]).toEqual({ name: 'player-boost-0', x: 3, y: 223, width: 219, height: 219 });
    expect(playerSourceFrames[16]).toEqual({
      name: 'player-lane-left-3',
      x: 666,
      y: 444,
      width: 220,
      height: 219,
    });
    expect(playerSourceFrames[20]).toEqual({
      name: 'player-lane-right-3',
      x: 666,
      y: 665,
      width: 220,
      height: 219,
    });
  });

  it('左右变道动画保持 4 帧，减少横移动作拖沓感', () => {
    expect(playerAnimationFrames.laneLeft.frames).toHaveLength(4);
    expect(playerAnimationFrames.laneRight.frames).toHaveLength(4);
    expect(playerAnimationFrames.laneLeft.repeat).toBe(0);
    expect(playerAnimationFrames.laneRight.repeat).toBe(0);
  });

  it('所有运行时资源都来自 public/assets/game 并使用 PNG', () => {
    const assets = [
      gameAssetManifest.player,
      ...gameAssetManifest.backgrounds,
      ...gameAssetManifest.track,
      ...gameAssetManifest.items,
    ];

    for (const asset of assets) {
      expect(asset.path).toMatch(/^\.\/assets\/game\/.+\.png$/);
      expect(asset.key.length).toBeGreaterThan(0);
      expect(asset.display.width).toBeGreaterThan(0);
      expect(asset.display.height).toBeGreaterThan(0);
    }
  });

  it('可根据 LaneItem kind 找到稳定的图片资源', () => {
    expect(getLaneItemAsset('energy').key).toBe('item-energy');
    expect(getLaneItemAsset('lowFence').key).toBe('obstacle-low-fence');
    expect(getLaneItemAsset('hazard').path).toBe('./assets/game/obstacle-hazard.png');
  });

  it('道具足够清晰，障碍物以底部锚点贴合路面', () => {
    for (const kind of ['energy', 'shield', 'boost'] as const) {
      const asset = getLaneItemAsset(kind);
      expect(asset.display.width).toBeGreaterThanOrEqual(54);
      expect(asset.display.height).toBeGreaterThanOrEqual(54);
    }

    for (const kind of ['barrier', 'lowFence', 'beam', 'hazard'] as const) {
      const asset = getLaneItemAsset(kind);
      expect(asset.origin.y).toBe(1);
      expect(asset.display.width).toBeGreaterThanOrEqual(70);
      expect(asset.display.height).toBeGreaterThanOrEqual(62);
    }
  });
});
