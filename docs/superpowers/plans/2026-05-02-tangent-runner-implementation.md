# 切线冲刺 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个移动端优先、PC 端可预览调试的 Phaser 3 竖屏 3 轨短局跑酷 MVP。

**Architecture:** 游戏规则状态保存在可测试的 TypeScript 模块中，Phaser 只负责场景、渲染、碰撞对象和动画表现。DOM Overlay 负责开始页、HUD、暂停页、结算页和调试面板，输入层把触摸、鼠标手势和键盘统一转换为标准游戏动作。

**Tech Stack:** Phaser 3、TypeScript、Vite、Vitest、HTML/CSS、Pointer Events、localStorage。

---

## 文件结构

- `package.json`：项目脚本、依赖和开发依赖。
- `index.html`：Vite 入口，挂载游戏容器和 DOM Overlay。
- `tsconfig.json`：TypeScript 编译配置。
- `vite.config.ts`：Vite 和 Vitest 配置。
- `src/main.ts`：启动 Phaser 游戏和 DOM Overlay。
- `src/game/config.ts`：画布尺寸、轨道位置、速度和手势阈值等常量。
- `src/game/actions.ts`：标准输入动作类型。
- `src/game/state.ts`：`RunState` 类型、初始状态、状态更新函数。
- `src/game/input/InputController.ts`：Pointer Events 与键盘到游戏动作的转换。
- `src/game/lane/LaneController.ts`：3 轨位置、换轨、跳跃、滑铲状态。
- `src/game/spawn/patterns.ts`：障碍、道具和生成模式类型。
- `src/game/spawn/ObstacleSpawner.ts`：根据时间、速度和随机种子生成可解模式。
- `src/game/collision/CollisionSystem.ts`：碰撞结果到 `RunState` 的更新。
- `src/game/storage/records.ts`：最高分与设置的 localStorage 读写。
- `src/game/scenes/GameScene.ts`：Phaser 主场景。
- `src/ui/HudOverlay.ts`：DOM HUD、菜单、结算页和暂停页。
- `src/ui/DebugPanel.ts`：开发调试面板。
- `src/styles.css`：移动端竖屏布局、PC 手机视窗、HUD 和调试样式。
- `tests/state.test.ts`：局内状态测试。
- `tests/input.test.ts`：手势判定测试。
- `tests/lane.test.ts`：轨道控制测试。
- `tests/spawner.test.ts`：障碍生成可解性测试。
- `tests/collision.test.ts`：碰撞和得分测试。

## 任务 1：创建 Vite + TypeScript + Phaser 项目骨架

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.ts`
- Create: `src/styles.css`

- [ ] **Step 1: 写入项目依赖和脚本**

Create `package.json`:

```json
{
  "name": "codex-webgame",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "devDependencies": {
    "@vitest/ui": "^3.1.2",
    "happy-dom": "^17.4.7",
    "typescript": "^5.8.3",
    "vite": "^6.3.4",
    "vitest": "^3.1.2"
  }
}
```

- [ ] **Step 2: 写入 Vite HTML 入口**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>切线冲刺</title>
  </head>
  <body>
    <main id="app-shell">
      <section id="phone-frame">
        <div id="game-root"></div>
        <div id="hud-root"></div>
      </section>
      <aside id="debug-root" hidden></aside>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 3: 写入 TypeScript 配置**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

- [ ] **Step 4: 写入 Vite 与 Vitest 配置**

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: 写入最小启动入口**

Create `src/main.ts`:

```ts
import './styles.css';

const root = document.querySelector<HTMLDivElement>('#game-root');
const hudRoot = document.querySelector<HTMLDivElement>('#hud-root');

if (!root || !hudRoot) {
  throw new Error('缺少游戏挂载节点');
}

root.textContent = '切线冲刺加载中';
hudRoot.innerHTML = '<button class="primary-action" type="button">开始游戏</button>';
```

- [ ] **Step 6: 写入移动端优先布局样式**

Create `src/styles.css`:

```css
:root {
  color: #f8fafc;
  background: #101820;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  overflow: hidden;
  touch-action: none;
}

#app-shell {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  background:
    linear-gradient(180deg, rgba(21, 32, 43, 0.96), rgba(16, 24, 32, 1)),
    #101820;
}

#phone-frame {
  position: relative;
  width: min(100vw, 56.25vh);
  height: min(100vh, 177.78vw);
  max-width: 430px;
  max-height: 932px;
  overflow: hidden;
  background: #16212b;
}

#game-root,
#hud-root {
  position: absolute;
  inset: 0;
}

#hud-root {
  pointer-events: none;
}

.primary-action {
  pointer-events: auto;
  position: absolute;
  left: 50%;
  bottom: 96px;
  transform: translateX(-50%);
  min-width: 144px;
  min-height: 48px;
  border: 0;
  border-radius: 8px;
  background: #f6c453;
  color: #101820;
  font-size: 18px;
  font-weight: 700;
}

#debug-root {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 260px;
  max-height: calc(100vh - 32px);
  overflow: auto;
}
```

- [ ] **Step 7: 安装依赖并验证骨架**

Run:

```bash
npm install
npm run build
```

Expected:

```text
✓ built
```

- [ ] **Step 8: 提交项目骨架**

Run:

```bash
git add package.json package-lock.json index.html tsconfig.json vite.config.ts src/main.ts src/styles.css
git commit -m "初始化切线冲刺项目骨架"
```

## 任务 2：实现可测试的局内状态与得分规则

**Files:**
- Create: `src/game/config.ts`
- Create: `src/game/actions.ts`
- Create: `src/game/state.ts`
- Create: `tests/state.test.ts`

- [ ] **Step 1: 写入失败测试**

Create `tests/state.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  addDistance,
  collectEnergy,
  createInitialRunState,
  damagePlayer,
  startRun,
  tickBoost,
} from '../src/game/state';

describe('RunState', () => {
  it('用距离、能量球和连击倍率计算分数', () => {
    let state = startRun(createInitialRunState());
    state = addDistance(state, 12);
    state = collectEnergy(state);
    state = collectEnergy(state);

    expect(state.distance).toBe(12);
    expect(state.combo).toBe(2);
    expect(state.score).toBe(35);
    expect(state.boostMeter).toBe(40);
  });

  it('护盾吸收第一次普通伤害，第二次普通伤害结束本局', () => {
    let state = startRun(createInitialRunState());
    state = collectEnergy(state);
    state = damagePlayer(state, 'normal');

    expect(state.shields).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.isGameOver).toBe(false);

    state = damagePlayer(state, 'normal');
    expect(state.isGameOver).toBe(true);
  });

  it('危险伤害直接结束本局', () => {
    const state = damagePlayer(startRun(createInitialRunState()), 'fatal');
    expect(state.isGameOver).toBe(true);
  });

  it('疾跑槽满后触发 3 秒磁吸冲刺并在计时结束后关闭', () => {
    let state = startRun(createInitialRunState());
    for (let index = 0; index < 5; index += 1) {
      state = collectEnergy(state);
    }

    expect(state.boostMeter).toBe(0);
    expect(state.isBoosting).toBe(true);
    expect(state.boostMsRemaining).toBe(3000);

    state = tickBoost(state, 3000);
    expect(state.isBoosting).toBe(false);
    expect(state.boostMsRemaining).toBe(0);
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm test -- tests/state.test.ts
```

Expected:

```text
FAIL tests/state.test.ts
Cannot find module '../src/game/state'
```

- [ ] **Step 3: 写入常量和动作类型**

Create `src/game/config.ts`:

```ts
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
```

Create `src/game/actions.ts`:

```ts
export type GameAction =
  | 'laneLeft'
  | 'laneRight'
  | 'jump'
  | 'slide'
  | 'pause'
  | 'restart'
  | 'confirm';
```

- [ ] **Step 4: 实现局内状态规则**

Create `src/game/state.ts`:

```ts
import {
  BASE_SPEED,
  BOOST_DURATION_MS,
  BOOST_METER_MAX,
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

export function createInitialRunState(): RunState {
  return {
    hasStarted: false,
    score: 0,
    distance: 0,
    speed: BASE_SPEED,
    shields: 1,
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
  if (state.isGameOver) {
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
  return {
    ...state,
    shields: Math.min(1, state.shields + 1),
  };
}

export function triggerBoost(state: RunState): RunState {
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
```

- [ ] **Step 5: 运行测试并确认通过**

Run:

```bash
npm test -- tests/state.test.ts
```

Expected:

```text
PASS tests/state.test.ts
```

- [ ] **Step 6: 提交状态规则**

Run:

```bash
git add src/game/config.ts src/game/actions.ts src/game/state.ts tests/state.test.ts
git commit -m "实现局内状态与得分规则"
```

## 任务 3：实现轨道控制和输入手势识别

**Files:**
- Create: `src/game/lane/LaneController.ts`
- Create: `src/game/input/InputController.ts`
- Create: `tests/lane.test.ts`
- Create: `tests/input.test.ts`

- [ ] **Step 1: 写入轨道控制失败测试**

Create `tests/lane.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LaneController } from '../src/game/lane/LaneController';

describe('LaneController', () => {
  it('限制玩家只能在 3 条轨道内移动', () => {
    const lanes = new LaneController();

    lanes.applyAction('laneLeft');
    lanes.applyAction('laneLeft');
    expect(lanes.snapshot().lane).toBe(0);

    lanes.applyAction('laneRight');
    lanes.applyAction('laneRight');
    lanes.applyAction('laneRight');
    expect(lanes.snapshot().lane).toBe(2);
  });

  it('跳跃时允许换轨，滑铲时禁止换轨', () => {
    const lanes = new LaneController();

    lanes.applyAction('jump');
    lanes.applyAction('laneRight');
    expect(lanes.snapshot().lane).toBe(2);

    lanes.endActionState();
    lanes.applyAction('slide');
    lanes.applyAction('laneLeft');
    expect(lanes.snapshot().lane).toBe(2);
  });
});
```

- [ ] **Step 2: 写入输入手势失败测试**

Create `tests/input.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { detectPointerGesture } from '../src/game/input/InputController';

describe('detectPointerGesture', () => {
  it('识别四个方向的快速滑动', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 40, y: 105, time: 160 })).toBe('laneLeft');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 170, y: 96, time: 160 })).toBe('laneRight');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 104, y: 35, time: 160 })).toBe('jump');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 96, y: 170, time: 160 })).toBe('slide');
  });

  it('短距离释放识别为确认，慢拖不触发动作', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 110, y: 106, time: 120 })).toBe('confirm');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 170, y: 100, time: 900 })).toBe(null);
  });
});
```

- [ ] **Step 3: 运行测试并确认失败**

Run:

```bash
npm test -- tests/lane.test.ts tests/input.test.ts
```

Expected:

```text
FAIL tests/lane.test.ts
FAIL tests/input.test.ts
```

- [ ] **Step 4: 实现轨道控制器**

Create `src/game/lane/LaneController.ts`:

```ts
import type { GameAction } from '../actions';
import { LANE_COUNT } from '../config';

export type PlayerMotionState = 'running' | 'jumping' | 'sliding';

export interface LaneSnapshot {
  lane: number;
  motion: PlayerMotionState;
}

export class LaneController {
  private lane = 1;
  private motion: PlayerMotionState = 'running';

  applyAction(action: GameAction): void {
    if (action === 'jump') {
      this.motion = 'jumping';
      return;
    }

    if (action === 'slide') {
      this.motion = 'sliding';
      return;
    }

    if (action === 'laneLeft') {
      this.moveLane(-1);
      return;
    }

    if (action === 'laneRight') {
      this.moveLane(1);
    }
  }

  endActionState(): void {
    this.motion = 'running';
  }

  snapshot(): LaneSnapshot {
    return {
      lane: this.lane,
      motion: this.motion,
    };
  }

  private moveLane(direction: -1 | 1): void {
    if (this.motion === 'sliding') {
      return;
    }

    this.lane = Math.max(0, Math.min(LANE_COUNT - 1, this.lane + direction));
  }
}
```

- [ ] **Step 5: 实现输入控制器和纯函数手势识别**

Create `src/game/input/InputController.ts`:

```ts
import type { GameAction } from '../actions';
import { GESTURE_AXIS_RATIO, GESTURE_MAX_MS, GESTURE_MIN_DISTANCE } from '../config';

export interface PointerSample {
  x: number;
  y: number;
  time: number;
}

export type ActionListener = (action: GameAction) => void;

export function detectPointerGesture(start: PointerSample, end: PointerSample): GameAction | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const elapsed = end.time - start.time;

  if (absX < GESTURE_MIN_DISTANCE && absY < GESTURE_MIN_DISTANCE) {
    return 'confirm';
  }

  if (elapsed > GESTURE_MAX_MS) {
    return null;
  }

  if (absX > absY * GESTURE_AXIS_RATIO) {
    return dx < 0 ? 'laneLeft' : 'laneRight';
  }

  if (absY > absX * GESTURE_AXIS_RATIO) {
    return dy < 0 ? 'jump' : 'slide';
  }

  return null;
}

export class InputController {
  private pointerStart: PointerSample | null = null;

  constructor(
    private readonly target: HTMLElement,
    private readonly onAction: ActionListener,
  ) {}

  bind(): void {
    this.target.addEventListener('pointerdown', this.handlePointerDown);
    this.target.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  destroy(): void {
    this.target.removeEventListener('pointerdown', this.handlePointerDown);
    this.target.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerStart = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.pointerStart) {
      return;
    }

    const action = detectPointerGesture(this.pointerStart, {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    });

    this.pointerStart = null;

    if (action) {
      this.onAction(action);
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const action = keyToAction(event.key);

    if (action) {
      event.preventDefault();
      this.onAction(action);
    }
  };
}

export function keyToAction(key: string): GameAction | null {
  if (key === 'a' || key === 'A' || key === 'ArrowLeft') {
    return 'laneLeft';
  }

  if (key === 'd' || key === 'D' || key === 'ArrowRight') {
    return 'laneRight';
  }

  if (key === 'w' || key === 'W' || key === 'ArrowUp') {
    return 'jump';
  }

  if (key === 's' || key === 'S' || key === 'ArrowDown') {
    return 'slide';
  }

  if (key === 'Escape') {
    return 'pause';
  }

  if (key === 'r' || key === 'R') {
    return 'restart';
  }

  if (key === 'Enter' || key === ' ') {
    return 'confirm';
  }

  return null;
}
```

- [ ] **Step 6: 运行测试并确认通过**

Run:

```bash
npm test -- tests/lane.test.ts tests/input.test.ts
```

Expected:

```text
PASS tests/lane.test.ts
PASS tests/input.test.ts
```

- [ ] **Step 7: 提交轨道和输入系统**

Run:

```bash
git add src/game/lane/LaneController.ts src/game/input/InputController.ts tests/lane.test.ts tests/input.test.ts
git commit -m "实现轨道控制与手势输入"
```

## 任务 4：实现障碍生成和碰撞规则

**Files:**
- Create: `src/game/spawn/patterns.ts`
- Create: `src/game/spawn/ObstacleSpawner.ts`
- Create: `src/game/collision/CollisionSystem.ts`
- Create: `tests/spawner.test.ts`
- Create: `tests/collision.test.ts`

- [ ] **Step 1: 写入障碍生成失败测试**

Create `tests/spawner.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ObstacleSpawner } from '../src/game/spawn/ObstacleSpawner';

describe('ObstacleSpawner', () => {
  it('每个生成窗口至少留出一条可通过轨道', () => {
    const spawner = new ObstacleSpawner(7);

    for (let index = 0; index < 40; index += 1) {
      const pattern = spawner.nextPattern(index * 10);
      expect(pattern.safeLanes.length).toBeGreaterThanOrEqual(1);
      expect(pattern.hazards.length).toBeLessThan(3);
    }
  });

  it('时间越久生成间距越短但不低于下限', () => {
    const spawner = new ObstacleSpawner(11);

    expect(spawner.getSpawnIntervalMs(0)).toBe(950);
    expect(spawner.getSpawnIntervalMs(180)).toBe(520);
  });
});
```

- [ ] **Step 2: 写入碰撞失败测试**

Create `tests/collision.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createInitialRunState, startRun } from '../src/game/state';
import { resolveCollision } from '../src/game/collision/CollisionSystem';

describe('CollisionSystem', () => {
  it('收集能量球增加分数和连击', () => {
    const state = resolveCollision(startRun(createInitialRunState()), { kind: 'energy', lane: 1 });

    expect(state.combo).toBe(1);
    expect(state.score).toBe(11);
  });

  it('收集护盾最多保持 1 层护盾', () => {
    const state = resolveCollision(startRun(createInitialRunState()), { kind: 'shield', lane: 1 });
    expect(state.shields).toBe(1);
  });

  it('危险区直接结束本局', () => {
    const state = resolveCollision(startRun(createInitialRunState()), { kind: 'hazard', lane: 1 });
    expect(state.isGameOver).toBe(true);
  });
});
```

- [ ] **Step 3: 运行测试并确认失败**

Run:

```bash
npm test -- tests/spawner.test.ts tests/collision.test.ts
```

Expected:

```text
FAIL tests/spawner.test.ts
FAIL tests/collision.test.ts
```

- [ ] **Step 4: 实现生成模式类型**

Create `src/game/spawn/patterns.ts`:

```ts
export type ObstacleKind = 'barrier' | 'lowFence' | 'beam' | 'hazard';
export type PickupKind = 'energy' | 'shield' | 'boost';

export interface LaneItem {
  kind: ObstacleKind | PickupKind;
  lane: number;
}

export interface SpawnPattern {
  hazards: LaneItem[];
  pickups: LaneItem[];
  safeLanes: number[];
}
```

- [ ] **Step 5: 实现可解障碍生成器**

Create `src/game/spawn/ObstacleSpawner.ts`:

```ts
import type { LaneItem, SpawnPattern } from './patterns';

function createRandom(seed: number): () => number {
  let value = seed;

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export class ObstacleSpawner {
  private readonly random: () => number;

  constructor(seed = Date.now()) {
    this.random = createRandom(seed);
  }

  getSpawnIntervalMs(secondsElapsed: number): number {
    return Math.max(520, 950 - Math.floor(secondsElapsed * 3.2));
  }

  nextPattern(secondsElapsed: number): SpawnPattern {
    const safeLane = Math.floor(this.random() * 3);
    const hazards: LaneItem[] = [];
    const pickups: LaneItem[] = [];

    for (let lane = 0; lane < 3; lane += 1) {
      if (lane === safeLane) {
        pickups.push({
          kind: 'energy',
          lane,
        });
        continue;
      }

      if (this.random() < this.hazardChance(secondsElapsed)) {
        hazards.push({
          kind: this.pickHazard(secondsElapsed),
          lane,
        });
      }
    }

    if (this.random() < 0.08) {
      pickups.push({
        kind: 'shield',
        lane: safeLane,
      });
    }

    if (this.random() < 0.06) {
      pickups.push({
        kind: 'boost',
        lane: safeLane,
      });
    }

    return {
      hazards,
      pickups,
      safeLanes: [safeLane],
    };
  }

  private hazardChance(secondsElapsed: number): number {
    return Math.min(0.92, 0.45 + secondsElapsed / 260);
  }

  private pickHazard(secondsElapsed: number): LaneItem['kind'] {
    const roll = this.random();

    if (secondsElapsed > 90 && roll > 0.88) {
      return 'hazard';
    }

    if (roll > 0.66) {
      return 'beam';
    }

    if (roll > 0.33) {
      return 'lowFence';
    }

    return 'barrier';
  }
}
```

- [ ] **Step 6: 实现碰撞结果系统**

Create `src/game/collision/CollisionSystem.ts`:

```ts
import { collectEnergy, collectShield, damagePlayer, triggerBoost, type RunState } from '../state';
import type { LaneItem } from '../spawn/patterns';

export function resolveCollision(state: RunState, item: LaneItem): RunState {
  if (item.kind === 'energy') {
    return collectEnergy(state);
  }

  if (item.kind === 'shield') {
    return collectShield(state);
  }

  if (item.kind === 'boost') {
    return triggerBoost(state);
  }

  if (item.kind === 'hazard') {
    return damagePlayer(state, 'fatal');
  }

  return damagePlayer(state, 'normal');
}
```

- [ ] **Step 7: 运行测试并确认通过**

Run:

```bash
npm test -- tests/spawner.test.ts tests/collision.test.ts
```

Expected:

```text
PASS tests/spawner.test.ts
PASS tests/collision.test.ts
```

- [ ] **Step 8: 提交生成和碰撞规则**

Run:

```bash
git add src/game/spawn/patterns.ts src/game/spawn/ObstacleSpawner.ts src/game/collision/CollisionSystem.ts tests/spawner.test.ts tests/collision.test.ts
git commit -m "实现障碍生成与碰撞规则"
```

## 任务 5：接入 Phaser 主场景

**Files:**
- Create: `src/game/scenes/GameScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: 写入 Phaser 场景**

Create `src/game/scenes/GameScene.ts`:

```ts
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LANE_X } from '../config';
import type { GameAction } from '../actions';
import { LaneController } from '../lane/LaneController';
import { addDistance, createInitialRunState, startRun, tickBoost, type RunState } from '../state';
import { ObstacleSpawner } from '../spawn/ObstacleSpawner';
import type { LaneItem } from '../spawn/patterns';
import { resolveCollision } from '../collision/CollisionSystem';

interface MovingItem extends LaneItem {
  shape: Phaser.GameObjects.Rectangle;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private laneController = new LaneController();
  private runState: RunState = createInitialRunState();
  private spawner = new ObstacleSpawner(1);
  private items: MovingItem[] = [];
  private elapsedMs = 0;
  private spawnTimerMs = 0;
  private onStateChange: (state: RunState) => void = () => {};

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.drawTrack();
    this.player = this.add.rectangle(LANE_X[1], GAME_HEIGHT - 132, 34, 48, 0xf6c453);
    this.onStateChange(this.runState);

    this.events.on('game-action', (action: GameAction) => {
      this.applyAction(action);
    });

    this.events.on('state-listener', (listener: (state: RunState) => void) => {
      this.onStateChange = listener;
      this.onStateChange(this.runState);
    });
  }

  update(_time: number, deltaMs: number): void {
    if (!this.runState.hasStarted || this.runState.isPaused || this.runState.isGameOver) {
      return;
    }

    this.elapsedMs += deltaMs;
    this.spawnTimerMs += deltaMs;
    this.runState = tickBoost(addDistance(this.runState, (this.runState.speed * deltaMs) / 1000 / 18), deltaMs);

    const secondsElapsed = this.elapsedMs / 1000;
    if (this.spawnTimerMs >= this.spawner.getSpawnIntervalMs(secondsElapsed)) {
      this.spawnTimerMs = 0;
      this.spawnPattern(secondsElapsed);
    }

    this.moveItems(deltaMs);
    this.syncPlayerPosition();
    this.onStateChange(this.runState);
  }

  private drawTrack(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 290, GAME_HEIGHT, 0x1c2b35);

    for (const laneX of LANE_X) {
      this.add.rectangle(laneX, GAME_HEIGHT / 2, 2, GAME_HEIGHT, 0x39505f, 0.8);
    }
  }

  private applyAction(action: GameAction): void {
    if (action === 'confirm' && !this.runState.hasStarted) {
      this.runState = startRun(this.runState);
      this.onStateChange(this.runState);
      return;
    }

    if (action === 'restart') {
      this.scene.restart();
      return;
    }

    if (action === 'pause') {
      if (!this.runState.hasStarted) {
        return;
      }

      this.runState = {
        ...this.runState,
        isPaused: !this.runState.isPaused,
      };
      this.onStateChange(this.runState);
      return;
    }

    this.laneController.applyAction(action);
    this.time.delayedCall(280, () => {
      this.laneController.endActionState();
    });
  }

  private spawnPattern(secondsElapsed: number): void {
    const pattern = this.spawner.nextPattern(secondsElapsed);
    const items = [...pattern.hazards, ...pattern.pickups];

    for (const item of items) {
      const color = this.getItemColor(item.kind);
      const shape = this.add.rectangle(LANE_X[item.lane], -40, 42, 42, color);
      this.items.push({
        ...item,
        shape,
      });
    }
  }

  private moveItems(deltaMs: number): void {
    const playerBounds = this.player.getBounds();
    const speedMultiplier = this.runState.isBoosting ? 1.12 : 1;
    const pixels = (this.runState.speed * speedMultiplier * deltaMs) / 1000;

    for (const item of this.items) {
      item.shape.y += pixels;

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, item.shape.getBounds())) {
        this.runState = resolveCollision(this.runState, item);
        item.shape.destroy();
        item.shape.setData('removed', true);
      }
    }

    this.items = this.items.filter((item) => {
      const keep = item.shape.active && !item.shape.getData('removed') && item.shape.y < GAME_HEIGHT + 80;
      if (!keep && item.shape.active) {
        item.shape.destroy();
      }
      return keep;
    });
  }

  private syncPlayerPosition(): void {
    const snapshot = this.laneController.snapshot();
    this.player.x = Phaser.Math.Linear(this.player.x, LANE_X[snapshot.lane], 0.35);

    if (snapshot.motion === 'jumping') {
      this.player.scaleY = 0.82;
      return;
    }

    if (snapshot.motion === 'sliding') {
      this.player.scaleY = 0.48;
      return;
    }

    this.player.scaleY = 1;
  }

  private getItemColor(kind: LaneItem['kind']): number {
    if (kind === 'energy') {
      return 0x63d2ff;
    }

    if (kind === 'shield') {
      return 0x7ee787;
    }

    if (kind === 'boost') {
      return 0xb78cff;
    }

    if (kind === 'hazard') {
      return 0xef476f;
    }

    return 0xf4a261;
  }
}
```

- [ ] **Step 2: 替换启动入口接入 Phaser**

Modify `src/main.ts`:

```ts
import Phaser from 'phaser';
import './styles.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/config';
import { GameScene } from './game/scenes/GameScene';
import { InputController } from './game/input/InputController';
import type { GameAction } from './game/actions';

const gameRoot = document.querySelector<HTMLDivElement>('#game-root');
const hudRoot = document.querySelector<HTMLDivElement>('#hud-root');

if (!gameRoot || !hudRoot) {
  throw new Error('缺少游戏挂载节点');
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameRoot,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#101820',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
});

const sendAction = (action: GameAction): void => {
  const scene = game.scene.getScene('GameScene');
  scene.events.emit('game-action', action);
};

const input = new InputController(document.querySelector('#phone-frame') as HTMLElement, sendAction);
input.bind();

hudRoot.innerHTML = '<button class="primary-action" type="button" data-action="confirm">开始游戏</button>';
hudRoot.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.action === 'confirm') {
    sendAction('confirm');
  }
});
```

- [ ] **Step 3: 构建验证**

Run:

```bash
npm run build
```

Expected:

```text
✓ built
```

- [ ] **Step 4: 启动本地预览并进行人工烟测**

Run:

```bash
npm run dev
```

Expected:

```text
Local:   http://localhost:5173/
```

Manual checks:

- 页面显示 9:16 游戏视窗。
- 跑道和玩家矩形出现。
- 鼠标左右划动可以换轨。
- `A/D/W/S/R/Esc` 有响应。
- 障碍和能量球会从上方向下移动。

- [ ] **Step 5: 提交 Phaser 主场景**

Run:

```bash
git add src/main.ts src/game/scenes/GameScene.ts
git commit -m "接入Phaser主场景"
```

## 任务 6：实现 DOM HUD、结算页和本地最高分

**Files:**
- Create: `src/game/storage/records.ts`
- Create: `src/ui/HudOverlay.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: 写入本地记录模块**

Create `src/game/storage/records.ts`:

```ts
import type { RunState } from '../state';

const BEST_SCORE_KEY = 'tangent-runner-best-score';

export function readBestScore(): number {
  const rawValue = localStorage.getItem(BEST_SCORE_KEY);
  const value = rawValue ? Number(rawValue) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function writeBestScore(score: number): void {
  localStorage.setItem(BEST_SCORE_KEY, String(Math.max(0, Math.floor(score))));
}

export function updateBestScore(state: RunState): number {
  const current = readBestScore();
  const next = Math.max(current, state.score);
  writeBestScore(next);
  return next;
}
```

- [ ] **Step 2: 写入 HUD Overlay**

Create `src/ui/HudOverlay.ts`:

```ts
import type { GameAction } from '../game/actions';
import { readBestScore, updateBestScore } from '../game/storage/records';
import type { RunState } from '../game/state';

export class HudOverlay {
  private latestState: RunState | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly sendAction: (action: GameAction) => void,
  ) {}

  mount(): void {
    this.root.addEventListener('click', this.handleClick);
    this.renderStart();
  }

  destroy(): void {
    this.root.removeEventListener('click', this.handleClick);
  }

  update(state: RunState): void {
    this.latestState = state;

    if (!state.hasStarted) {
      this.renderStart();
      return;
    }

    if (state.isGameOver) {
      this.renderGameOver(state);
      return;
    }

    this.renderHud(state);
  }

  private renderStart(): void {
    this.root.innerHTML = `
      <section class="menu-screen">
        <h1>切线冲刺</h1>
        <p>最高分 ${readBestScore()}</p>
        <button class="primary-action" type="button" data-action="confirm">开始游戏</button>
      </section>
    `;
  }

  private renderHud(state: RunState): void {
    this.root.innerHTML = `
      <div class="hud-bar">
        <span>${state.score}</span>
        <span>${Math.floor(state.distance)}m</span>
        <span>盾 ${state.shields}</span>
      </div>
      <div class="boost-bar" aria-label="疾跑槽">
        <span style="width: ${state.boostMeter}%"></span>
      </div>
      <button class="pause-button" type="button" data-action="pause">暂停</button>
      ${state.isPaused ? `
        <section class="menu-screen compact">
          <button class="primary-action" type="button" data-action="pause">继续</button>
          <button class="secondary-action" type="button" data-action="restart">重开</button>
        </section>
      ` : ''}
    `;
  }

  private renderGameOver(state: RunState): void {
    const best = updateBestScore(state);

    this.root.innerHTML = `
      <section class="menu-screen">
        <h1>本局结束</h1>
        <dl class="result-list">
          <div><dt>分数</dt><dd>${state.score}</dd></div>
          <div><dt>距离</dt><dd>${Math.floor(state.distance)}m</dd></div>
          <div><dt>最高连击</dt><dd>${state.bestCombo}</dd></div>
          <div><dt>最高分</dt><dd>${best}</dd></div>
        </dl>
        <button class="primary-action" type="button" data-action="restart">再来一局</button>
      </section>
    `;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action as GameAction | undefined;

    if (!action) {
      return;
    }

    event.preventDefault();
    this.sendAction(action);
  };
}
```

- [ ] **Step 3: 接入 HUD 状态监听**

Modify `src/main.ts`:

```ts
import Phaser from 'phaser';
import './styles.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/config';
import { GameScene } from './game/scenes/GameScene';
import { InputController } from './game/input/InputController';
import type { GameAction } from './game/actions';
import { HudOverlay } from './ui/HudOverlay';
import type { RunState } from './game/state';

const gameRoot = document.querySelector<HTMLDivElement>('#game-root');
const hudRoot = document.querySelector<HTMLDivElement>('#hud-root');

if (!gameRoot || !hudRoot) {
  throw new Error('缺少游戏挂载节点');
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameRoot,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#101820',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
});

const sendAction = (action: GameAction): void => {
  const scene = game.scene.getScene('GameScene');
  scene.events.emit('game-action', action);
};

const input = new InputController(document.querySelector('#phone-frame') as HTMLElement, sendAction);
input.bind();

const hud = new HudOverlay(hudRoot, sendAction);
hud.mount();

game.events.once(Phaser.Core.Events.READY, () => {
  const scene = game.scene.getScene('GameScene');
  scene.events.emit('state-listener', (state: RunState) => hud.update(state));
});
```

- [ ] **Step 4: 增补 HUD 样式**

Append to `src/styles.css`:

```css
.hud-bar {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  left: 12px;
  right: 12px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.45);
}

.hud-bar span:last-child {
  text-align: right;
}

.boost-bar {
  position: absolute;
  top: max(42px, calc(env(safe-area-inset-top) + 30px));
  left: 64px;
  right: 64px;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(248, 250, 252, 0.22);
}

.boost-bar span {
  display: block;
  height: 100%;
  background: #63d2ff;
}

.pause-button {
  pointer-events: auto;
  position: absolute;
  top: max(54px, calc(env(safe-area-inset-top) + 42px));
  right: 12px;
  width: 52px;
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.16);
  color: #f8fafc;
  font-weight: 700;
}

.menu-screen {
  pointer-events: auto;
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
  background: rgba(16, 24, 32, 0.62);
}

.menu-screen.compact {
  background: rgba(16, 24, 32, 0.72);
}

.menu-screen h1 {
  margin: 0;
  font-size: 34px;
}

.menu-screen p {
  margin: 0;
  font-size: 18px;
}

.secondary-action {
  min-width: 144px;
  min-height: 44px;
  border: 1px solid rgba(248, 250, 252, 0.4);
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.1);
  color: #f8fafc;
  font-size: 16px;
  font-weight: 700;
}

.result-list {
  display: grid;
  gap: 8px;
  margin: 0;
}

.result-list div {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.result-list dt,
.result-list dd {
  margin: 0;
}
```

- [ ] **Step 5: 构建验证**

Run:

```bash
npm run build
```

Expected:

```text
✓ built
```

- [ ] **Step 6: 人工验证 HUD**

Run:

```bash
npm run dev
```

Manual checks:

- 开始页显示游戏名和最高分。
- 局内 HUD 显示分数、距离、护盾和疾跑槽。
- Esc 或暂停按钮能打开暂停层。
- 失败后显示结算页。
- 刷新页面后最高分仍保留。

- [ ] **Step 7: 提交 HUD 和本地记录**

Run:

```bash
git add src/game/storage/records.ts src/ui/HudOverlay.ts src/main.ts src/styles.css
git commit -m "实现HUD与本地最高分"
```

## 任务 7：实现 PC 调试面板

**Files:**
- Create: `src/ui/DebugPanel.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: 写入调试面板**

Create `src/ui/DebugPanel.ts`:

```ts
import type { GameAction } from '../game/actions';
import type { RunState } from '../game/state';

export class DebugPanel {
  private visible = new URLSearchParams(window.location.search).get('debug') === '1';
  private latestInput = '无';

  constructor(
    private readonly root: HTMLElement,
    private readonly sendAction: (action: GameAction) => void,
  ) {}

  mount(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    this.root.addEventListener('click', this.handleClick);
    this.root.hidden = !this.visible;
  }

  recordInput(action: GameAction): void {
    this.latestInput = action;
  }

  update(state: RunState): void {
    if (!this.visible) {
      return;
    }

    this.root.innerHTML = `
      <section class="debug-panel">
        <h2>调试</h2>
        <dl>
          <div><dt>速度</dt><dd>${state.speed.toFixed(1)}</dd></div>
          <div><dt>距离</dt><dd>${Math.floor(state.distance)}</dd></div>
          <div><dt>分数</dt><dd>${state.score}</dd></div>
          <div><dt>连击</dt><dd>${state.combo}</dd></div>
          <div><dt>护盾</dt><dd>${state.shields}</dd></div>
          <div><dt>疾跑槽</dt><dd>${state.boostMeter}</dd></div>
          <div><dt>输入</dt><dd>${this.latestInput}</dd></div>
        </dl>
        <button type="button" data-action="restart">重开</button>
      </section>
    `;
  }

  private toggle(): void {
    this.visible = !this.visible;
    this.root.hidden = !this.visible;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'F2') {
      event.preventDefault();
      this.toggle();
    }
  };

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.action === 'restart') {
      this.sendAction('restart');
    }
  };
}
```

- [ ] **Step 2: 接入调试面板**

Modify `src/main.ts`:

```ts
import Phaser from 'phaser';
import './styles.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/config';
import { GameScene } from './game/scenes/GameScene';
import { InputController } from './game/input/InputController';
import type { GameAction } from './game/actions';
import { HudOverlay } from './ui/HudOverlay';
import { DebugPanel } from './ui/DebugPanel';
import type { RunState } from './game/state';

const gameRoot = document.querySelector<HTMLDivElement>('#game-root');
const hudRoot = document.querySelector<HTMLDivElement>('#hud-root');
const debugRoot = document.querySelector<HTMLElement>('#debug-root');

if (!gameRoot || !hudRoot || !debugRoot) {
  throw new Error('缺少游戏挂载节点');
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameRoot,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#101820',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
});

let debugPanel: DebugPanel;

const sendAction = (action: GameAction): void => {
  debugPanel?.recordInput(action);
  const scene = game.scene.getScene('GameScene');
  scene.events.emit('game-action', action);
};

const input = new InputController(document.querySelector('#phone-frame') as HTMLElement, sendAction);
input.bind();

const hud = new HudOverlay(hudRoot, sendAction);
hud.mount();

debugPanel = new DebugPanel(debugRoot, sendAction);
debugPanel.mount();

game.events.once(Phaser.Core.Events.READY, () => {
  const scene = game.scene.getScene('GameScene');
  scene.events.emit('state-listener', (state: RunState) => {
    hud.update(state);
    debugPanel.update(state);
  });
});
```

- [ ] **Step 3: 增补调试样式**

Append to `src/styles.css`:

```css
.debug-panel {
  padding: 12px;
  border: 1px solid rgba(248, 250, 252, 0.18);
  border-radius: 8px;
  background: rgba(16, 24, 32, 0.9);
  color: #f8fafc;
  font-size: 13px;
}

.debug-panel h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.debug-panel dl {
  display: grid;
  gap: 6px;
  margin: 0 0 10px;
}

.debug-panel div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.debug-panel dt,
.debug-panel dd {
  margin: 0;
}

.debug-panel button {
  width: 100%;
  min-height: 36px;
  border: 0;
  border-radius: 8px;
  background: #f6c453;
  color: #101820;
  font-weight: 800;
}

@media (max-width: 900px) {
  #debug-root {
    display: none;
  }
}
```

- [ ] **Step 4: 构建验证**

Run:

```bash
npm run build
```

Expected:

```text
✓ built
```

- [ ] **Step 5: 人工验证调试面板**

Run:

```bash
npm run dev -- --host 0.0.0.0
```

Open:

```text
http://localhost:5173/?debug=1
```

Manual checks:

- PC 宽屏右侧显示调试面板。
- F2 可以隐藏和显示调试面板。
- 输入字段会显示最近一次动作。
- 面板里的重开按钮可以重启一局。

- [ ] **Step 6: 提交调试面板**

Run:

```bash
git add src/ui/DebugPanel.ts src/main.ts src/styles.css
git commit -m "添加PC调试面板"
```

## 任务 8：最终验收、移动端视口检查和文档收尾

**Files:**
- Modify: `docs/superpowers/specs/2026-05-02-tangent-runner-design.md`
- Create: `README.md`

- [ ] **Step 1: 写入 README**

Create `README.md`:

```md
# 切线冲刺

移动端优先的 2D 竖屏三轨跑酷游戏。玩家通过滑动手势换轨、跳跃、滑铲，躲避障碍并收集能量球维持连击。

## 开发

```bash
npm install
npm run dev
```

浏览器打开：

```text
http://localhost:5173/
```

PC 调试面板：

```text
http://localhost:5173/?debug=1
```

## 输入

- 移动端左滑/右滑：换轨
- 移动端上滑：跳跃
- 移动端下滑：滑铲
- PC 鼠标拖动：模拟移动端手势
- PC 键盘：A/D 或方向键换轨，W/上方向键跳跃，S/下方向键滑铲，R 重开，Esc 暂停
```

- [ ] **Step 2: 运行全部测试**

Run:

```bash
npm test
```

Expected:

```text
Test Files 5 passed
```

- [ ] **Step 3: 运行生产构建**

Run:

```bash
npm run build
```

Expected:

```text
✓ built
```

- [ ] **Step 4: 本地浏览器烟测**

Run:

```bash
npm run dev
```

Manual checks:

- `http://localhost:5173/` 在 PC 上显示手机比例视窗。
- `http://localhost:5173/?debug=1` 显示调试面板。
- 鼠标左划、右划、上划、下划都能触发对应动作。
- 键盘 A/D/W/S/R/Esc 都能触发对应动作。
- 一局可以开始、游玩、失败、结算、重开。

- [ ] **Step 5: 更新设计文档验收记录**

Append to `docs/superpowers/specs/2026-05-02-tangent-runner-design.md`:

```md

## MVP 实现验收记录

- 已实现 Phaser 3 + TypeScript + Vite 项目骨架。
- 已实现移动端触摸手势、PC 鼠标手势和键盘调试输入。
- 已实现 3 轨跑道、自动前进、障碍生成、能量球、护盾、疾跑槽、分数、连击和本地最高分。
- 已实现开始页、HUD、暂停页、结算页和 PC 调试面板。
- 已通过单元测试、生产构建和本地浏览器烟测。
```

- [ ] **Step 6: 提交最终验收文档**

Run:

```bash
git add README.md docs/superpowers/specs/2026-05-02-tangent-runner-design.md
git commit -m "补充项目说明与验收记录"
```

## 自检清单

- 设计文档中的 MVP 必需项均有对应任务。
- 输入设计覆盖触摸、鼠标手势和键盘。
- PC 调试面板通过 `?debug=1` 和 F2 控制。
- 核心规则模块有单元测试。
- Phaser 渲染层与规则状态分离。
- 所有提交日志均使用中文。
