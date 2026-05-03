// 移动端设计画布宽度，PC 预览会按比例缩放。
export const GAME_WIDTH = 390;
// 移动端设计画布高度，接近常见竖屏手机比例。
export const GAME_HEIGHT = 844;
// 可切换的主车道数量。
export const LANE_COUNT = 3;
// 旧版 2D 车道坐标的间距，仍用于部分初始/兜底布局。
export const LANE_WIDTH = 86;
// 起步速度，单位是内部距离/秒。
export const BASE_SPEED = 260;
// 速度成长上限，防止后期难度无限上升。
export const MAX_SPEED = 620;
// 加速状态持续时间，单位毫秒。
export const BOOST_DURATION_MS = 3000;
// 加速能量槽满值。
export const BOOST_METER_MAX = 100;
// 能量拾取物提供的分数。
export const ENERGY_SCORE = 10;
// 距离转分数的步长，数值越小距离分增长越快。
export const DISTANCE_SCORE_STEP = 1;
// 普通模式初始护盾数。
export const DEFAULT_SHIELDS = 1;
// 调试模式初始护盾数，方便长时间观察跑道效果。
export const DEBUG_MODE_SHIELDS = 10000;

// 旧版 2D 车道中心点，当前主视角主要由 PerspectiveProjector 接管。
export const LANE_X = [GAME_WIDTH / 2 - LANE_WIDTH, GAME_WIDTH / 2, GAME_WIDTH / 2 + LANE_WIDTH] as const;

// 触发滑动手势所需的最小位移，单位像素。
export const GESTURE_MIN_DISTANCE = 32;
// 单次滑动手势允许的最长时间，单位毫秒。
export const GESTURE_MAX_MS = 420;
// 主轴位移与副轴位移的比例阈值，用来区分横滑和误触。
export const GESTURE_AXIS_RATIO = 1.35;
