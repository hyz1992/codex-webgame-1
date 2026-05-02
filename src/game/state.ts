import {
  BASE_SPEED,
  BOOST_DURATION_MS,
  BOOST_METER_MAX,
  DEBUG_MODE_SHIELDS,
  DEFAULT_SHIELDS,
  DISTANCE_SCORE_STEP,
  ENERGY_SCORE,
  MAX_SPEED,
} from './config';

export type DamageKind = 'normal' | 'fatal';

export interface RunState {
  hasStarted: boolean;
  score: number;
  distance: number;
  speed: number;
  shields: number;
  combo: number;
  bestCombo: number;
  boostMeter: number;
  isBoosting: boolean;
  boostMsRemaining: number;
  isPaused: boolean;
  isGameOver: boolean;
}

export interface CreateRunStateOptions {
  debug?: boolean;
}

export function createInitialRunState(options: CreateRunStateOptions = {}): RunState {
  return {
    hasStarted: false,
    score: 0,
    distance: 0,
    speed: BASE_SPEED,
    shields: options.debug ? DEBUG_MODE_SHIELDS : DEFAULT_SHIELDS,
    combo: 0,
    bestCombo: 0,
    boostMeter: 0,
    isBoosting: false,
    boostMsRemaining: 0,
    isPaused: false,
    isGameOver: false,
  };
}

export function startRun(state: RunState): RunState {
  return {
    ...state,
    hasStarted: true,
    isPaused: false,
  };
}

export function resetRun(_state: RunState, options: CreateRunStateOptions = {}): RunState {
  return createInitialRunState(options);
}

export function addDistance(state: RunState, distanceDelta: number): RunState {
  if (!state.hasStarted || state.isPaused || state.isGameOver) {
    return state;
  }

  const nextDistance = state.distance + distanceDelta;
  const speed = Math.min(MAX_SPEED, BASE_SPEED + nextDistance * 0.35);

  return {
    ...state,
    distance: nextDistance,
    speed,
    score: state.score + Math.floor(distanceDelta * DISTANCE_SCORE_STEP),
  };
}

export function collectEnergy(state: RunState): RunState {
  if (!state.hasStarted || state.isGameOver) {
    return state;
  }

  const combo = state.combo + 1;
  const bestCombo = Math.max(state.bestCombo, combo);
  const score = state.score + ENERGY_SCORE + combo;
  const boostMeter = state.boostMeter + 20;

  if (boostMeter >= BOOST_METER_MAX) {
    return {
      ...state,
      combo,
      bestCombo,
      score,
      boostMeter: 0,
      isBoosting: true,
      boostMsRemaining: BOOST_DURATION_MS,
    };
  }

  return {
    ...state,
    combo,
    bestCombo,
    score,
    boostMeter,
  };
}

export function damagePlayer(state: RunState, kind: DamageKind): RunState {
  if (!state.hasStarted || state.isGameOver) {
    return state;
  }

  if (kind === 'fatal') {
    return {
      ...state,
      combo: 0,
      isBoosting: false,
      boostMsRemaining: 0,
      isGameOver: true,
    };
  }

  if (state.shields > 0) {
    return {
      ...state,
      shields: state.shields - 1,
      combo: 0,
      isBoosting: false,
      boostMsRemaining: 0,
    };
  }

  return {
    ...state,
    combo: 0,
    isBoosting: false,
    boostMsRemaining: 0,
    isGameOver: true,
  };
}

export function collectShield(state: RunState): RunState {
  if (!state.hasStarted || state.isGameOver) {
    return state;
  }

  return {
    ...state,
    shields: Math.min(1, state.shields + 1),
  };
}

export function triggerBoost(state: RunState): RunState {
  if (!state.hasStarted || state.isGameOver) {
    return state;
  }

  return {
    ...state,
    boostMeter: 0,
    isBoosting: true,
    boostMsRemaining: BOOST_DURATION_MS,
  };
}

export function tickBoost(state: RunState, deltaMs: number): RunState {
  if (!state.isBoosting) {
    return state;
  }

  const boostMsRemaining = Math.max(0, state.boostMsRemaining - deltaMs);

  return {
    ...state,
    isBoosting: boostMsRemaining > 0,
    boostMsRemaining,
  };
}
