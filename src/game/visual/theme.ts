import type { LaneItem } from '../spawn/patterns';

export interface LaneItemVisual {
  fill: `0x${string}`;
  glow: `0x${string}`;
  shape: 'block' | 'low-fence' | 'beam' | 'rift' | 'orb' | 'hex' | 'crystal';
}

export const neonSunsetTheme = {
  colors: {
    skyTop: 0xff9f5a,
    skyMid: 0xb45cff,
    night: 0x101820,
    track: 0x1c2b35,
    laneCyan: 0x18f7ff,
    lanePurple: 0x8b5cf6,
    playerCore: 0xf6ff5d,
    playerBody: 0x18f7ff,
    text: 0xf8fafc,
  },
  track: {
    width: 290,
    laneGlowWidth: 4,
    gridAlpha: 0.18,
    speedLineAlpha: 0.34,
  },
  player: {
    width: 62,
    height: 66,
    radius: 12,
    trailLength: 66,
    hitbox: {
      width: 40,
      height: 48,
    },
  },
  motion: {
    laneTweenMs: 140,
    pickupMs: 180,
    shieldMs: 420,
    impactShakeMs: 140,
    gameOverMs: 260,
  },
} as const;

const laneItemVisuals: Record<LaneItem['kind'], LaneItemVisual> = {
  barrier: { fill: '0xf4a261', glow: '0xffb86b', shape: 'block' },
  lowFence: { fill: '0xff6f59', glow: '0xff9f5a', shape: 'low-fence' },
  beam: { fill: '0x8b5cf6', glow: '0xb78cff', shape: 'beam' },
  hazard: { fill: '0xef476f', glow: '0xff2bd6', shape: 'rift' },
  energy: { fill: '0x63d2ff', glow: '0xf6ff5d', shape: 'orb' },
  shield: { fill: '0x7ee787', glow: '0xa7f3d0', shape: 'hex' },
  boost: { fill: '0xb78cff', glow: '0x18f7ff', shape: 'crystal' },
};

export function getLaneItemVisual(kind: LaneItem['kind']): LaneItemVisual {
  return laneItemVisuals[kind];
}

export function hexToCss(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`;
}
