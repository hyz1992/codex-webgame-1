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
  readonly horizonY = 86;
  readonly bottomY = GAME_HEIGHT + 120;
  readonly viewportHalfHeight = GAME_HEIGHT / 2;
  readonly verticalFovRadians = (56 * Math.PI) / 180;
  readonly focalLength = this.viewportHalfHeight / Math.tan(this.verticalFovRadians / 2);
  readonly nearDistance = 420;
  readonly cameraHeight = ((this.bottomY - this.horizonY) * this.nearDistance) / this.focalLength;
  readonly laneWorldSpacing = (126 * this.nearDistance) / this.focalLength;
  readonly nearScale = 1.3;
  readonly spawnProgress = 0.2;
  readonly spawnY = this.projectLaneAtProgress(1, this.spawnProgress).y;

  projectLane(lane: number, y: number): ProjectedLanePoint {
    return this.projectLaneAtProgress(lane, this.normalizedDepth(y));
  }

  projectLaneAtProgress(lane: number, progress: number): ProjectedLanePoint {
    const perspective = this.clamp01(progress);
    const distance = perspective === 0 ? Number.POSITIVE_INFINITY : this.nearDistance / perspective;
    const projectedGroundY = distance === Number.POSITIVE_INFINITY ? 0 : (this.cameraHeight * this.focalLength) / distance;
    const laneSpacing = distance === Number.POSITIVE_INFINITY ? 0 : (this.laneWorldSpacing * this.focalLength) / distance;
    const scale = this.nearScale * perspective;

    return {
      x: this.centerX + (lane - 1) * laneSpacing,
      y: this.horizonY + projectedGroundY,
      laneSpacing,
      scale,
      depth: 2 + perspective * 6,
      alpha: this.lerp(0.32, 1, perspective),
    };
  }

  trackPolygon(): TrackPolygon {
    const top = this.projectLane(1, this.horizonY);
    const bottom = this.projectLane(1, this.bottomY);

    return {
      topLeft: { x: this.centerX - top.laneSpacing, y: this.horizonY },
      topRight: { x: this.centerX + top.laneSpacing, y: this.horizonY },
      bottomRight: { x: this.centerX + bottom.laneSpacing * 2.08, y: this.bottomY },
      bottomLeft: { x: this.centerX - bottom.laneSpacing * 2.08, y: this.bottomY },
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
    return this.normalizedDepth(y);
  }

  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t;
  }
}
