import './styles.css';

const root = document.querySelector<HTMLDivElement>('#game-root');
const hudRoot = document.querySelector<HTMLDivElement>('#hud-root');

if (!root || !hudRoot) {
  throw new Error('缺少游戏挂载节点');
}

root.textContent = '切线冲刺加载中';
hudRoot.innerHTML = '<button class="primary-action" type="button">开始游戏</button>';
