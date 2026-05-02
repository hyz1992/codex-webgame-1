export const PLAYER_RUN_BOB_PIXELS = 4;
export const PLAYER_BOOST_BOB_PIXELS = 6;
export const PLAYER_RUN_CYCLE_MS = 420;
export const PLAYER_JUMP_HEIGHT_PIXELS = 54;
export const PLAYER_JUMP_DURATION_MS = 320;

export type PlayerRunMotion = 'running' | 'jumping' | 'sliding';

export interface PlayerRunPose {
  yOffset: number;
  scalePulse: number;
}

export function playerRunPose(
  elapsedMs: number,
  isRunning: boolean,
  isBoosting: boolean,
  motion: PlayerRunMotion = 'running',
  motionElapsedMs = 0,
): PlayerRunPose {
  if (!isRunning) {
    return { yOffset: 0, scalePulse: 1 };
  }

  if (motion === 'jumping') {
    const progress = Math.max(0, Math.min(1, motionElapsedMs / PLAYER_JUMP_DURATION_MS));
    const jumpLift = -Math.sin(progress * Math.PI) * PLAYER_JUMP_HEIGHT_PIXELS;
    return {
      yOffset: Math.abs(jumpLift) < 0.001 ? 0 : jumpLift,
      scalePulse: 1 - Math.sin(progress * Math.PI) * 0.04,
    };
  }

  const amplitude = isBoosting ? PLAYER_BOOST_BOB_PIXELS : PLAYER_RUN_BOB_PIXELS;
  const phase = (elapsedMs / PLAYER_RUN_CYCLE_MS) * Math.PI * 2;
  const stride = Math.sin(phase);

  return {
    yOffset: stride * amplitude,
    scalePulse: 1 + Math.abs(stride) * 0.018,
  };
}
