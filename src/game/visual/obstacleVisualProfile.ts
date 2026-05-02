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
    height: 64,
    hitArea: {
      y: -14,
      width: 68,
      height: 30,
    },
  },
  beam: {
    width: 84,
    height: 72,
    hitArea: {
      y: -30,
      width: 82,
      height: 28,
    },
  },
} as const satisfies Partial<Record<LaneItem['kind'], ObstacleVisualProfile>>;

export function getObstacleVisualProfile(kind: LaneItem['kind']): ObstacleVisualProfile | undefined {
  return obstacleVisualProfiles[kind as keyof typeof obstacleVisualProfiles];
}

export function usesProgrammaticObstacleVisual(kind: LaneItem['kind']): boolean {
  void kind;
  return false;
}
