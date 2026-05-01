import { collectEnergy, collectShield, damagePlayer, triggerBoost, type RunState } from '../state';
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
