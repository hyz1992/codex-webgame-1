# 《切线冲刺》首批正式资产包设计文档

日期：2026-05-02

## 目标

本阶段采用“游戏画面首发包”路线，把当前程序化视觉升级为可接近发布品质的首批图片资产版本。目标不是一次性完成所有美术，而是优先替换最影响观感的游戏画面元素：玩家、障碍、道具、背景远景层和赛道装饰。

本阶段不把 DOM HUD、菜单按钮和结算页切成图片。它们继续使用 CSS，因为当前最大的视觉短板在游戏主画面，而不是 UI 信息结构。

## 范围

包含：

- 玩家静态 seed frame。
- 7 个道具/障碍静态 PNG：`energy`、`shield`、`boost`、`barrier`、`lowFence`、`beam`、`hazard`。
- 2 层背景 PNG：日落天空层、城市远景剪影层。
- 2 类赛道装饰 PNG：轨道边缘发光条、地面网格/速度标记。
- 资产 manifest，用于 Phaser 预加载和尺寸校验。
- Phaser 接入层，优先使用图片资产，缺失时回退到现有程序化图形。

不包含：

- 角色跑步、跳跃、滑铲 sprite strip。
- 菜单主视觉和宣传图。
- HUD 图片皮肤。
- 音效、音乐、粒子贴图。
- 新玩法或新判定。

## 视觉方向

延续当前已确认的“霓虹日落街机”方向：

- 暖色日落背景承托冷色霓虹赛道。
- 玩家使用青色/亮黄能量核心，轮廓必须在 390 x 844 手机画面内清楚。
- 奖励物使用冷亮色，危险物使用红/品红/橙色。
- 障碍必须靠形状和轮廓区分，不能只靠颜色区分。
- 所有游戏物件都需要清晰外轮廓和轻微发光边缘。
- 避免写实照片质感，避免复杂细节，避免暗到看不清。

## 资产清单

所有项目内资产保存到 `public/assets/game/`。生成中的原图、去背景中间产物和未选版本保存到 `artifacts/asset-generation/`，不由游戏运行时引用。

### 玩家

文件：

- `public/assets/game/player-seed.png`

规格：

- 画布：`128 x 128`。
- 游戏内显示尺寸：约 `42 x 64`。
- 透明 PNG。
- 锚点：底部中心，运行时 `setOrigin(0.5, 0.82)`。
- 角色朝向：正面偏俯视，不要侧身。
- 轮廓：能量滑行者/街机跑者，头身轮廓一眼可见。
- 配色：青色主体、亮黄核心、少量紫色边缘光。

验收：

- 缩放到 `42 x 64` 时仍能看清主体和核心。
- 不能有地面、阴影、文字、水印。
- 透明边缘不能有明显色块残留。

### 道具与障碍

文件：

- `public/assets/game/item-energy.png`
- `public/assets/game/item-shield.png`
- `public/assets/game/item-boost.png`
- `public/assets/game/obstacle-barrier.png`
- `public/assets/game/obstacle-low-fence.png`
- `public/assets/game/obstacle-beam.png`
- `public/assets/game/obstacle-hazard.png`

统一规格：

- 单图画布：`96 x 96`。
- 透明 PNG。
- 锚点：中心，运行时 `setOrigin(0.5, 0.5)`。
- 主体留白：边缘至少 10px，避免发光被裁掉。
- 形状必须和当前判定语义一致。

单项要求：

- `energy`：青黄能量球，圆形，奖励感明显。
- `shield`：绿色护盾/六边形符号，不能像能量球。
- `boost`：紫蓝晶体或推进核心，必须和 shield 区分。
- `barrier`：橙色厚重路障，占地感强。
- `lowFence`：低矮红橙横栏，暗示需要跳跃。
- `beam`：紫色横向霓虹梁，暗示需要滑铲。
- `hazard`：品红裂隙/断路，危险等级最高，不能像普通障碍。

验收：

- 在 `390 x 844` 画面中以当前游戏尺寸显示时，7 类物件能一眼区分。
- `beam` 的横向比例必须明显；`lowFence` 的低矮比例必须明显。
- 图像可用于现有碰撞盒，不因外观误导实际判定。

### 背景层

文件：

- `public/assets/game/bg-sunset-sky.png`
- `public/assets/game/bg-city-silhouette.png`

规格：

- 画布：`390 x 844`。
- `bg-sunset-sky.png`：完整手机画幅，日落渐变和远光，不包含赛道。
- `bg-city-silhouette.png`：透明 PNG，仅城市剪影/远景装饰，可叠在天空上。
- 背景亮度不能盖过玩家和障碍。

验收：

- 背景单独看有风格，但在游戏中不抢读秒、轨道和碰撞判断。
- 远景城市不应进入玩家附近核心判断区域。

### 赛道装饰

文件：

- `public/assets/game/track-edge-glow.png`
- `public/assets/game/track-speed-grid.png`

规格：

- `track-edge-glow.png`：`64 x 844` 透明 PNG，用于左右轨道边缘重复或拉伸。
- `track-speed-grid.png`：`290 x 256` 透明 PNG，用于跑道纵向平铺。
- 赛道底板仍可由 Phaser 程序化绘制，图片只补充质感。

验收：

- 赛道装饰不能让三条轨道边界变模糊。
- 疾跑时可以配合现有 speed lines 增强，但不能持续遮挡物件。

## 生成策略

默认使用内置 `image_gen`。透明资产采用 chroma-key 工作流：

1. 生成在纯色 `#00ff00` 或 `#ff00ff` 背景上的主体图。
2. 将选定原图保存到 `artifacts/asset-generation/`。
3. 使用 imagegen skill 的 `remove_chroma_key.py` 去背景。
4. 输出最终 PNG 到 `public/assets/game/`。
5. 用本地脚本检查 alpha 通道、尺寸和边缘残留。

对于玩家后续动画，先批准 `player-seed.png`，再使用 `sprite-pipeline` 生成整条动画 strip。不要逐帧独立生成角色动画。

## 接入架构

新增模块：

- `src/game/assets/assetManifest.ts`
  - 定义运行时图片 key、路径、目标显示尺寸、fallback 类型。
- `src/game/assets/preloadGameAssets.ts`
  - 在 Phaser 场景 `preload()` 中加载 manifest 中的图片。
- `src/game/visual/AssetVisualFactory.ts`
  - 根据 asset manifest 创建 sprite。
  - 如果纹理缺失或加载失败，调用现有 `GameVisualFactory` 的程序化 fallback。

修改：

- `src/game/scenes/GameScene.ts`
  - 增加 `preload()`。
  - `create()` 中使用 asset visual factory。
- `src/game/visual/GameVisualFactory.ts`
  - 保留为 fallback 和混合图形层。

原则：

- 碰撞盒继续使用独立 invisible rectangle，不从图片尺寸推导。
- 所有图片只改变表现，不改变 `LaneController`、`CollisionSystem`、`ObstacleSpawner` 的行为。
- asset key 和文件名必须稳定，方便后续替换图片而不改代码。

## 验收标准

工程验收：

- `npm test` 通过。
- `npm run build` 通过。
- `npm audit --audit-level=high` 通过。
- 所有运行时引用图片都在 `public/assets/game/`。
- 缺少任意图片时，游戏仍可用程序化 fallback 启动。

视觉验收：

- 普通页和 `?debug=1` 页面都能打开。
- 玩家不再像默认方块。
- 7 类道具/障碍在小屏上可读且可区分。
- 背景层明显提升风格，但不抢游戏判断区。
- 赛道装饰提升速度感，但不影响三轨识别。

项目节奏：

第一批只做静态资产接入。确认首批资产稳定后，再进入第二批角色动画、粒子贴图和菜单主视觉。
