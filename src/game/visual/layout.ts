import { GAME_HEIGHT } from '../config';

// 整体场景上移量：同时影响跑道、城市和落日的纵向基准。
export const SCENE_ALIGNMENT_Y_OFFSET = -36;
// 主角在屏幕中的视觉锚点，越小越靠上，越大越靠近屏幕底部。
export const PLAYER_ANCHOR_Y = GAME_HEIGHT - 82;
// 近处单车道的世界宽度基准，会影响整条道路和物件横向透视。
export const LANE_WORLD_SPACING_AT_NEAR = 224;
// 三股主车道的左右外边界，单位是车道中心间距。
export const MAIN_ROAD_EDGE_LANE_OFFSET = 1.5;
// 中间两条虚线相对中心线的偏移；大于 0.5 会让中间车道视觉上略宽。
export const LANE_SEPARATOR_OFFSET = 0.58;
// 主车道外侧预留的缓冲带宽度，1 / 3 表示三分之一车道。
export const ROAD_BUFFER_LANE_OFFSET = 1 / 3;
// 道路最外缘线位置，等于主车道边界加缓冲带。
export const OUTER_ROAD_EDGE_LANE_OFFSET = MAIN_ROAD_EDGE_LANE_OFFSET + ROAD_BUFFER_LANE_OFFSET;
// 路灯所在横向位置，目前贴在道路最外缘线上。
export const ROADSIDE_LAMP_LANE_OFFSET = OUTER_ROAD_EDGE_LANE_OFFSET;
// 近端桥面填充宽度倍率，通常跟道路最外缘保持一致。
export const TRACK_BOTTOM_EDGE_MULTIPLIER = OUTER_ROAD_EDGE_LANE_OFFSET;
// 跑道远端开口宽度：数值越小越细，0 会变成完全尖角。
export const TRACK_ENDPOINT_WIDTH_PROGRESS = 0.008;
// 投影内部使用的远端进度，保留别名便于旧测试和投影代码阅读。
export const TRACK_VISUAL_HORIZON_PROGRESS = TRACK_ENDPOINT_WIDTH_PROGRESS;
// 路灯和车道虚线的最远生成进度；越小越接近桥面尽头。
export const ROAD_REFERENCE_FAR_PROGRESS = 0.025;
// 近处物件和主角的投影缩放基准，越大镜头越贴近地面。
export const PROJECTED_NEAR_SCALE = 2.28;
// 障碍物和拾取物的额外视觉缩放，碰撞尺寸不会直接跟着变。
export const ITEM_VISUAL_SCALE = 1.2;
// 地面阴影透明度，用来把道具/障碍物压回桥面。
export const ITEM_GROUND_SHADOW_ALPHA = 0.22;

// 跑道远端的基础高度，默认取屏幕中线。
export const BASE_TRACK_HORIZON_Y = Math.round(GAME_HEIGHT * 0.5);
// 城市背景的独立纵向偏移；负数上移，正数下移。
export const BASE_CITY_BACKGROUND_Y_OFFSET = -35;
// 落日天空背景的独立纵向偏移；通常保持 0。
export const BASE_SUNSET_BACKGROUND_Y_OFFSET = 0;
// 跑道远端的独立微调；负数上移，正数下移，不影响城市和落日。
export const TRACK_ENDPOINT_Y_OFFSET = -20;

// 计算后的跑道消失线高度。
export const TRACK_HORIZON_Y = BASE_TRACK_HORIZON_Y + SCENE_ALIGNMENT_Y_OFFSET + TRACK_ENDPOINT_Y_OFFSET;
// 计算后的城市图层偏移。
export const CITY_BACKGROUND_Y_OFFSET = BASE_CITY_BACKGROUND_Y_OFFSET + SCENE_ALIGNMENT_Y_OFFSET;
// 计算后的落日天空图层偏移。
export const SUNSET_BACKGROUND_Y_OFFSET = BASE_SUNSET_BACKGROUND_Y_OFFSET + SCENE_ALIGNMENT_Y_OFFSET;
