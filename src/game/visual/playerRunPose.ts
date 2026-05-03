// 普通行驶时主角上下浮动幅度，单位像素。
export const PLAYER_RUN_BOB_PIXELS = 4;
// 加速时主角上下浮动幅度，略大一点增强速度感。
export const PLAYER_BOOST_BOB_PIXELS = 6;
// 一次上下浮动循环的时长，单位毫秒。
export const PLAYER_RUN_CYCLE_MS = 420;

export type PlayerRunMotion = 'cruising';

export interface PlayerRunPose {
  yOffset: number;
  scalePulse: number;
}

export function playerRunPose(
  elapsedMs: number,
  isRunning: boolean,
  isBoosting: boolean,
  _motion: PlayerRunMotion = 'cruising',
  _motionElapsedMs = 0,
): PlayerRunPose {
  if (!isRunning) {
    return { yOffset: 0, scalePulse: 1 };
  }

  const amplitude = isBoosting ? PLAYER_BOOST_BOB_PIXELS : PLAYER_RUN_BOB_PIXELS;
  const phase = (elapsedMs / PLAYER_RUN_CYCLE_MS) * Math.PI * 2;
  const stride = Math.sin(phase);

  return {
    yOffset: stride * amplitude,
    scalePulse: 1 + Math.abs(stride) * 0.018,
  };
}
