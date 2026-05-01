import type { RunState } from '../state';

const BEST_SCORE_KEY = 'tangent-runner-best-score';

export function readBestScore(): number {
  const rawValue = localStorage.getItem(BEST_SCORE_KEY);
  const value = rawValue ? Number(rawValue) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function writeBestScore(score: number): void {
  localStorage.setItem(BEST_SCORE_KEY, String(Math.max(0, Math.floor(score))));
}

export function updateBestScore(state: RunState): number {
  const current = readBestScore();
  const next = Math.max(current, state.score);
  writeBestScore(next);
  return next;
}
