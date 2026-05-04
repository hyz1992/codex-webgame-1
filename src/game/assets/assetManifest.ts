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
    frame: { width: 384, height: 480 },
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

export const playerAnimationFrames = {
  idle: { start: 0, end: 4, frameRate: 7, repeat: -1 },
  boost: { start: 5, end: 12, frameRate: 14, repeat: -1 },
  laneLeft: { start: 13, end: 18, frameRate: 24, repeat: 0 },
  laneRight: { start: 19, end: 24, frameRate: 24, repeat: 0 },
} as const;

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
