export type ObstacleKind = 'barrier' | 'lowFence' | 'beam' | 'hazard';
export type PickupKind = 'energy' | 'shield' | 'boost';

export interface LaneItem {
  kind: ObstacleKind | PickupKind;
  lane: number;
}

export interface SpawnPattern {
  hazards: LaneItem[];
  pickups: LaneItem[];
  safeLanes: number[];
}
