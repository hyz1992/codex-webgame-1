# 切线冲刺首批正式资产包 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成并接入首批静态游戏画面资产，让玩家、道具、障碍、背景和赛道装饰从程序化原型升级为图片资产版本。

**Architecture:** 先建立资产 manifest、校验脚本和 Phaser preload 接口，再生成图片并把最终 PNG 放入 `public/assets/game/`。运行时通过 `AssetVisualFactory` 优先创建 sprite，图片缺失或纹理不可用时回退到现有 `GameVisualFactory` 的程序化图形。

**Tech Stack:** Phaser 3、TypeScript、Vite、Vitest、OpenAI imagegen built-in、imagegen chroma-key helper、PNG assets、PowerShell。

---

## 文件结构

- Create: `src/game/assets/assetManifest.ts`
  - 定义所有运行时资产 key、路径、目标显示尺寸、锚点和类别。
- Create: `src/game/assets/preloadGameAssets.ts`
  - 从 manifest 向 Phaser loader 注册图片。
- Create: `tests/asset-manifest.test.ts`
  - 验证 manifest 覆盖设计文档要求，并保持 key/path/尺寸稳定。
- Create: `scripts/validate-assets.mjs`
  - 校验 `public/assets/game/` 下的 PNG 是否存在、路径是否正确、头部是否为 PNG。
- Modify: `package.json`
  - 增加 `assets:validate` 脚本。
- Create: `public/assets/game/.gitkeep`
  - 确保运行时资产目录进入仓库。
- Create: `artifacts/asset-generation/.gitkeep`
  - 保存生成中间产物目录结构；后续可只提交最终资产。
- Create: `docs/assets/first-pack-prompts.md`
  - 记录首批 imagegen prompt、输出文件名和验收规则。
- Create: `src/game/visual/AssetVisualFactory.ts`
  - 使用图片资产创建背景、赛道装饰、玩家和 lane item。
- Modify: `src/game/visual/GameVisualFactory.ts`
  - 暴露可复用的 fallback 创建方法，保持当前程序化视觉可用。
- Modify: `src/game/scenes/GameScene.ts`
  - 增加 `preload()`，在 `create()` 使用 `AssetVisualFactory`。
- Modify: `docs/superpowers/specs/2026-05-02-asset-pack-design.md`
  - 追加实现验收记录。

## Task 1: 资产 Manifest 与目录

**Files:**
- Create: `tests/asset-manifest.test.ts`
- Create: `src/game/assets/assetManifest.ts`
- Create: `public/assets/game/.gitkeep`
- Create: `artifacts/asset-generation/.gitkeep`

- [ ] **Step 1: 写 manifest 失败测试**

Create `tests/asset-manifest.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { gameAssetManifest, getLaneItemAsset } from '../src/game/assets/assetManifest';

describe('gameAssetManifest', () => {
  it('覆盖首批正式资产包要求的所有运行时图片', () => {
    expect(gameAssetManifest.player.key).toBe('player-seed');
    expect(gameAssetManifest.backgrounds.map((asset) => asset.key)).toEqual(['bg-sunset-sky', 'bg-city-silhouette']);
    expect(gameAssetManifest.track.map((asset) => asset.key)).toEqual(['track-edge-glow', 'track-speed-grid']);
    expect(gameAssetManifest.items.map((asset) => asset.laneItemKind)).toEqual([
      'energy',
      'shield',
      'boost',
      'barrier',
      'lowFence',
      'beam',
      'hazard',
    ]);
  });

  it('所有运行时资源都来自 public/assets/game 并使用 PNG', () => {
    const assets = [
      gameAssetManifest.player,
      ...gameAssetManifest.backgrounds,
      ...gameAssetManifest.track,
      ...gameAssetManifest.items,
    ];

    for (const asset of assets) {
      expect(asset.path).toMatch(/^\/assets\/game\/.+\.png$/);
      expect(asset.key.length).toBeGreaterThan(0);
      expect(asset.display.width).toBeGreaterThan(0);
      expect(asset.display.height).toBeGreaterThan(0);
    }
  });

  it('可根据 LaneItem kind 找到稳定的图片资产', () => {
    expect(getLaneItemAsset('energy').key).toBe('item-energy');
    expect(getLaneItemAsset('lowFence').key).toBe('obstacle-low-fence');
    expect(getLaneItemAsset('hazard').path).toBe('/assets/game/obstacle-hazard.png');
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm test -- tests/asset-manifest.test.ts
```

Expected:

```text
FAIL tests/asset-manifest.test.ts
Failed to resolve import "../src/game/assets/assetManifest"
```

- [ ] **Step 3: 实现 asset manifest**

Create `src/game/assets/assetManifest.ts`:

```ts
import type { LaneItem } from '../spawn/patterns';

export type GameAssetKind = 'player' | 'background' | 'track' | 'item';

export interface GameAssetDefinition {
  key: string;
  path: `/assets/game/${string}.png`;
  display: {
    width: number;
    height: number;
  };
  origin: {
    x: number;
    y: number;
  };
  kind: GameAssetKind;
}

export interface LaneItemAssetDefinition extends GameAssetDefinition {
  laneItemKind: LaneItem['kind'];
}

export const gameAssetManifest = {
  player: {
    key: 'player-seed',
    path: '/assets/game/player-seed.png',
    display: { width: 42, height: 64 },
    origin: { x: 0.5, y: 0.82 },
    kind: 'player',
  },
  backgrounds: [
    {
      key: 'bg-sunset-sky',
      path: '/assets/game/bg-sunset-sky.png',
      display: { width: 390, height: 844 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'background',
    },
    {
      key: 'bg-city-silhouette',
      path: '/assets/game/bg-city-silhouette.png',
      display: { width: 390, height: 844 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'background',
    },
  ],
  track: [
    {
      key: 'track-edge-glow',
      path: '/assets/game/track-edge-glow.png',
      display: { width: 64, height: 844 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'track',
    },
    {
      key: 'track-speed-grid',
      path: '/assets/game/track-speed-grid.png',
      display: { width: 290, height: 256 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'track',
    },
  ],
  items: [
    {
      key: 'item-energy',
      path: '/assets/game/item-energy.png',
      display: { width: 34, height: 34 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'energy',
    },
    {
      key: 'item-shield',
      path: '/assets/game/item-shield.png',
      display: { width: 40, height: 40 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'shield',
    },
    {
      key: 'item-boost',
      path: '/assets/game/item-boost.png',
      display: { width: 40, height: 40 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'boost',
    },
    {
      key: 'obstacle-barrier',
      path: '/assets/game/obstacle-barrier.png',
      display: { width: 50, height: 46 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'barrier',
    },
    {
      key: 'obstacle-low-fence',
      path: '/assets/game/obstacle-low-fence.png',
      display: { width: 58, height: 28 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'lowFence',
    },
    {
      key: 'obstacle-beam',
      path: '/assets/game/obstacle-beam.png',
      display: { width: 118, height: 26 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'beam',
    },
    {
      key: 'obstacle-hazard',
      path: '/assets/game/obstacle-hazard.png',
      display: { width: 54, height: 54 },
      origin: { x: 0.5, y: 0.5 },
      kind: 'item',
      laneItemKind: 'hazard',
    },
  ],
} as const satisfies {
  player: GameAssetDefinition;
  backgrounds: readonly GameAssetDefinition[];
  track: readonly GameAssetDefinition[];
  items: readonly LaneItemAssetDefinition[];
};

export type GameAssetManifest = typeof gameAssetManifest;

export function getAllGameAssets(): GameAssetDefinition[] {
  return [
    gameAssetManifest.player,
    ...gameAssetManifest.backgrounds,
    ...gameAssetManifest.track,
    ...gameAssetManifest.items,
  ];
}

export function getLaneItemAsset(kind: LaneItem['kind']): LaneItemAssetDefinition {
  const asset = gameAssetManifest.items.find((item) => item.laneItemKind === kind);
  if (!asset) {
    throw new Error(`Missing lane item asset for ${kind}`);
  }
  return asset;
}
```

- [ ] **Step 4: 创建目录保留文件**

Create empty files:

```text
public/assets/game/.gitkeep
artifacts/asset-generation/.gitkeep
```

- [ ] **Step 5: 运行 manifest 测试**

Run:

```bash
npm test -- tests/asset-manifest.test.ts
```

Expected:

```text
PASS tests/asset-manifest.test.ts
```

- [ ] **Step 6: 提交 manifest**

Run:

```bash
git add src/game/assets/assetManifest.ts tests/asset-manifest.test.ts public/assets/game/.gitkeep artifacts/asset-generation/.gitkeep
git commit -m "添加首批游戏资产清单"
```

## Task 2: 资产校验脚本与 Prompt 文档

**Files:**
- Create: `scripts/validate-assets.mjs`
- Modify: `package.json`
- Create: `docs/assets/first-pack-prompts.md`

- [ ] **Step 1: 编写资产校验脚本**

Create `scripts/validate-assets.mjs`:

```js
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assetPaths = [
  '/assets/game/player-seed.png',
  '/assets/game/bg-sunset-sky.png',
  '/assets/game/bg-city-silhouette.png',
  '/assets/game/track-edge-glow.png',
  '/assets/game/track-speed-grid.png',
  '/assets/game/item-energy.png',
  '/assets/game/item-shield.png',
  '/assets/game/item-boost.png',
  '/assets/game/obstacle-barrier.png',
  '/assets/game/obstacle-low-fence.png',
  '/assets/game/obstacle-beam.png',
  '/assets/game/obstacle-hazard.png',
];
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const missing = [];
const invalid = [];

for (const assetPath of assetPaths) {
  const absolutePath = join(root, 'public', assetPath.replace('/assets/', 'assets/'));
  if (!existsSync(absolutePath)) {
    missing.push(assetPath);
    continue;
  }

  const header = readFileSync(absolutePath).subarray(0, 8);
  if (!header.equals(pngSignature)) {
    invalid.push(assetPath);
  }
}

if (missing.length > 0 || invalid.length > 0) {
  if (missing.length > 0) {
    console.error(`Missing assets:\n${missing.map((path) => `- ${path}`).join('\n')}`);
  }
  if (invalid.length > 0) {
    console.error(`Invalid PNG assets:\n${invalid.map((path) => `- ${path}`).join('\n')}`);
  }
  process.exit(1);
}

console.log(`Validated ${assetPaths.length} runtime PNG assets.`);
```

- [ ] **Step 2: 增加 npm 脚本**

Modify `package.json` scripts:

```json
"assets:validate": "node scripts/validate-assets.mjs"
```

- [ ] **Step 3: 记录首批 imagegen prompts**

Create `docs/assets/first-pack-prompts.md`:

```md
# 《切线冲刺》首批正式资产包 Prompts

## 通用风格

Neon sunset arcade mobile runner game asset, readable at small size, bold silhouette, crisp edges, slight emissive rim light, clean production game asset, not concept art, no text, no watermark.

## 透明物件生成规则

Create the requested subject on a perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation. Keep the subject fully separated from the background with crisp edges and generous padding. Do not use #00ff00 anywhere in the subject. No cast shadow, no contact shadow, no reflection, no watermark, and no text.

## Assets

### player-seed.png

128 x 128 source. A front-facing slightly top-down neon energy runner for a mobile arcade lane runner, cyan suit, bright yellow energy core, small purple edge highlights, compact readable body silhouette, generous padding, transparent final PNG.

### item-energy.png

96 x 96 source. A cyan and yellow glowing energy orb pickup, round silhouette, reward feel, crisp rim, readable at 34 px, transparent final PNG.

### item-shield.png

96 x 96 source. A green shield pickup with hexagonal protection symbol, distinct from a round energy orb, readable at 40 px, transparent final PNG.

### item-boost.png

96 x 96 source. A purple-blue boost crystal or propulsion core pickup, angular silhouette, distinct from shield and energy orb, readable at 40 px, transparent final PNG.

### obstacle-barrier.png

96 x 96 source. A chunky orange neon road barrier obstacle, heavy block silhouette, warning edge highlights, readable at 50 x 46 px, transparent final PNG.

### obstacle-low-fence.png

96 x 96 source. A low red-orange horizontal fence obstacle for jumping over, very wide and low silhouette, warning highlights, readable at 58 x 28 px, transparent final PNG.

### obstacle-beam.png

96 x 96 source. A purple horizontal neon beam obstacle for sliding under, long horizontal silhouette, bright rim light, readable at 118 x 26 px after scaling, transparent final PNG.

### obstacle-hazard.png

96 x 96 source. A dangerous magenta cracked rift or broken road hazard, sharp irregular silhouette, highest danger feel, distinct from ordinary barriers, readable at 54 px, transparent final PNG.

### bg-sunset-sky.png

390 x 844 source. Vertical mobile game background only, warm orange to purple sunset sky fading into deep blue night, soft distant glow, no road, no UI, no text.

### bg-city-silhouette.png

390 x 844 source. Transparent final PNG. Distant futuristic city skyline silhouette for a neon sunset runner, dark blue shapes with subtle purple rim light, keep bottom gameplay area calm and not busy.

### track-edge-glow.png

64 x 844 source. Transparent vertical neon cyan-purple track edge glow strip, subtle texture, no text, designed to sit at lane-road edge without hiding gameplay.

### track-speed-grid.png

290 x 256 source. Transparent repeating track speed grid tile, thin cyan-purple perspective lines and small speed marks, low opacity, readable but not busy.
```

- [ ] **Step 4: 运行校验并确认现在失败**

Run:

```bash
npm run assets:validate
```

Expected:

```text
Missing assets:
- /assets/game/player-seed.png
...
```

- [ ] **Step 5: 提交校验工具和 prompt 文档**

Run:

```bash
git add scripts/validate-assets.mjs package.json docs/assets/first-pack-prompts.md
git commit -m "添加资产校验脚本和生成提示词"
```

## Task 3: 生成首批静态图片资产

**Files:**
- Create PNG files under `public/assets/game/`
- Create intermediate files under `artifacts/asset-generation/`

- [ ] **Step 1: 生成并保存背景层**

Use built-in `image_gen` with these prompts:

```text
Create a 390 x 844 vertical mobile game background only for a neon sunset arcade lane runner. Warm orange sun glow at the upper third, purple sunset sky fading into deep blue night, clean stylized game art, subtle atmospheric depth. No road, no UI, no text, no logo, no characters, no obstacles. Keep the lower gameplay area dark and calm so bright objects remain readable.
```

Save selected output:

```text
public/assets/game/bg-sunset-sky.png
```

Use built-in `image_gen` with this prompt:

```text
Create a distant futuristic city skyline silhouette layer for a neon sunset arcade runner on a perfectly flat solid #00ff00 chroma-key background for background removal. 390 x 844 vertical canvas. Dark blue skyline shapes with subtle purple rim light, placed mostly in the upper half and horizon area, bottom gameplay area calm and sparse. No road, no UI, no text, no logo. Background must be uniform #00ff00 with no shadows or gradients.
```

Save source under `artifacts/asset-generation/bg-city-silhouette-source.png`, remove chroma key, save final:

```text
public/assets/game/bg-city-silhouette.png
```

- [ ] **Step 2: 生成并保存玩家 seed frame**

Use built-in `image_gen`:

```text
Create a 128 x 128 source image of a front-facing slightly top-down neon energy runner for a mobile arcade lane runner on a perfectly flat solid #00ff00 chroma-key background for background removal. Cyan suit, bright yellow energy core in the chest, small purple edge highlights, compact readable body silhouette, crisp edges, slight emissive rim light, generous padding, production game asset, not concept art. No ground, no cast shadow, no text, no watermark. Do not use #00ff00 anywhere in the subject.
```

Save source under `artifacts/asset-generation/player-seed-source.png`, remove chroma key, save final:

```text
public/assets/game/player-seed.png
```

- [ ] **Step 3: 生成并保存 3 个奖励物**

Generate each 96 x 96 source on chroma-key background, then remove chroma key:

```text
Create a cyan and yellow glowing energy orb pickup for a neon sunset arcade mobile runner on a perfectly flat solid #00ff00 chroma-key background for background removal. 96 x 96 source, round silhouette, reward feel, crisp rim, slight emissive glow, generous padding, readable at 34 px. No text, no watermark, no shadow, do not use #00ff00 in the subject.
```

Final:

```text
public/assets/game/item-energy.png
```

```text
Create a green shield pickup with a hexagonal protection symbol for a neon sunset arcade mobile runner on a perfectly flat solid #00ff00 chroma-key background for background removal. 96 x 96 source, distinct from a round energy orb, crisp silhouette, slight emissive rim light, generous padding, readable at 40 px. No text, no watermark, no shadow, do not use #00ff00 in the subject.
```

Final:

```text
public/assets/game/item-shield.png
```

```text
Create a purple-blue boost crystal or propulsion core pickup for a neon sunset arcade mobile runner on a perfectly flat solid #00ff00 chroma-key background for background removal. 96 x 96 source, angular silhouette, distinct from shield and energy orb, crisp edges, cyan rim light, generous padding, readable at 40 px. No text, no watermark, no shadow, do not use #00ff00 in the subject.
```

Final:

```text
public/assets/game/item-boost.png
```

- [ ] **Step 4: 生成并保存 4 个障碍物**

Generate each 96 x 96 source on chroma-key background, then remove chroma key:

```text
Create a chunky orange neon road barrier obstacle for a neon sunset arcade mobile runner on a perfectly flat solid #00ff00 chroma-key background for background removal. 96 x 96 source, heavy block silhouette, warning edge highlights, crisp rim, generous padding, readable at 50 x 46 px. No text, no watermark, no shadow, do not use #00ff00 in the subject.
```

Final:

```text
public/assets/game/obstacle-barrier.png
```

```text
Create a low red-orange horizontal fence obstacle for a neon sunset arcade mobile runner on a perfectly flat solid #00ff00 chroma-key background for background removal. 96 x 96 source, very wide and low silhouette, clearly suggests jump over it, warning highlights, generous padding, readable at 58 x 28 px. No text, no watermark, no shadow, do not use #00ff00 in the subject.
```

Final:

```text
public/assets/game/obstacle-low-fence.png
```

```text
Create a purple horizontal neon beam obstacle for a neon sunset arcade mobile runner on a perfectly flat solid #00ff00 chroma-key background for background removal. 96 x 96 source, long horizontal silhouette, clearly suggests slide under it, bright rim light, generous padding, readable at 118 x 26 px after scaling. No text, no watermark, no shadow, do not use #00ff00 in the subject.
```

Final:

```text
public/assets/game/obstacle-beam.png
```

```text
Create a dangerous magenta cracked rift or broken road hazard for a neon sunset arcade mobile runner on a perfectly flat solid #00ff00 chroma-key background for background removal. 96 x 96 source, sharp irregular silhouette, highest danger feel, distinct from ordinary barriers, generous padding, readable at 54 px. No text, no watermark, no shadow, do not use #00ff00 in the subject.
```

Final:

```text
public/assets/game/obstacle-hazard.png
```

- [ ] **Step 5: 生成并保存赛道装饰**

Use built-in `image_gen`:

```text
Create a 64 x 844 transparent-look source for a vertical neon cyan-purple track edge glow strip on a perfectly flat solid #00ff00 chroma-key background for background removal. Subtle arcade runner texture, thin bright center glow fading outward, no text, no symbols, no road, designed to sit at lane-road edge without hiding gameplay. Background must be uniform #00ff00.
```

Final:

```text
public/assets/game/track-edge-glow.png
```

Use built-in `image_gen`:

```text
Create a 290 x 256 transparent-look repeating track speed grid tile on a perfectly flat solid #00ff00 chroma-key background for background removal. Thin cyan-purple perspective lines and small speed marks, low opacity, clean arcade runner texture, not busy, no text, no symbols. Background must be uniform #00ff00.
```

Final:

```text
public/assets/game/track-speed-grid.png
```

- [ ] **Step 6: 校验 PNG 资产**

Run:

```bash
npm run assets:validate
```

Expected:

```text
Validated 12 runtime PNG assets.
```

- [ ] **Step 7: 提交首批图片资产**

Run:

```bash
git add public/assets/game artifacts/asset-generation
git commit -m "添加首批游戏画面图片资产"
```

## Task 4: Phaser 预加载与 Asset Visual Factory

**Files:**
- Create: `src/game/assets/preloadGameAssets.ts`
- Create: `src/game/visual/AssetVisualFactory.ts`
- Modify: `src/game/scenes/GameScene.ts`

- [ ] **Step 1: 写 preload helper 测试**

Create `tests/preload-assets.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { getAllGameAssets } from '../src/game/assets/assetManifest';
import { preloadGameAssets } from '../src/game/assets/preloadGameAssets';

describe('preloadGameAssets', () => {
  it('把 manifest 中的每个资源注册到 Phaser loader', () => {
    const image = vi.fn();
    const scene = { load: { image } };

    preloadGameAssets(scene);

    expect(image).toHaveBeenCalledTimes(getAllGameAssets().length);
    expect(image).toHaveBeenCalledWith('player-seed', '/assets/game/player-seed.png');
    expect(image).toHaveBeenCalledWith('obstacle-hazard', '/assets/game/obstacle-hazard.png');
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm test -- tests/preload-assets.test.ts
```

Expected:

```text
FAIL tests/preload-assets.test.ts
Failed to resolve import "../src/game/assets/preloadGameAssets"
```

- [ ] **Step 3: 实现 preload helper**

Create `src/game/assets/preloadGameAssets.ts`:

```ts
import { getAllGameAssets } from './assetManifest';

export interface ImageLoaderScene {
  load: {
    image: (key: string, url: string) => void;
  };
}

export function preloadGameAssets(scene: ImageLoaderScene): void {
  for (const asset of getAllGameAssets()) {
    scene.load.image(asset.key, asset.path);
  }
}
```

- [ ] **Step 4: 创建 AssetVisualFactory**

Create `src/game/visual/AssetVisualFactory.ts`:

```ts
import Phaser from 'phaser';
import { gameAssetManifest, getLaneItemAsset } from '../assets/assetManifest';
import { GAME_HEIGHT, GAME_WIDTH, LANE_X } from '../config';
import type { LaneItem } from '../spawn/patterns';
import { GameVisualFactory, type MovingVisualItem, type PlayerVisual } from './GameVisualFactory';

export class AssetVisualFactory {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly fallback: GameVisualFactory,
  ) {}

  createBackground(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    if (!this.hasTexture('bg-sunset-sky') || !this.hasTexture('bg-city-silhouette')) {
      return this.fallback.createBackground();
    }

    const sky = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-sunset-sky');
    sky.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    const skyline = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-city-silhouette');
    skyline.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    container.add([sky, skyline]);
    container.setDepth(0);
    return container;
  }

  createTrack(): Phaser.GameObjects.Container {
    const track = this.fallback.createTrack();
    if (!this.hasTexture('track-edge-glow') || !this.hasTexture('track-speed-grid')) {
      return track;
    }

    const leftGlow = this.scene.add.image(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2, 'track-edge-glow');
    const rightGlow = this.scene.add.image(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2, 'track-edge-glow');
    const grid = this.scene.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 290, GAME_HEIGHT, 'track-speed-grid');
    leftGlow.setDisplaySize(64, GAME_HEIGHT);
    rightGlow.setDisplaySize(64, GAME_HEIGHT);
    rightGlow.setFlipX(true);
    grid.setAlpha(0.45);
    track.add([grid, leftGlow, rightGlow]);
    return track;
  }

  createPlayer(): PlayerVisual {
    if (!this.hasTexture(gameAssetManifest.player.key)) {
      return this.fallback.createPlayer();
    }

    const fallbackPlayer = this.fallback.createPlayer();
    fallbackPlayer.body.setVisible(false);
    fallbackPlayer.core.setVisible(false);
    const sprite = this.scene.add.image(0, 0, gameAssetManifest.player.key);
    sprite.setDisplaySize(gameAssetManifest.player.display.width, gameAssetManifest.player.display.height);
    sprite.setOrigin(gameAssetManifest.player.origin.x, gameAssetManifest.player.origin.y);
    fallbackPlayer.container.add(sprite);
    fallbackPlayer.container.bringToTop(sprite);
    return fallbackPlayer;
  }

  createLaneItem(item: LaneItem): MovingVisualItem {
    const asset = getLaneItemAsset(item.kind);
    if (!this.hasTexture(asset.key)) {
      return this.fallback.createLaneItem(item);
    }

    const container = this.scene.add.container(LANE_X[item.lane], -40);
    const hitArea = this.scene.add.rectangle(0, 0, asset.display.width, asset.display.height, 0xffffff, 0);
    const sprite = this.scene.add.image(0, 0, asset.key);
    sprite.setDisplaySize(asset.display.width, asset.display.height);
    sprite.setOrigin(asset.origin.x, asset.origin.y);
    container.add([sprite, hitArea]);
    container.setDepth(3);
    return { ...item, container, hitArea };
  }

  private hasTexture(key: string): boolean {
    return this.scene.textures.exists(key);
  }
}
```

- [ ] **Step 5: 修改 GameScene 使用 preload 和 AssetVisualFactory**

Modify `src/game/scenes/GameScene.ts` imports:

```ts
import { preloadGameAssets } from '../assets/preloadGameAssets';
import { AssetVisualFactory } from '../visual/AssetVisualFactory';
```

Add field:

```ts
private assetVisualFactory!: AssetVisualFactory;
```

Add method:

```ts
preload(): void {
  preloadGameAssets(this);
}
```

In `create()` after `this.visualFactory = new GameVisualFactory(this);`:

```ts
this.assetVisualFactory = new AssetVisualFactory(this, this.visualFactory);
this.assetVisualFactory.createBackground();
this.assetVisualFactory.createTrack();
this.player = this.assetVisualFactory.createPlayer();
```

Remove the direct `this.visualFactory.createBackground()`, `this.visualFactory.createTrack()`, and `this.visualFactory.createPlayer()` calls.

In `spawnPattern()`:

```ts
this.items.push(this.assetVisualFactory.createLaneItem(item));
```

- [ ] **Step 6: 验证工程**

Run:

```bash
npm test
npm run build
```

Expected:

```text
Test Files 8 passed
✓ built
```

- [ ] **Step 7: 提交运行时接入**

Run:

```bash
git add src/game/assets/preloadGameAssets.ts src/game/visual/AssetVisualFactory.ts src/game/scenes/GameScene.ts tests/preload-assets.test.ts
git commit -m "接入首批图片资产运行时"
```

## Task 5: 浏览器验收与记录

**Files:**
- Modify: `docs/superpowers/specs/2026-05-02-asset-pack-design.md`

- [ ] **Step 1: 运行最终验证**

Run:

```bash
npm test
npm run build
npm audit --audit-level=high
npm run assets:validate
```

Expected:

```text
Test Files 8 passed
✓ built
found 0 vulnerabilities
Validated 12 runtime PNG assets.
```

- [ ] **Step 2: 检查本地页面可访问性**

Run:

```powershell
try { (Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5173/).StatusCode; (Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:5173/?debug=1').StatusCode } catch { $_.Exception.Message }
```

Expected:

```text
200
200
```

- [ ] **Step 3: 人工视觉验收**

Open:

```text
http://127.0.0.1:5173/
http://127.0.0.1:5173/?debug=1
```

Check:

- 玩家显示为图片资产，而不是青色方块主体。
- 7 类道具/障碍都能区分。
- 背景层存在日落和城市远景。
- 赛道装饰增强速度感，但三条轨道仍清楚。
- “再来一局”后左右滑动仍一次只移动一格。
- debug 页面仍可用。

- [ ] **Step 4: 追加实现记录**

Append to `docs/superpowers/specs/2026-05-02-asset-pack-design.md`:

```md

## 首批资产包实现记录

- 已建立 asset manifest 和 preload helper。
- 已生成并提交玩家、道具、障碍、背景和赛道装饰 PNG。
- 已接入 `AssetVisualFactory`，运行时优先使用图片资产。
- 已保留程序化视觉 fallback。
- 已通过测试、构建、安全审计、资产校验和本地页面可访问性检查。
```

- [ ] **Step 5: 提交验收记录**

Run:

```bash
git add docs/superpowers/specs/2026-05-02-asset-pack-design.md
git commit -m "补充首批资产包验收记录"
```

## 自检清单

- 12 个运行时 PNG 都在 `public/assets/game/`。
- 生成中间产物只在 `artifacts/asset-generation/`。
- 图片资产缺失时不会阻止游戏启动。
- 碰撞盒仍由代码独立控制，不从图片尺寸推导。
- 核心玩法模块没有因视觉资产接入改变行为。
- 普通页和 `?debug=1` 都完成浏览器验收。
- 所有提交日志使用中文。
