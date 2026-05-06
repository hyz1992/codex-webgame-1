# 移动端体验优化设计

日期：2026-05-06

## 背景

手机浏览器实测发现三个问题：
1. 仅靠滑动切换车道操作困难，需要额外点击控制
2. 手机浏览器地址栏占用屏幕空间，应自动全屏
3. 首次加载无进度提示，点击"开始游戏"后长时间无响应

## 需求

### 1. 点击切换车道

在游戏进行中，点击屏幕下半部分可切换车道：

- 屏幕水平方向分为 5 等份
- 左 2/5（0%–40%）点击 → `laneLeft`
- 右 2/5（60%–100%）点击 → `laneRight`
- 中间 1/5（40%–60%）不触发，防止误触
- 仅在 `clientY > window.innerHeight * 0.5`（屏幕下半部分）时生效
- 仅在游戏进行中响应（`hasStarted && !isPaused && !isGameOver`）
- 与现有滑动控制共存互补

实现：修改 `InputController`，`pointerup` 时若位移 < `GESTURE_MIN_DISTANCE` 则视为点击，根据坐标位置判定 action。点击判定优先于 `confirm`——屏幕下半部分的点击不再产生 `confirm`。

### 2. 手机浏览器全屏

在用户首次点击"开始游戏"时通过 Fullscreen API 进入全屏：

- 监听 `confirm` action，首次触发时调用 `document.documentElement.requestFullscreen()`
- 避免重复触发：检查 `document.fullscreenElement`
- CSS 加 `touch-action: manipulation` 消除移动端 300ms 点击延迟

### 3. 资源加载进度条

新增 `BootScene`（Phaser 场景）作为首个场景：

- 负责通过 Phaser loader 加载所有游戏资源
- 通过 DOM 显示进度条，进度值来自 `this.load.on('progress', cb)`
- 加载完成后隐藏进度条，自动 `this.scene.start('GameScene')`
- `GameScene.preload()` 保留但不再加载资源（已在 BootScene 完成）

进度条 UI：
- 全屏深色背景（`#101820`）居中显示
- 水平进度条 + 百分比文字
- CSS transition 平滑动画
- 加载完成后淡出

## 影响范围

| 文件 | 变更 |
|------|------|
| `src/game/input/InputController.ts` | 增加点击判定逻辑 |
| `src/game/scenes/BootScene.ts` | 新增，负责资源加载和进度显示 |
| `src/game/scenes/GameScene.ts` | `preload()` 清空，改为空方法 |
| `src/main.ts` | 注册 BootScene，增加全屏逻辑 |
| `src/styles.css` | 进度条样式，touch-action |
| `index.html` | 进度条 DOM 容器 |

## 不做的事情

- 不做 iOS Safari 的 standalone PWA 模式（需要 manifest.json 和 service worker，超出范围）
- 不做滑动灵敏度调节（本次只加点击控制）
- 不做进度条取消/重试（资源包小，失败概率低）
