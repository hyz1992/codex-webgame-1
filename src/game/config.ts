export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;
export const LANE_COUNT = 3;
export const LANE_WIDTH = 86;
export const BASE_SPEED = 260;
export const MAX_SPEED = 620;
export const BOOST_DURATION_MS = 3000;
export const BOOST_METER_MAX = 100;
export const ENERGY_SCORE = 10;
export const DISTANCE_SCORE_STEP = 1;

export const LANE_X = [GAME_WIDTH / 2 - LANE_WIDTH, GAME_WIDTH / 2, GAME_WIDTH / 2 + LANE_WIDTH] as const;

export const GESTURE_MIN_DISTANCE = 32;
export const GESTURE_MAX_MS = 420;
export const GESTURE_AXIS_RATIO = 1.35;
