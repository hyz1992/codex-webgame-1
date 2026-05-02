import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export interface ProjectedLanePoint {
  x: number;
  y: number;
  laneSpacing: number;
  scale: number;
  depth: number;
  alpha: number;
}

export interface TrackPolygon {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
}

export class PerspectiveProjector {
  readonly centerX = GAME_WIDTH / 2;
  readonly horizonY = 72;
  readonly spawnY = 156;
  readonly bottomY = GAME_HEIGHT + 132;
  readonly farLaneSpacing = 0;
  readonly nearLaneSpacing = 128;
  readonly farScale = 0.18;
  readonly nearScale = 1.14;

  projectLane(lane: number, y: number): ProjectedLanePoint {
    const perspective = this.perspectiveAmount(y);
    const laneSpacing = this.lerp(this.farLaneSpacing, this.nearLaneSpacing, perspective);
    const scale = this.lerp(this.farScale, this.nearScale, perspective);

    return {
      x: this.centerX + (lane - 1) * laneSpacing,
      y,
      laneSpacing,
      scale,
      depth: 2 + perspective * 6,
      alpha: this.lerp(0.38, 1, perspective),
    };
  }

  trackPolygon(): TrackPolygon {
    const top = this.projectLane(1, this.horizonY);
    const bottom = this.projectLane(1, this.bottomY);

    return {
      topLeft: { x: this.centerX - top.laneSpacing, y: this.horizonY },
      topRight: { x: this.centerX + top.laneSpacing, y: this.horizonY },
      bottomRight: { x: this.centerX + bottom.laneSpacing * 2.05, y: this.bottomY },
      bottomLeft: { x: this.centerX - bottom.laneSpacing * 2.05, y: this.bottomY },
    };
  }

  trackEdgeX(edge: number, y: number): number {
    const projected = this.projectLane(1, y);
    return this.centerX + edge * projected.laneSpacing;
  }

  normalizedDepth(y: number): number {
    return Math.max(0, Math.min(1, (y - this.horizonY) / (this.bottomY - this.horizonY)));
  }

  perspectiveAmount(y: number): number {
    return Math.pow(this.normalizedDepth(y), 0.55);
  }

  private lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t;
  }
}
