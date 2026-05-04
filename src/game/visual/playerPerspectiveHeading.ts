// 主角在左右车道时朝向道路消失点的最大旋转角，避免贴边时转得过头。
export const PLAYER_HEADING_MAX_DEGREES = 9;

export interface PlayerPerspectiveHeadingInput {
  playerX: number;
  playerY: number;
  vanishX: number;
  vanishY: number;
  maxDegrees?: number;
}

export function calculatePlayerPerspectiveHeading({
  playerX,
  playerY,
  vanishX,
  vanishY,
  maxDegrees = PLAYER_HEADING_MAX_DEGREES,
}: PlayerPerspectiveHeadingInput): number {
  const maxRadians = (maxDegrees * Math.PI) / 180;
  const dx = vanishX - playerX;
  const dy = Math.max(1, playerY - vanishY);
  const heading = Math.atan2(dx, dy);

  return Math.max(-maxRadians, Math.min(maxRadians, heading));
}
