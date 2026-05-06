import Phaser from 'phaser';
import './styles.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/config';
import { InputController } from './game/input/InputController';
import { GameScene, RUN_STATE_EVENT } from './game/scenes/GameScene';
import { BootScene } from './game/scenes/BootScene';
import type { GameAction } from './game/actions';
import type { RunState } from './game/state';
import { HudOverlay } from './ui/HudOverlay';
import { DebugPanel } from './ui/DebugPanel';

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
  scene: [BootScene, GameScene],
});

let debugPanel: DebugPanel | null = null;

const sendAction = (action: GameAction): void => {
  debugPanel?.recordInput(action);

  if (action === 'confirm' && !document.fullscreenElement && navigator.maxTouchPoints > 0) {
    document.documentElement.requestFullscreen().then(() => {
      (screen.orientation as unknown as { lock: (orientation: string) => Promise<void> }).lock('portrait').catch(() => {});
    }).catch(() => {});
  }

  const scene = game.scene.getScene('GameScene');
  scene.events.emit('game-action', action);
};

const phoneFrame = document.querySelector<HTMLElement>('#phone-frame');

if (!phoneFrame) {
  throw new Error('缺少手机比例视窗节点');
}

const input = new InputController(phoneFrame, sendAction);
input.bind();

const hud = new HudOverlay(hudRoot, sendAction);
hud.mount();

debugPanel = new DebugPanel(debugRoot, sendAction);
debugPanel.mount();

game.events.on(RUN_STATE_EVENT, (state: RunState) => {
  hud.update(state);
  debugPanel?.update(state);
});
