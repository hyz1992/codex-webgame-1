import { describe, expect, it } from 'vitest';
import { DEBUG_MODE_SHIELDS } from '../src/game/config';
import { createInitialRunState } from '../src/game/state';

describe('debug run state', () => {
  it('starts debug runs with enough shields for long visual review sessions', () => {
    const state = createInitialRunState({ debug: true });

    expect(DEBUG_MODE_SHIELDS).toBe(10000);
    expect(state.shields).toBe(DEBUG_MODE_SHIELDS);
  });
});
