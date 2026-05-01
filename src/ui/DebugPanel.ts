import type { GameAction } from '../game/actions';
import type { RunState } from '../game/state';

export class DebugPanel {
  private visible = new URLSearchParams(window.location.search).get('debug') === '1';
  private latestInput = '无';
  private latestState: RunState | null = null;

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
    if (this.latestState) {
      this.update(this.latestState);
    }
  }

  update(state: RunState): void {
    this.latestState = state;
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
    if (this.visible && this.latestState) {
      this.update(this.latestState);
    }
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
