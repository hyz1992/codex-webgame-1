export const PLAYER_RUN_BOB_PIXELS = 4;
export const PLAYER_BOOST_BOB_PIXELS = 6;
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
