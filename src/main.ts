import Phaser from 'phaser';
import './styles.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/config';
import { InputController } from './game/input/InputController';
import { GameScene } from './game/scenes/GameScene';
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

const phoneFrame = document.querySelector<HTMLElement>('#phone-frame');

if (!phoneFrame) {
  throw new Error('缺少手机比例视窗节点');
}

const input = new InputController(phoneFrame, sendAction);
input.bind();

hudRoot.innerHTML = '<button class="primary-action" type="button" data-action="confirm">开始游戏</button>';
hudRoot.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.action === 'confirm') {
    sendAction('confirm');
  }
});
