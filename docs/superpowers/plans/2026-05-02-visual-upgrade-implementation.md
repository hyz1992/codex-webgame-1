# 切线冲刺视觉升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前方块原型升级为“霓虹日落街机”风格的程序化视觉版本，并保留移动端可读性、PC 调试能力和核心玩法规则。

**Architecture:** 新增 `visual` 模块集中管理主题、程序化 Phaser 视觉对象和短反馈动效。`GameScene` 只编排视觉工厂和效果控制器，不再散落颜色、形状和发光常量；DOM HUD 使用 CSS 变量完成视觉 polish。

**Tech Stack:** Phaser 3、TypeScript、Vite、Vitest、CSS variables、DOM Overlay、Phaser Graphics/Tween。

---

## 文件结构

- Create: `src/game/visual/theme.ts`
  - 霓虹日落主题颜色、尺寸、动画时长、障碍/道具视觉配置。
- Create: `src/game/visual/GameVisualFactory.ts`
  - 创建跑道、玩家、障碍、道具、速度线等 Phaser 视觉对象。
- Create: `src/game/visual/EffectController.ts`
  - 管理换轨、拾取、护盾、撞击、疾跑、失败等短反馈。
- Modify: `src/game/scenes/GameScene.ts`
  - 使用视觉工厂和效果控制器替换直接 `add.rectangle` 的方块绘制。
- Modify: `src/styles.css`
  - 增加霓虹日落 CSS 变量、HUD 胶囊、按钮、菜单面板、动效和调试面板弱化样式。
- Create: `tests/visual-theme.test.ts`
  - 测试视觉主题覆盖所有障碍和道具类型。
- Modify: `docs/superpowers/specs/2026-05-02-visual-upgrade-design.md`
  - 追加实现验收记录。

## Task 1: 视觉主题常量与覆盖测试

**Files:**
- Create: `tests/visual-theme.test.ts`
- Create: `src/game/visual/theme.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/visual-theme.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getLaneItemVisual, neonSunsetTheme } from '../src/game/visual/theme';
import type { LaneItem } from '../src/game/spawn/patterns';

describe('neonSunsetTheme', () => {
  it('为所有障碍和道具提供可区分的视觉配置', () => {
    const kinds: LaneItem['kind'][] = ['barrier', 'lowFence', 'beam', 'hazard', 'energy', 'shield', 'boost'];

    for (const kind of kinds) {
      const visual = getLaneItemVisual(kind);
      expect(visual.fill).toMatch(/^0x[0-9a-f]{6}$/i);
      expect(visual.glow).toMatch(/^0x[0-9a-f]{6}$/i);
      expect(visual.shape.length).toBeGreaterThan(0);
    }

    expect(getLaneItemVisual('hazard').shape).toBe('rift');
    expect(getLaneItemVisual('beam').shape).toBe('beam');
    expect(getLaneItemVisual('energy').shape).toBe('orb');
  });

  it('定义移动端跑道和动画所需的核心尺寸', () => {
    expect(neonSunsetTheme.track.width).toBe(290);
    expect(neonSunsetTheme.track.laneGlowWidth).toBeGreaterThan(1);
    expect(neonSunsetTheme.motion.laneTweenMs).toBeLessThanOrEqual(160);
    expect(neonSunsetTheme.motion.impactShakeMs).toBeLessThanOrEqual(180);
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm test -- tests/visual-theme.test.ts
```

Expected:

```text
FAIL tests/visual-theme.test.ts
Cannot find module '../src/game/visual/theme'
```

- [ ] **Step 3: 实现视觉主题模块**

Create `src/game/visual/theme.ts`:

```ts
import type { LaneItem } from '../spawn/patterns';

export interface LaneItemVisual {
  fill: `0x${string}`;
  glow: `0x${string}`;
  shape: 'block' | 'low-fence' | 'beam' | 'rift' | 'orb' | 'hex' | 'crystal';
}

export const neonSunsetTheme = {
  colors: {
    skyTop: 0xff9f5a,
    skyMid: 0xb45cff,
    night: 0x101820,
    track: 0x1c2b35,
    laneCyan: 0x18f7ff,
    lanePurple: 0x8b5cf6,
    playerCore: 0xf6ff5d,
    playerBody: 0x18f7ff,
    text: 0xf8fafc,
  },
  track: {
    width: 290,
    laneGlowWidth: 4,
    gridAlpha: 0.18,
    speedLineAlpha: 0.34,
  },
  player: {
    width: 34,
    height: 52,
    radius: 12,
    trailLength: 54,
  },
  motion: {
    laneTweenMs: 140,
    jumpMs: 320,
    slideMs: 300,
    pickupMs: 180,
    shieldMs: 420,
    impactShakeMs: 140,
    gameOverMs: 260,
  },
} as const;

const laneItemVisuals: Record<LaneItem['kind'], LaneItemVisual> = {
  barrier: { fill: '0xf4a261', glow: '0xffb86b', shape: 'block' },
  lowFence: { fill: '0xff6f59', glow: '0xff9f5a', shape: 'low-fence' },
  beam: { fill: '0x8b5cf6', glow: '0xb78cff', shape: 'beam' },
  hazard: { fill: '0xef476f', glow: '0xff2bd6', shape: 'rift' },
  energy: { fill: '0x63d2ff', glow: '0xf6ff5d', shape: 'orb' },
  shield: { fill: '0x7ee787', glow: '0xa7f3d0', shape: 'hex' },
  boost: { fill: '0xb78cff', glow: '0x18f7ff', shape: 'crystal' },
};

export function getLaneItemVisual(kind: LaneItem['kind']): LaneItemVisual {
  return laneItemVisuals[kind];
}

export function hexToCss(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`;
}
```

- [ ] **Step 4: 运行测试并确认通过**

Run:

```bash
npm test -- tests/visual-theme.test.ts
```

Expected:

```text
PASS tests/visual-theme.test.ts
```

- [ ] **Step 5: 提交视觉主题**

Run:

```bash
git add src/game/visual/theme.ts tests/visual-theme.test.ts
git commit -m "添加霓虹日落视觉主题"
```

## Task 2: DOM HUD 与菜单视觉 polish

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 更新 CSS 变量和页面基调**

Modify the top of `src/styles.css`:

```css
:root {
  --color-sky-top: #ff9f5a;
  --color-sky-mid: #b45cff;
  --color-night: #101820;
  --color-panel: rgba(16, 24, 32, 0.68);
  --color-panel-strong: rgba(16, 24, 32, 0.82);
  --color-text: #f8fafc;
  --color-muted: rgba(248, 250, 252, 0.72);
  --color-cyan: #18f7ff;
  --color-purple: #8b5cf6;
  --color-gold: #f6ff5d;
  --color-danger: #ef476f;
  --radius-ui: 8px;
  color: var(--color-text);
  background: var(--color-night);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

- [ ] **Step 2: 替换 app 背景和手机视窗样式**

Modify `#app-shell` and `#phone-frame` in `src/styles.css`:

```css
#app-shell {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 8%, rgba(255, 159, 90, 0.3), transparent 34%),
    linear-gradient(180deg, #231839 0%, #101820 68%, #081016 100%);
}

#phone-frame {
  position: relative;
  width: min(100vw, 56.25vh);
  height: min(100vh, 177.78vw);
  max-width: 430px;
  max-height: 932px;
  overflow: hidden;
  background: #101820;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.14),
    0 24px 80px rgba(0, 0, 0, 0.38),
    0 0 44px rgba(24, 247, 255, 0.12);
}
```

- [ ] **Step 3: 升级 HUD 胶囊和能量条**

Modify `.hud-bar`, `.boost-bar`, `.pause-button`:

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
  font-size: 15px;
  font-weight: 850;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.hud-bar span {
  min-height: 32px;
  display: inline-grid;
  align-items: center;
  padding: 5px 10px;
  border: 1px solid rgba(24, 247, 255, 0.22);
  border-radius: 999px;
  background: rgba(16, 24, 32, 0.48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 18px rgba(24, 247, 255, 0.1);
  backdrop-filter: blur(8px);
}

.hud-bar span:nth-child(2) {
  justify-self: center;
}

.hud-bar span:last-child {
  justify-self: end;
  text-align: right;
}

.boost-bar {
  position: absolute;
  top: max(50px, calc(env(safe-area-inset-top) + 38px));
  left: 72px;
  right: 72px;
  height: 7px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(248, 250, 252, 0.16);
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.18);
}

.boost-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--color-cyan), var(--color-gold));
  box-shadow: 0 0 16px rgba(246, 255, 93, 0.7);
  transition: width 140ms ease-out;
}

.pause-button {
  pointer-events: auto;
  position: absolute;
  top: max(60px, calc(env(safe-area-inset-top) + 48px));
  right: 12px;
  width: 52px;
  height: 36px;
  border: 1px solid rgba(248, 250, 252, 0.18);
  border-radius: var(--radius-ui);
  background: rgba(16, 24, 32, 0.44);
  color: var(--color-text);
  font-weight: 800;
  backdrop-filter: blur(8px);
}
```

- [ ] **Step 4: 升级菜单和按钮**

Modify `.primary-action`, `.secondary-action`, `.menu-screen`, `.menu-screen h1`, `.menu-screen p`:

```css
.primary-action,
.secondary-action {
  pointer-events: auto;
  min-width: 148px;
  min-height: 48px;
  border-radius: var(--radius-ui);
  font-size: 17px;
  font-weight: 850;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out, border-color 120ms ease-out;
}

.primary-action {
  border: 0;
  background: linear-gradient(135deg, var(--color-gold), #ff9f5a);
  color: #101820;
  box-shadow: 0 10px 26px rgba(246, 255, 93, 0.22), 0 0 28px rgba(255, 159, 90, 0.2);
}

.secondary-action {
  border: 1px solid rgba(24, 247, 255, 0.34);
  background: rgba(16, 24, 32, 0.46);
  color: var(--color-text);
}

.primary-action:active,
.secondary-action:active {
  transform: translateY(1px) scale(0.99);
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
  background:
    radial-gradient(circle at 50% 28%, rgba(180, 92, 255, 0.2), transparent 38%),
    rgba(8, 16, 22, 0.58);
  backdrop-filter: blur(6px);
}

.menu-screen.compact {
  background: rgba(8, 16, 22, 0.72);
}

.menu-screen h1 {
  margin: 0;
  color: var(--color-text);
  font-size: 38px;
  letter-spacing: 0;
  text-shadow: 0 0 22px rgba(24, 247, 255, 0.34);
}

.menu-screen p {
  margin: 0;
  color: var(--color-muted);
  font-size: 18px;
}
```

- [ ] **Step 5: 构建验证并提交**

Run:

```bash
npm run build
```

Expected:

```text
✓ built
```

Run:

```bash
git add src/styles.css
git commit -m "升级霓虹日落HUD样式"
```

## Task 3: 程序化视觉工厂

**Files:**
- Create: `src/game/visual/GameVisualFactory.ts`
- Modify: `src/game/scenes/GameScene.ts`

- [ ] **Step 1: 创建视觉工厂**

Create `src/game/visual/GameVisualFactory.ts`:

```ts
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LANE_X } from '../config';
import type { LaneItem } from '../spawn/patterns';
import { getLaneItemVisual, neonSunsetTheme } from './theme';

export interface PlayerVisual {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  core: Phaser.GameObjects.Ellipse;
  trail: Phaser.GameObjects.Rectangle;
  shieldRing: Phaser.GameObjects.Arc;
}

export interface MovingVisualItem extends LaneItem {
  container: Phaser.GameObjects.Container;
  hitArea: Phaser.GameObjects.Rectangle;
}

export class GameVisualFactory {
  constructor(private readonly scene: Phaser.Scene) {}

  createBackground(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const top = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.25, GAME_WIDTH, GAME_HEIGHT * 0.55, neonSunsetTheme.colors.skyMid, 0.72);
    const night = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, GAME_WIDTH, GAME_HEIGHT * 0.7, neonSunsetTheme.colors.night, 1);
    const sun = this.scene.add.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.18, 76, neonSunsetTheme.colors.skyTop, 0.24);
    const skyline = this.scene.add.graphics();

    skyline.fillStyle(0x081016, 0.55);
    for (let index = 0; index < 9; index += 1) {
      const width = 28 + (index % 3) * 12;
      const height = 46 + (index % 4) * 18;
      skyline.fillRect(index * 48 - 18, GAME_HEIGHT * 0.44 - height, width, height);
    }

    container.add([top, night, sun, skyline]);
    return container;
  }

  createTrack(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const track = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, neonSunsetTheme.track.width, GAME_HEIGHT, neonSunsetTheme.colors.track, 0.94);
    container.add(track);

    for (let y = 36; y < GAME_HEIGHT; y += 54) {
      const grid = this.scene.add.rectangle(GAME_WIDTH / 2, y, neonSunsetTheme.track.width - 18, 1, neonSunsetTheme.colors.laneCyan, neonSunsetTheme.track.gridAlpha);
      container.add(grid);
    }

    for (const [index, laneX] of LANE_X.entries()) {
      const color = index === 1 ? neonSunsetTheme.colors.laneCyan : neonSunsetTheme.colors.lanePurple;
      const line = this.scene.add.rectangle(laneX, GAME_HEIGHT / 2, neonSunsetTheme.track.laneGlowWidth, GAME_HEIGHT, color, 0.42);
      container.add(line);
    }

    return container;
  }

  createPlayer(): PlayerVisual {
    const trail = this.scene.add.rectangle(0, 28, 18, neonSunsetTheme.player.trailLength, neonSunsetTheme.colors.playerBody, 0.24);
    const body = this.scene.add.rectangle(0, 0, neonSunsetTheme.player.width, neonSunsetTheme.player.height, neonSunsetTheme.colors.playerBody, 1);
    const core = this.scene.add.ellipse(0, -6, 14, 18, neonSunsetTheme.colors.playerCore, 1);
    const shieldRing = this.scene.add.circle(0, 0, 34, neonSunsetTheme.colors.playerBody, 0);

    body.setStrokeStyle(2, neonSunsetTheme.colors.playerCore, 0.75);
    trail.setOrigin(0.5, 0);
    shieldRing.setStrokeStyle(2, 0x7ee787, 0);

    const container = this.scene.add.container(LANE_X[1], GAME_HEIGHT - 132, [trail, body, core, shieldRing]);
    return { container, body, core, trail, shieldRing };
  }

  createLaneItem(item: LaneItem): MovingVisualItem {
    const visual = getLaneItemVisual(item.kind);
    const fill = Number(visual.fill);
    const glow = Number(visual.glow);
    const container = this.scene.add.container(LANE_X[item.lane], -40);
    const hitArea = this.scene.add.rectangle(0, 0, 44, 44, fill, 0);

    if (visual.shape === 'orb') {
      const orb = this.scene.add.circle(0, 0, 13, fill, 1);
      orb.setStrokeStyle(2, glow, 0.8);
      container.add(orb);
    } else if (visual.shape === 'hex' || visual.shape === 'crystal') {
      const gem = this.scene.add.polygon(0, 0, [0, -20, 18, -8, 16, 14, 0, 22, -16, 14, -18, -8], fill, 1);
      gem.setStrokeStyle(2, glow, 0.82);
      container.add(gem);
    } else if (visual.shape === 'beam') {
      const beam = this.scene.add.rectangle(0, 0, 118, 18, fill, 1);
      beam.setStrokeStyle(2, glow, 0.9);
      hitArea.setSize(118, 24);
      container.add(beam);
    } else if (visual.shape === 'low-fence') {
      const fence = this.scene.add.rectangle(0, 8, 54, 22, fill, 1);
      fence.setStrokeStyle(2, glow, 0.84);
      hitArea.setSize(54, 26);
      container.add(fence);
    } else if (visual.shape === 'rift') {
      const rift = this.scene.add.polygon(0, 0, [-16, -24, 16, -14, 4, 0, 18, 24, -18, 14, -5, 0], fill, 1);
      rift.setStrokeStyle(2, glow, 0.95);
      container.add(rift);
    } else {
      const block = this.scene.add.rectangle(0, 0, 46, 42, fill, 1);
      block.setStrokeStyle(2, glow, 0.82);
      container.add(block);
    }

    container.add(hitArea);
    return { ...item, container, hitArea };
  }
}
```

- [ ] **Step 2: 将 `GameScene` 的视觉创建改为工厂**

Modify imports and fields in `src/game/scenes/GameScene.ts`:

```ts
import { GameVisualFactory, type MovingVisualItem, type PlayerVisual } from '../visual/GameVisualFactory';
```

Replace fields:

```ts
private player!: PlayerVisual;
private visualFactory!: GameVisualFactory;
private items: MovingVisualItem[] = [];
```

In `create()` after `resetRuntimeFields()`:

```ts
this.visualFactory = new GameVisualFactory(this);
this.visualFactory.createBackground();
this.visualFactory.createTrack();
this.player = this.visualFactory.createPlayer();
this.publishState();
```

Remove the old `drawTrack()` call and old `this.add.rectangle(...)` player creation.

In `spawnPattern()` replace item creation:

```ts
for (const item of items) {
  this.items.push(this.visualFactory.createLaneItem(item));
}
```

In `moveItems()` replace shape movement and bounds:

```ts
const playerBounds = this.player.container.getBounds();
for (const item of this.items) {
  item.container.y += pixels;

  if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, item.hitArea.getBounds())) {
    this.runState = resolveCollision(this.runState, item);
    item.container.destroy();
  }
}

this.items = this.items.filter((item) => {
  const keep = item.container.active && item.container.y < GAME_HEIGHT + 80;
  if (!keep && item.container.active) {
    item.container.destroy();
  }
  return keep;
});
```

In `syncPlayerPosition()` replace `this.player.x` and scale writes:

```ts
this.player.container.x = Phaser.Math.Linear(this.player.container.x, LANE_X[snapshot.lane], 0.35);
this.player.container.setScale(1, snapshot.motion === 'sliding' ? 0.62 : snapshot.motion === 'jumping' ? 0.86 : 1);
```

- [ ] **Step 3: 删除旧的颜色/尺寸 helper**

Remove from `src/game/scenes/GameScene.ts`:

```ts
private drawTrack(): void { ... }
private getItemColor(...): number { ... }
private getItemSize(...): { width: number; height: number } { ... }
```

- [ ] **Step 4: 验证**

Run:

```bash
npm test
npm run build
```

Expected:

```text
Test Files 6 passed
✓ built
```

- [ ] **Step 5: 提交程序化视觉工厂**

Run:

```bash
git add src/game/visual/GameVisualFactory.ts src/game/scenes/GameScene.ts
git commit -m "接入程序化游戏视觉工厂"
```

## Task 4: 基础反馈动效控制器

**Files:**
- Create: `src/game/visual/EffectController.ts`
- Modify: `src/game/scenes/GameScene.ts`

- [ ] **Step 1: 创建效果控制器**

Create `src/game/visual/EffectController.ts`:

```ts
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LANE_X } from '../config';
import type { LaneItem } from '../spawn/patterns';
import type { PlayerVisual } from './GameVisualFactory';
import { getLaneItemVisual, neonSunsetTheme } from './theme';

export class EffectController {
  private speedLines: Phaser.GameObjects.Rectangle[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  createSpeedLines(): void {
    for (let index = 0; index < 10; index += 1) {
      const x = index % 2 === 0 ? 28 : GAME_WIDTH - 28;
      const y = 42 + index * 84;
      const line = this.scene.add.rectangle(x, y, 2, 54, neonSunsetTheme.colors.laneCyan, 0);
      this.speedLines.push(line);
    }
  }

  updateBoost(isBoosting: boolean): void {
    for (const [index, line] of this.speedLines.entries()) {
      line.setAlpha(isBoosting ? 0.22 + (index % 3) * 0.08 : 0);
      line.y += isBoosting ? 12 : 0;
      if (line.y > GAME_HEIGHT + 50) {
        line.y = -40;
      }
    }
  }

  playLaneChange(player: PlayerVisual, lane: number): void {
    const laneFlash = this.scene.add.rectangle(LANE_X[lane], GAME_HEIGHT - 132, 78, 80, neonSunsetTheme.colors.laneCyan, 0.18);
    this.scene.tweens.add({
      targets: laneFlash,
      alpha: 0,
      scaleY: 1.6,
      duration: neonSunsetTheme.motion.laneTweenMs,
      onComplete: () => laneFlash.destroy(),
    });

    this.scene.tweens.add({
      targets: player.container,
      angle: lane === 0 ? -8 : lane === 2 ? 8 : 0,
      duration: 70,
      yoyo: true,
    });
  }

  playPickup(item: LaneItem, x: number, y: number): void {
    const visual = getLaneItemVisual(item.kind);
    const flash = this.scene.add.circle(x, y, 18, Number(visual.glow), 0.45);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.8,
      duration: neonSunsetTheme.motion.pickupMs,
      onComplete: () => flash.destroy(),
    });
  }

  playShield(player: PlayerVisual): void {
    player.shieldRing.setAlpha(0.95);
    this.scene.tweens.add({
      targets: player.shieldRing,
      alpha: 0,
      scale: 1.35,
      duration: neonSunsetTheme.motion.shieldMs,
      onComplete: () => player.shieldRing.setScale(1),
    });
  }

  playImpact(player: PlayerVisual): void {
    this.scene.cameras.main.shake(neonSunsetTheme.motion.impactShakeMs, 0.006);
    this.scene.tweens.add({
      targets: player.core,
      alpha: 0.2,
      duration: 55,
      yoyo: true,
      repeat: 2,
    });
  }

  playGameOver(x: number, y: number): void {
    const blast = this.scene.add.circle(x, y, 22, 0xef476f, 0.5);
    this.scene.tweens.add({
      targets: blast,
      alpha: 0,
      scale: 2.4,
      duration: neonSunsetTheme.motion.gameOverMs,
      onComplete: () => blast.destroy(),
    });
  }
}
```

- [ ] **Step 2: 在 `GameScene` 中接入效果控制器**

Modify imports:

```ts
import { EffectController } from '../visual/EffectController';
```

Add field:

```ts
private effects!: EffectController;
```

In `create()` after visual factory creation:

```ts
this.effects = new EffectController(this);
this.effects.createSpeedLines();
```

In `update()` after `moveItems(deltaMs)`:

```ts
this.effects.updateBoost(this.runState.isBoosting);
```

In `applyAction()` after applying lane action:

```ts
const beforeLane = this.laneController.snapshot().lane;
this.laneController.applyAction(action);
const afterLane = this.laneController.snapshot().lane;
if (afterLane !== beforeLane) {
  this.effects.playLaneChange(this.player, afterLane);
}
```

In `moveItems()` before destroying a collided item:

```ts
const beforeGameOver = this.runState.isGameOver;
this.runState = resolveCollision(this.runState, item);
if (item.kind === 'energy' || item.kind === 'shield' || item.kind === 'boost') {
  this.effects.playPickup(item, item.container.x, item.container.y);
}
if (item.kind === 'shield') {
  this.effects.playShield(this.player);
}
if (this.runState.isGameOver && !beforeGameOver) {
  this.effects.playGameOver(this.player.container.x, this.player.container.y);
} else if (item.kind !== 'energy' && item.kind !== 'shield' && item.kind !== 'boost') {
  this.effects.playImpact(this.player);
}
item.container.destroy();
```

- [ ] **Step 3: 验证并提交**

Run:

```bash
npm test
npm run build
```

Expected:

```text
Test Files 6 passed
✓ built
```

Run:

```bash
git add src/game/visual/EffectController.ts src/game/scenes/GameScene.ts
git commit -m "添加基础视觉反馈动效"
```

## Task 5: 浏览器视觉验收与小屏保护

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 增加 reduced motion 和小屏保护样式**

Append to `src/styles.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}

@media (max-width: 360px) {
  .hud-bar {
    font-size: 13px;
    gap: 6px;
  }

  .hud-bar span {
    min-height: 30px;
    padding: 4px 8px;
  }

  .boost-bar {
    left: 62px;
    right: 62px;
  }

  .menu-screen h1 {
    font-size: 32px;
  }

  .primary-action,
  .secondary-action {
    min-width: 136px;
  }
}
```

- [ ] **Step 2: 运行验证命令**

Run:

```bash
npm test
npm run build
npm audit --audit-level=high
```

Expected:

```text
Test Files 6 passed
✓ built
found 0 vulnerabilities
```

- [ ] **Step 3: 启动或复用本地服务**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected:

```text
Local:   http://127.0.0.1:5173/
```

If a dev server is already running, keep it and use the existing URL.

- [ ] **Step 4: 浏览器人工验收**

Open:

```text
http://127.0.0.1:5173/
http://127.0.0.1:5173/?debug=1
```

Manual checks:

- 开始页显示霓虹日落风格，而不是灰色方块原型。
- 游戏开始后跑道有日落背景、霓虹轨道线和速度网格。
- 玩家、能量球、护盾、磁吸、障碍形状可区分。
- 换轨、拾取、撞击、疾跑有清楚反馈。
- 顶部 HUD 不遮挡跑道核心区域。
- debug 页右侧面板仍可用，且不抢游戏视窗焦点。
- “再来一局”仍能恢复新局。

- [ ] **Step 5: 提交小屏保护和验收状态**

Run:

```bash
git add src/styles.css
git commit -m "完善移动端视觉适配"
```

## Task 6: 规格验收记录与最终提交

**Files:**
- Modify: `docs/superpowers/specs/2026-05-02-visual-upgrade-design.md`

- [ ] **Step 1: 追加实现验收记录**

Append to `docs/superpowers/specs/2026-05-02-visual-upgrade-design.md`:

```md

## 程序化视觉升级实现记录

- 已提取霓虹日落主题常量。
- 已建立程序化游戏视觉工厂。
- 已重绘日落背景、霓虹跑道、玩家、障碍和道具。
- 已加入换轨、拾取、护盾、撞击、疾跑和失败反馈。
- 已升级 HUD、开始页、暂停页、结算页和 PC 调试面板视觉。
- 已保留核心玩法规则、输入、最高分和 debug 行为。
- 已通过单元测试、生产构建、安全审计和浏览器页面验收。
```

- [ ] **Step 2: 最终验证**

Run:

```bash
npm test
npm run build
npm audit --audit-level=high
git status --short
```

Expected:

```text
Test Files 6 passed
✓ built
found 0 vulnerabilities
 M docs/superpowers/specs/2026-05-02-visual-upgrade-design.md
```

- [ ] **Step 3: 提交验收记录**

Run:

```bash
git add docs/superpowers/specs/2026-05-02-visual-upgrade-design.md
git commit -m "补充视觉升级验收记录"
```

## 自检清单

- 视觉主题覆盖所有当前障碍和道具类型。
- 游戏规则模块不因视觉升级发生行为变化。
- `GameScene` 不再散落主要颜色和形状常量。
- DOM HUD 使用 CSS 变量和移动端保护样式。
- 动效用于反馈状态变化，不持续遮挡游戏区域。
- 普通页和 `?debug=1` 页面都经过浏览器验收。
- 所有提交日志使用中文。
