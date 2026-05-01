import type { GameAction } from '../actions';
import { LANE_COUNT } from '../config';

export type PlayerMotionState = 'running' | 'jumping' | 'sliding';

export interface LaneSnapshot {
  lane: number;
  motion: PlayerMotionState;
}

export class LaneController {
  private lane = 1;
  private motion: PlayerMotionState = 'running';

  applyAction(action: GameAction): void {
    if (action === 'jump') {
      this.motion = 'jumping';
      return;
    }

    if (action === 'slide') {
      this.motion = 'sliding';
      return;
    }

    if (action === 'laneLeft') {
      this.moveLane(-1);
      return;
    }

    if (action === 'laneRight') {
      this.moveLane(1);
    }
  }

  endActionState(): void {
    this.motion = 'running';
  }

  snapshot(): LaneSnapshot {
    return {
      lane: this.lane,
      motion: this.motion,
    };
  }

  private moveLane(direction: -1 | 1): void {
    if (this.motion === 'sliding') {
      return;
    }

    this.lane = Math.max(0, Math.min(LANE_COUNT - 1, this.lane + direction));
  }
}
