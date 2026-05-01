import Phaser from 'phaser';
import './styles.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/config';
import { InputController } from './game/input/InputController';
import { GameScene, RUN_STATE_EVENT } from './game/scenes/GameScene';
import type { GameAction } from './game/actions';
import type { RunState } from './game/state';
import { HudOverlay } from './ui/HudOverlay';

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

const phoneFrame = document.querySelector<HTMLElement>('#phone-frame');

if (!phoneFrame) {
  throw new Error('缺少手机比例视窗节点');
}

const input = new InputController(phoneFrame, sendAction);
input.bind();

const hud = new HudOverlay(hudRoot, sendAction);
hud.mount();

game.events.on(RUN_STATE_EVENT, (state: RunState) => {
  hud.update(state);
});
