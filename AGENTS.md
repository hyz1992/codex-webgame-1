# AGENTS.md

本文件是给 Codex、自动化代理和后续协作者的项目工作指南。请优先阅读本文件，再改代码或文档。

## 项目概况

《切线冲刺》是一个移动端优先的浏览器跑酷游戏，使用 Phaser 3、TypeScript 和 Vite 开发。核心体验是竖屏三车道悬浮摩托跑酷：玩家通过左右变道躲避障碍、收集道具，并在伪 3D 透视大桥上不断前进。

当前项目已经完成核心玩法闭环，后续重点通常是：

- 视觉资产质量。
- 主角动画和透视朝向。
- 跑道、路灯、车道线和障碍物的伪 3D 一致性。
- 移动端手感和 PC 调试体验。
- HUD、暂停、结算和调试面板细节。

## 回复和提交约定

- 本项目一律使用中文回复用户。
- Git 提交日志使用中文。
- 用户允许在合适时机自动提交，但提交前必须确认暂存范围。
- 不要提交 `tmp/`、`dist/`、`node_modules/` 或临时预览图，除非用户明确要求。
- 工作区可能存在用户或其他代理留下的未提交改动。不要回滚、覆盖或顺手提交与当前任务无关的改动。

## 常用命令

```bash
npm install
npm run dev
npm test
npm run build
npm run assets:validate
npm audit --audit-level=high
```

开发预览：

```text
http://localhost:5173/
http://localhost:5173/?debug=1
```

`?debug=1` 会提供大量护盾，适合长时间观察视觉效果。

## 代码和资源边界

- `src/game/state.ts`：局内状态、分数、护盾、加速等纯逻辑。
- `src/game/input/InputController.ts`：键盘、触摸和鼠标手势到 `GameAction` 的转换。
- `src/game/lane/LaneController.ts`：三车道位置和变道状态。
- `src/game/spawn/ObstacleSpawner.ts`：障碍和道具生成节奏。
- `src/game/collision/CollisionSystem.ts`：道具拾取、受伤和结算。
- `src/game/scenes/GameScene.ts`：Phaser 场景编排，连接输入、状态、碰撞、渲染和特效。
- `src/game/visual/layout.ts`：跑道、背景、伪 3D 投影和视觉缩放的重要常量。
- `src/game/visual/PerspectiveProjector.ts`：伪 3D 投影算法。
- `src/game/visual/GameVisualFactory.ts`：程序化跑道、路灯、车道线和视觉对象。
- `src/game/visual/AssetVisualFactory.ts`：图片资产实例化。
- `src/game/assets/assetManifest.ts`：运行时图片资源、显示尺寸、锚点和摩托序列帧裁剪。
- `public/assets/game/`：运行时 PNG 资产。
- `tests/`：单元测试和视觉约束测试。

## 编辑准则

- 优先沿用现有模块边界，不把玩法逻辑塞进视觉工厂，也不要把视觉调参塞进状态层。
- 伪 3D 相关改动优先从 `layout.ts` 和 `PerspectiveProjector.ts` 入手。
- 障碍物和道具显示尺寸必须考虑单车道宽度，避免视觉上侵入隔壁车道。
- 障碍物通常使用底部锚点贴合路面；道具可以使用中心锚点悬浮。
- 图片资产应使用透明 PNG，并通过 `npm run assets:validate` 校验。
- 对重要常量保留简短中文注释，方便用户自行微调。
- 不要重新引入跳跃和下滑，当前核心操作已经收敛为左右变道。

## 验证要求

提交前根据改动范围选择验证。常见组合：

```bash
npm test
npm run build
npm run assets:validate
npm audit --audit-level=high
git diff --check
```

只改文档时至少运行：

```bash
git diff --check
```

如果改了 TypeScript、资源清单或视觉投影，优先运行完整测试和构建。

## 视觉和资产工作建议

- 先用小范围资产或常量改动验证方向，再扩大到整套风格。
- 用户提供截图或录屏时，优先围绕截图中的穿帮点定位原因。
- 伪 3D 的关键不是“看起来在动”，而是参照物、障碍物、车道线和路灯都像固定在同一条道路上。
- 需要生成资产时，尽量先明确：视角、尺寸、透明背景、锚点、车道占用、远近缩放可读性。
- 程序化图形适合快速验证语义，但正式美术需要更统一的资产风格和更精细的透明边缘处理。

## Git 操作建议

提交前先看：

```bash
git status --short
git diff --stat
git diff --cached --stat
```

暂存时明确列出文件，不要使用笼统的 `git add .`。如果工作区里有未跟当前任务相关的文件，例如 `tmp/` 或用户改动，保持未暂存。
