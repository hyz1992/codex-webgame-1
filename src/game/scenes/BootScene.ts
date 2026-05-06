import { preloadGameAssets } from '../assets/preloadGameAssets';

const LOADING_BAR_FILL = '.loading-bar-fill';
const LOADING_PERCENT = '.loading-percent';
const LOADING_ROOT = '#loading-root';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    const fill = document.querySelector<HTMLElement>(LOADING_BAR_FILL);
    const percent = document.querySelector<HTMLElement>(LOADING_PERCENT);

    this.load.on('progress', (value: number) => {
      if (fill) fill.style.width = `${Math.round(value * 100)}%`;
      if (percent) percent.textContent = `${Math.round(value * 100)}%`;
    });

    preloadGameAssets(this);
  }

  create(): void {
    const loadingRoot = document.querySelector<HTMLElement>(LOADING_ROOT);
    if (loadingRoot) {
      const remove = () => {
        loadingRoot.removeEventListener('transitionend', remove);
        clearTimeout(fallback);
        loadingRoot.remove();
      };
      loadingRoot.classList.add('fade-out');
      loadingRoot.addEventListener('transitionend', remove);
      const fallback = setTimeout(remove, 600);
    }

    this.scene.start('GameScene');
  }
}
