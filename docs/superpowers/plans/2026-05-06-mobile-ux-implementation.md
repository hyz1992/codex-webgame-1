# 移动端体验优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为手机浏览器增加点击换道、自动全屏和资源加载进度条。

**Architecture:** 三个独立改动：修改 InputController 增加点击位置判定；在 main.ts 的 sendAction 中增加 Fullscreen API 调用；新增 BootScene 接管资源预加载并通过 DOM 显示进度条。

**Tech Stack:** Phaser 3, TypeScript, DOM API (Fullscreen), Vitest

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/game/input/InputController.ts` | Modify | 增加点击位置判定，小位移时根据屏幕位置返回 lane/confirm |
| `tests/input.test.ts` | Modify | 更新现有断言，增加点击位置测试 |
| `src/main.ts` | Modify | 注册 BootScene，增加全屏逻辑 |
| `src/game/scenes/BootScene.ts` | Create | 资源预加载 + 进度回调 |
| `src/game/scenes/GameScene.ts` | Modify | 清空 preload |
| `index.html` | Modify | 增加进度条 DOM |
| `src/styles.css` | Modify | 进度条样式 + touch-action |

---

### Task 1: 点击切换车道

**Files:**
- Modify: `src/game/input/InputController.ts`
- Modify: `tests/input.test.ts`

- [ ] **Step 1: 更新 detectPointerGesture 的测试**

修改 `tests/input.test.ts`，把现有"短距离释放识别为确认"的测试改为位置判定逻辑，并增加点击换道测试：

```typescript
import { describe, expect, it } from 'vitest';
import { detectPointerGesture, keyToAction } from '../src/game/input/InputController';

describe('detectPointerGesture', () => {
  it('识别左右快滑并忽略上下快滑', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 40, y: 105, time: 160 }, 800, 400)).toBe('laneLeft');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 170, y: 96, time: 160 }, 800, 400)).toBe('laneRight');
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 104, y: 35, time: 160 }, 800, 400)).toBe(null);
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 96, y: 170, time: 160 }, 800, 400)).toBe(null);
  });

  it('慢拖不触发动作', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 170, y: 100, time: 900 }, 800, 400)).toBe(null);
  });

  it('屏幕下半部分短距离点击：左侧换左道，右侧换右道，中间不触发', () => {
    const vh = 800;
    const vw = 400;
    const bottomY = vh * 0.6;

    expect(detectPointerGesture({ x: vw * 0.1, y: bottomY, time: 0 }, { x: vw * 0.1 + 5, y: bottomY + 3, time: 120 }, vw, vh)).toBe('laneLeft');
    expect(detectPointerGesture({ x: vw * 0.8, y: bottomY, time: 0 }, { x: vw * 0.8 + 3, y: bottomY + 2, time: 120 }, vw, vh)).toBe('laneRight');
    expect(detectPointerGesture({ x: vw * 0.5, y: bottomY, time: 0 }, { x: vw * 0.5 + 2, y: bottomY + 1, time: 120 }, vw, vh)).toBe(null);
  });

  it('屏幕上半部分短距离点击触发 confirm', () => {
    expect(detectPointerGesture({ x: 100, y: 100, time: 0 }, { x: 110, y: 106, time: 120 }, 800, 400)).toBe('confirm');
  });

  it('屏幕下半部分中间区域短距离点击不触发任何动作', () => {
    expect(detectPointerGesture({ x: 200, y: 600, time: 0 }, { x: 205, y: 603, time: 100 }, 400, 800)).toBe(null);
  });
});

describe('keyToAction', () => {
  it('maps space to pause and enter to confirm on PC', () => {
    expect(keyToAction(' ')).toBe('pause');
    expect(keyToAction('Space')).toBe('pause');
    expect(keyToAction('Enter')).toBe('confirm');
  });

  it('ignores vertical movement keys after removing jump and slide actions', () => {
    expect(keyToAction('w')).toBe(null);
    expect(keyToAction('W')).toBe(null);
    expect(keyToAction('ArrowUp')).toBe(null);
    expect(keyToAction('s')).toBe(null);
    expect(keyToAction('S')).toBe(null);
    expect(keyToAction('ArrowDown')).toBe(null);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/input.test.ts`
Expected: FAIL — detectPointerGesture 签名不匹配，现有测试传参不足

- [ ] **Step 3: 修改 InputController.ts 实现**

替换 `src/game/input/InputController.ts` 中 `detectPointerGesture` 函数：

```typescript
export function detectPointerGesture(
  start: PointerSample,
  end: PointerSample,
  viewportWidth: number,
  viewportHeight: number,
): GameAction | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const elapsed = end.time - start.time;

  if (absX < GESTURE_MIN_DISTANCE && absY < GESTURE_MIN_DISTANCE) {
    if (start.y > viewportHeight * 0.5) {
      const relativeX = start.x / viewportWidth;
      if (relativeX < 0.4) return 'laneLeft';
      if (relativeX > 0.6) return 'laneRight';
      return null;
    }
    return 'confirm';
  }

  if (elapsed > GESTURE_MAX_MS) {
    return null;
  }

  if (absX > absY * GESTURE_AXIS_RATIO) {
    return dx < 0 ? 'laneLeft' : 'laneRight';
  }

  return null;
}
```

同时修改 `handlePointerUp`，传递视口尺寸：

```typescript
  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.pointerStart) {
      return;
    }

    const action = detectPointerGesture(
      this.pointerStart,
      {
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
      },
      window.innerWidth,
      window.innerHeight,
    );

    this.pointerStart = null;

    if (action) {
      this.onAction(action);
    }
  };
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/input.test.ts`
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/game/input/InputController.ts tests/input.test.ts
git commit -m "增加点击切换车道：下半屏左2/5向左、右2/5向右"
```

---

### Task 2: 手机浏览器全屏

**Files:**
- Modify: `src/main.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: 在 main.ts 增加全屏逻辑**

在 `sendAction` 函数中，`confirm` action 触发时尝试全屏。修改 `src/main.ts`：

```typescript
const sendAction = (action: GameAction): void => {
  debugPanel?.recordInput(action);

  if (action === 'confirm' && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }

  const scene = game.scene.getScene('GameScene');
  scene.events.emit('game-action', action);
};
```

- [ ] **Step 2: 修改 CSS touch-action**

在 `src/styles.css` 的 `body` 规则中，将 `touch-action: none` 改为 `touch-action: manipulation`：

```css
body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  overflow: hidden;
  touch-action: manipulation;
}
```

- [ ] **Step 3: 运行全量测试确认无回归**

Run: `npx vitest run`
Expected: 全部 PASS

- [ ] **Step 4: 提交**

```bash
git add src/main.ts src/styles.css
git commit -m "首次点击开始游戏时自动全屏，touch-action改为manipulation"
```

---

### Task 3: 资源加载进度条

**Files:**
- Create: `src/game/scenes/BootScene.ts`
- Modify: `src/game/scenes/GameScene.ts`
- Modify: `index.html`
- Modify: `src/styles.css`
- Modify: `src/main.ts`

- [ ] **Step 1: 在 index.html 增加进度条 DOM**

在 `<section id="phone-frame">` 开头插入：

```html
<section id="phone-frame">
  <div id="loading-root">
    <div class="loading-bar-track">
      <span class="loading-bar-fill"></span>
    </div>
    <span class="loading-percent">0%</span>
  </div>
  <div id="game-root"></div>
  <div id="hud-root"></div>
</section>
```

- [ ] **Step 2: 在 styles.css 增加进度条样式**

在 `#game-root, #hud-root` 规则之前添加：

```css
#loading-root {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: var(--color-night);
  transition: opacity 400ms ease-out;
}

#loading-root.fade-out {
  opacity: 0;
  pointer-events: none;
}

.loading-bar-track {
  width: 60%;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(248, 250, 252, 0.12);
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.2);
}

.loading-bar-fill {
  display: block;
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--color-cyan), var(--color-purple));
  box-shadow: 0 0 16px rgba(24, 247, 255, 0.6);
  transition: width 200ms ease-out;
}

.loading-percent {
  font-size: 18px;
  font-weight: 850;
  color: var(--color-muted);
  text-shadow: 0 0 12px rgba(24, 247, 255, 0.3);
}
```

- [ ] **Step 3: 创建 BootScene**

创建 `src/game/scenes/BootScene.ts`：

```typescript
import { preloadGameAssets } from '../assets/preloadGameAssets';

const LOADING_BAR_FILL = '.loading-bar-fill';
const LOADING_PERCENT = '.loading-percent';
const LOADING_ROOT = '#loading-root';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    const fill = document.querySelector<HTMLElement>(LOADING_BAR_FILL);
    const percent = document.querySelector<HTMLElement>(LOADING_PERCENT);

    this.load.on('progress', (value: number) => {
      if (fill) fill.style.width = `${Math.round(value * 100)}%`;
      if (percent) percent.textContent = `${Math.round(value * 100)}%`;
    });

    preloadGameAssets(this);
  }

  create(): void {
    const loadingRoot = document.querySelector<HTMLElement>(LOADING_ROOT);
    if (loadingRoot) {
      loadingRoot.classList.add('fade-out');
      loadingRoot.addEventListener('transitionend', () => loadingRoot.remove());
    }

    this.scene.start('GameScene');
  }
}
```

- [ ] **Step 4: 修改 main.ts 注册 BootScene**

在 `src/main.ts` 中：

1. 导入 BootScene：
```typescript
import { BootScene } from './game/scenes/BootScene';
```

2. 修改 Phaser.Game 配置，将 `scene: [GameScene]` 改为：
```typescript
  scene: [BootScene, GameScene],
```

- [ ] **Step 5: 清空 GameScene.preload()**

修改 `src/game/scenes/GameScene.ts` 中的 `preload` 方法：

```typescript
  preload(): void {
    // 资源已在 BootScene 中加载
  }
```

- [ ] **Step 6: 运行全量测试确认无回归**

Run: `npx vitest run`
Expected: 全部 PASS

- [ ] **Step 7: 提交**

```bash
git add src/game/scenes/BootScene.ts src/game/scenes/GameScene.ts src/main.ts index.html src/styles.css
git commit -m "新增 BootScene 显示资源加载进度条"
```
