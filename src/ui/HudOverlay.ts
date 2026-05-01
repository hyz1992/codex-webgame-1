import type { GameAction } from '../game/actions';
import { readBestScore, updateBestScore } from '../game/storage/records';
import type { RunState } from '../game/state';

export class HudOverlay {
  private latestState: RunState | null = null;
  private lastRenderKey = '';

  constructor(
    private readonly root: HTMLElement,
    private readonly sendAction: (action: GameAction) => void,
  ) {}

  mount(): void {
    this.root.addEventListener('click', this.handleClick);
    this.renderStart();
  }

  destroy(): void {
    this.root.removeEventListener('click', this.handleClick);
  }

  update(state: RunState): void {
    this.latestState = state;

    if (!state.hasStarted) {
      this.renderStart();
      return;
    }

    if (state.isGameOver) {
      this.renderGameOver(state);
      return;
    }

    this.renderHud(state);
  }

  private renderStart(): void {
    const renderKey = `start:${readBestScore()}`;
    if (this.lastRenderKey === renderKey) {
      return;
    }

    this.lastRenderKey = renderKey;
    this.root.innerHTML = `
      <section class="menu-screen">
        <h1>切线冲刺</h1>
        <p>最高分 ${readBestScore()}</p>
        <button class="primary-action" type="button" data-action="confirm">开始游戏</button>
      </section>
    `;
  }

  private renderHud(state: RunState): void {
    const renderKey = `hud:${state.score}:${Math.floor(state.distance)}:${state.shields}:${state.boostMeter}:${state.isPaused}`;
    if (this.lastRenderKey === renderKey) {
      return;
    }

    this.lastRenderKey = renderKey;
    this.root.innerHTML = `
      <div class="hud-bar">
        <span>${state.score}</span>
        <span>${Math.floor(state.distance)}m</span>
        <span>盾 ${state.shields}</span>
      </div>
      <div class="boost-bar" aria-label="疾跑槽">
        <span style="width: ${state.boostMeter}%"></span>
      </div>
      <button class="pause-button" type="button" data-action="pause">暂停</button>
      ${
        state.isPaused
          ? `
        <section class="menu-screen compact">
          <button class="primary-action" type="button" data-action="pause">继续</button>
          <button class="secondary-action" type="button" data-action="restart">重开</button>
        </section>
      `
          : ''
      }
    `;
  }

  private renderGameOver(state: RunState): void {
    const renderKey = `over:${state.score}:${Math.floor(state.distance)}:${state.bestCombo}`;
    if (this.lastRenderKey === renderKey) {
      return;
    }

    this.lastRenderKey = renderKey;
    const best = updateBestScore(state);

    this.root.innerHTML = `
      <section class="menu-screen">
        <h1>本局结束</h1>
        <dl class="result-list">
          <div><dt>分数</dt><dd>${state.score}</dd></div>
          <div><dt>距离</dt><dd>${Math.floor(state.distance)}m</dd></div>
          <div><dt>最高连击</dt><dd>${state.bestCombo}</dd></div>
          <div><dt>最高分</dt><dd>${best}</dd></div>
        </dl>
        <button class="primary-action" type="button" data-action="restart">再来一局</button>
      </section>
    `;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action as GameAction | undefined;

    if (!action) {
      return;
    }

    event.preventDefault();
    this.sendAction(action);
  };
}
