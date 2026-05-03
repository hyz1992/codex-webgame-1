import { collectEnergy, collectShield, damagePlayer, triggerBoost, type RunState } from '../state';
import type { PlayerMotionState } from '../lane/LaneController';
import type { LaneItem } from '../spawn/patterns';

export function resolveCollision(state: RunState, item: LaneItem): RunState {
  if (item.kind === 'energy') {
    return collectEnergy(state);
  }

  if (item.kind === 'shield') {
    return collectShield(state);
  }

  if (item.kind === 'boost') {
    return triggerBoost(state);
  }

  if (item.kind === 'hazard') {
    return damagePlayer(state, 'fatal');
  }

  return damagePlayer(state, 'normal');
}

export function resolvePlayerCollision(state: RunState, item: LaneItem, _motion: PlayerMotionState): RunState {
  return resolveCollision(state, item);
}
