import type { LaneItem } from '../spawn/patterns';

export type GameAssetKind = 'player' | 'background' | 'track' | 'item';

export interface GameAssetDefinition {
  key: string;
  path: `/assets/game/${string}.png`;
  display: {
    width: number;
    height: number;
  };
  origin: {
    x: number;
    y: number;
  };
  frame?: {
    width: number;
    height: number;
  };
  kind: GameAssetKind;
}

export interface LaneItemAssetDefinition extends GameAssetDefinition {
  laneItemKind: LaneItem['kind'];
}

export const gameAssetManifest = {
  player: {
    key: 'player-hover-bike',
    path: '/assets/game/player-hover-bike-sheet.png',
    display: { width: 128, height: 160 },
    origin: { x: 0.5, y: 0.86 },
    kind: 'player',
  },
  backgrounds: [
    {
      key: 'bg-sunset-sky',
      path: '/assets/game/bg-sunset-sky.png',
      display: { width: 390, height: 844 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'background',
    },
    {
      key: 'bg-city-silhouette',
      path: '/assets/game/bg-city-silhouette.png',
      display: { width: 390, height: 844 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'background',
    },
  ],
  track: [
    {
      key: 'track-edge-glow',
      path: '/assets/game/track-edge-glow.png',
      display: { width: 64, height: 844 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'track',
    },
    {
      key: 'track-speed-grid',
      path: '/assets/game/track-speed-grid.png',
      display: { width: 290, height: 256 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'track',
    },
  ],
  items: [
    {
      key: 'item-energy',
      path: '/assets/game/item-energy.png',
      display: { width: 34, height: 34 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'energy',
    },
    {
      key: 'item-shield',
      path: '/assets/game/item-shield.png',
      display: { width: 40, height: 40 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'shield',
    },
    {
      key: 'item-boost',
      path: '/assets/game/item-boost.png',
      display: { width: 40, height: 40 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'boost',
    },
    {
      key: 'obstacle-barrier',
      path: '/assets/game/obstacle-barrier.png',
      display: { width: 50, height: 46 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'barrier',
    },
    {
      key: 'obstacle-low-fence',
      path: '/assets/game/obstacle-low-fence.png',
      display: { width: 76, height: 64 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'lowFence',
    },
    {
      key: 'obstacle-beam',
      path: '/assets/game/obstacle-beam.png',
      display: { width: 84, height: 72 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'beam',
    },
    {
      key: 'obstacle-hazard',
      path: '/assets/game/obstacle-hazard.png',
      display: { width: 54, height: 54 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'hazard',
    },
  ],
} as const satisfies {
  player: GameAssetDefinition;
  backgrounds: readonly GameAssetDefinition[];
  track: readonly GameAssetDefinition[];
  items: readonly LaneItemAssetDefinition[];
};

export type GameAssetManifest = typeof gameAssetManifest;

export const playerAnimationKeys = {
  idle: 'player-hover-bike-idle',
  boost: 'player-hover-bike-boost',
  laneLeft: 'player-hover-bike-lane-left',
  laneRight: 'player-hover-bike-lane-right',
} as const;

// 原始摩托图的每一列有效区域，x 已跳过蓝色网格线宽度。
const playerGridColumns = [
  { x: 3, width: 219 },
  { x: 224, width: 219 },
  { x: 445, width: 219 },
  { x: 666, width: 220 },
  { x: 888, width: 219 },
  { x: 1109, width: 219 },
  { x: 1330, width: 220 },
  { x: 1552, width: 219 },
] as const;

// 原始摩托图的每一行动画区域，y 已跳过蓝色网格线宽度。
const playerGridRows = [
  { y: 3, height: 219 },
  { y: 223, height: 219 },
  { y: 444, height: 219 },
  { y: 665, height: 219 },
] as const;

export const playerAnimationFrames = {
  idle: {
    frames: ['player-idle-0', 'player-idle-1', 'player-idle-2', 'player-idle-3', 'player-idle-4'],
    frameRate: 7,
    repeat: -1,
  },
  boost: {
    frames: [
      'player-boost-0',
      'player-boost-1',
      'player-boost-2',
      'player-boost-3',
      'player-boost-4',
      'player-boost-5',
      'player-boost-6',
      'player-boost-7',
    ],
    frameRate: 14,
    repeat: -1,
  },
  laneLeft: {
    frames: [
      'player-lane-left-0',
      'player-lane-left-1',
      'player-lane-left-2',
      'player-lane-left-3',
      'player-lane-left-4',
      'player-lane-left-5',
    ],
    frameRate: 24,
    repeat: 0,
  },
  laneRight: {
    frames: [
      'player-lane-right-0',
      'player-lane-right-1',
      'player-lane-right-2',
      'player-lane-right-3',
      'player-lane-right-4',
      'player-lane-right-5',
    ],
    frameRate: 24,
    repeat: 0,
  },
} as const;

// Phaser 运行时从原图注册这些裁剪帧，图片文件本身保持用户提供的原始版本。
export const playerSourceFrames = [
  ...playerAnimationFrames.idle.frames.map((name, index) => ({
    name,
    ...playerGridColumns[index],
    ...playerGridRows[0],
  })),
  ...playerAnimationFrames.boost.frames.map((name, index) => ({
    name,
    ...playerGridColumns[index],
    ...playerGridRows[1],
  })),
  ...playerAnimationFrames.laneLeft.frames.map((name, index) => ({
    name,
    ...playerGridColumns[index],
    ...playerGridRows[2],
  })),
  ...playerAnimationFrames.laneRight.frames.map((name, index) => ({
    name,
    ...playerGridColumns[index],
    ...playerGridRows[3],
  })),
] as const;

export function getAllGameAssets(): GameAssetDefinition[] {
  return [
    gameAssetManifest.player,
    ...gameAssetManifest.backgrounds,
    ...gameAssetManifest.track,
    ...gameAssetManifest.items,
  ];
}

export function getLaneItemAsset(kind: LaneItem['kind']): LaneItemAssetDefinition {
  const asset = gameAssetManifest.items.find((item) => item.laneItemKind === kind);
  if (!asset) {
    throw new Error(`Missing lane item asset for ${kind}`);
  }
  return asset;
}
