import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  LANE_WORLD_SPACING_AT_NEAR,
  PROJECTED_NEAR_SCALE,
  ROAD_REFERENCE_FAR_PROGRESS,
  ROADSIDE_LAMP_LANE_OFFSET,
  TRACK_BOTTOM_EDGE_MULTIPLIER,
  TRACK_HORIZON_Y,
  TRACK_VISUAL_HORIZON_PROGRESS,
} from './layout';

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

export interface RoadsideMarkerPoint extends TrackLanePoint {
  distance: number;
  scale: number;
}

export class PerspectiveProjector {
  // 画面水平中心，所有车道投影都围绕它展开。
  readonly centerX = GAME_WIDTH / 2;
  // 跑道远端所在的屏幕高度。
  readonly horizonY = TRACK_HORIZON_Y;
  // 跑道近端会略超出屏幕底部，保证物件滑出时不突然消失。
  readonly bottomY = GAME_HEIGHT + 28;
  // 伪 3D 相机计算使用的半屏高度。
  readonly viewportHalfHeight = GAME_HEIGHT / 2;
  // 垂直视场角，越大透视越夸张。
  readonly verticalFovRadians = (56 * Math.PI) / 180;
  // 由视场角推导出的焦距，控制近大远小的强度。
  readonly focalLength = this.viewportHalfHeight / Math.tan(this.verticalFovRadians / 2);
  // 玩家附近的参考世界距离，越小近处透视越强。
  readonly nearDistance = 420;
  // 相机离道路平面的虚拟高度。
  readonly cameraHeight = ((this.bottomY - this.horizonY) * this.nearDistance) / this.focalLength;
  // 单车道世界宽度，最终会按距离投影成屏幕像素。
  readonly laneWorldSpacing = (LANE_WORLD_SPACING_AT_NEAR * this.nearDistance) / this.focalLength;
  // 近处物件缩放基准。
  readonly nearScale = PROJECTED_NEAR_SCALE;
  // 物件离开屏幕底部后的进度，保证继续滑出而不是贴边消失。
  readonly exitProgress = 1.18;
  // 障碍物和拾取物生成进度，比道路尽头更近，避免太小看不清。
  readonly spawnProgress = 0.075;
  // 路灯和车道虚线的生成进度，需要更靠近远端以避免凭空出现。
  readonly markerSpawnProgress = Math.max(ROAD_REFERENCE_FAR_PROGRESS, TRACK_VISUAL_HORIZON_PROGRESS);
  // 物件离开屏幕时对应的世界距离。
  readonly nearExitDistance = this.progressToDistance(this.exitProgress);
  // 障碍物和拾取物生成时对应的世界距离。
  readonly spawnDistance = this.progressToDistance(this.spawnProgress);
  // 路灯和车道虚线循环时对应的最远世界距离。
  readonly markerSpawnDistance = this.progressToDistance(this.markerSpawnProgress);
  // 屏幕像素速度到道路世界距离的换算比例。
  readonly worldDistancePerScreenPixel =
    (this.spawnDistance - this.nearExitDistance) /
    ((this.exitProgress - this.spawnProgress) * (this.bottomY - this.horizonY));
  // 障碍物初次出现时的屏幕 y 坐标。
  readonly spawnY = this.projectLaneAtProgress(1, this.spawnProgress).y;

  projectLane(lane: number, y: number): ProjectedLanePoint {
    return this.projectLaneAtProgress(lane, this.normalizedDepth(y));
  }

  projectLaneAtProgress(lane: number, progress: number): ProjectedLanePoint {
    const perspective = Math.max(0, Math.min(this.exitProgress, progress));
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

  projectLaneAtDistance(lane: number, distance: number): ProjectedLanePoint {
    return this.projectLaneAtProgress(lane, this.distanceToProgress(distance));
  }

  progressToDistance(progress: number): number {
    return this.nearDistance / Math.max(0.0001, progress);
  }

  distanceToProgress(distance: number): number {
    return this.nearDistance / Math.max(1, distance);
  }

  roadTravelDistanceForPixels(pixels: number): number {
    return pixels * this.worldDistancePerScreenPixel;
  }

  trackPolygon(): TrackPolygon {
    const top = this.projectLaneAtProgress(1, TRACK_VISUAL_HORIZON_PROGRESS);
    const bottom = this.projectLane(1, this.bottomY);

    return {
      topLeft: { x: this.centerX - top.laneSpacing * TRACK_BOTTOM_EDGE_MULTIPLIER, y: this.horizonY },
      topRight: { x: this.centerX + top.laneSpacing * TRACK_BOTTOM_EDGE_MULTIPLIER, y: this.horizonY },
      bottomRight: { x: this.centerX + bottom.laneSpacing * TRACK_BOTTOM_EDGE_MULTIPLIER, y: this.bottomY },
      bottomLeft: { x: this.centerX - bottom.laneSpacing * TRACK_BOTTOM_EDGE_MULTIPLIER, y: this.bottomY },
    };
  }

  trackEdgeX(edge: number, y: number): number {
    const projected = this.projectLaneAtProgress(1, this.visualTrackProgress(this.normalizedDepth(y)));
    return this.centerX + edge * projected.laneSpacing;
  }

  trackLanePoints(edge: number, segments: number): TrackLanePoint[] {
    const points: TrackLanePoint[] = [];
    const steps = Math.max(1, segments);

    for (let index = 0; index <= steps; index += 1) {
      const progress = index / steps;
      const projected = this.projectLaneAtProgress(1, this.visualTrackProgress(progress));
      points.push({
        progress,
        x: this.centerX + edge * projected.laneSpacing,
        y: progress === 0 ? this.horizonY : projected.y,
      });
    }

    return points;
  }

  roadsideMarkerPoints(side: -1 | 1, count: number): RoadsideMarkerPoint[] {
    return this.distanceMarkerPoints(side * ROADSIDE_LAMP_LANE_OFFSET, count);
  }

  laneDashMarkerPoints(edge: number, count: number): RoadsideMarkerPoint[] {
    return this.distanceMarkerPoints(edge, count);
  }

  private distanceMarkerPoints(edge: number, count: number): RoadsideMarkerPoint[] {
    const points: RoadsideMarkerPoint[] = [];
    const total = Math.max(1, count);
    const spacing = (this.markerSpawnDistance - this.nearExitDistance) / total;

    for (let index = 0; index < total; index += 1) {
      const distance = this.markerSpawnDistance - index * spacing;
      const progress = this.distanceToProgress(distance);
      const projected = this.projectLaneAtDistance(1, distance);
      points.push({
        progress,
        distance,
        x: this.centerX + edge * projected.laneSpacing,
        y: projected.y,
        scale: projected.scale,
      });
    }

    return points;
  }

  advanceRoadDistance(distance: number, travelDistance: number, farDistance = this.spawnDistance): number {
    const range = farDistance - this.nearExitDistance;
    let nextDistance = distance - travelDistance;

    while (nextDistance < this.nearExitDistance) {
      nextDistance += range;
    }

    return nextDistance;
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

  private visualTrackProgress(progress: number): number {
    return TRACK_VISUAL_HORIZON_PROGRESS + (1 - TRACK_VISUAL_HORIZON_PROGRESS) * progress;
  }

  private lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t;
  }

}
