import type { LaneItem } from '../spawn/patterns';

export const MIN_OBSTACLE_VISUAL_HEIGHT = 52;

export interface ObstacleVisualProfile {
  width: number;
  height: number;
  hitArea: {
    y: number;
    width: number;
    height: number;
  };
}

const obstacleVisualProfiles = {
  lowFence: {
    width: 76,
    height: 58,
    hitArea: {
      y: -14,
      width: 68,
      height: 30,
    },
  },
  beam: {
    width: 124,
    height: 68,
    hitArea: {
      y: -30,
      width: 122,
      height: 28,
    },
  },
} as const satisfies Partial<Record<LaneItem['kind'], ObstacleVisualProfile>>;

export function getObstacleVisualProfile(kind: LaneItem['kind']): ObstacleVisualProfile | undefined {
  return obstacleVisualProfiles[kind as keyof typeof obstacleVisualProfiles];
}

export function usesProgrammaticObstacleVisual(kind: LaneItem['kind']): boolean {
  return getObstacleVisualProfile(kind) !== undefined;
}
