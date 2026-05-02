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

export interface TrackLanePoint {
  progress: number;
  x: number;
  y: number;
}

export class PerspectiveProjector {
  readonly centerX = GAME_WIDTH / 2;
  readonly horizonY = 72;
  readonly spawnY = 156;
  readonly bottomY = GAME_HEIGHT + 132;
  readonly spawnProgress = (this.spawnY - this.horizonY) / (this.bottomY - this.horizonY);
  readonly farLaneSpacing = 0;
  readonly nearLaneSpacing = 128;
  readonly farScale = 0.1;
  readonly nearScale = 1.14;

  projectLane(lane: number, y: number): ProjectedLanePoint {
    return this.projectLaneAtProgress(lane, this.normalizedDepth(y));
  }

  projectLaneAtProgress(lane: number, progress: number): ProjectedLanePoint {
    const t = this.clamp01(progress);
    const y = this.lerp(this.horizonY, this.bottomY, t);
    const perspective = this.perspectiveAmountAtProgress(t);
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
    const projected = this.projectLaneAtProgress(1, this.normalizedDepth(y));
    return this.centerX + edge * projected.laneSpacing;
  }

  trackLanePoints(edge: number, segments: number): TrackLanePoint[] {
    const points: TrackLanePoint[] = [];
    const steps = Math.max(1, segments);

    for (let index = 0; index <= steps; index += 1) {
      const progress = index / steps;
      const projected = this.projectLaneAtProgress(1, progress);
      points.push({
        progress,
        x: this.centerX + edge * projected.laneSpacing,
        y: projected.y,
      });
    }

    return points;
  }

  normalizedDepth(y: number): number {
    return this.clamp01((y - this.horizonY) / (this.bottomY - this.horizonY));
  }

  perspectiveAmount(y: number): number {
    return this.perspectiveAmountAtProgress(this.normalizedDepth(y));
  }

  private perspectiveAmountAtProgress(progress: number): number {
    return Math.pow(this.clamp01(progress), 0.55);
  }

  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t;
  }
}
