// The React/browser binding around the pure game engine. Everything here is
// environment-specific — localStorage persistence, the tick interval, and the
// context/hooks the UI reads. The authoritative simulation lives in
// ../game/engine and knows nothing about any of this.
import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { GameState } from '../game/types';
import { MONSTER_MAP } from '../game/monsters';
import { HOME, SPAWNS, WORLD_VERSION, isWalkable } from '../game/world';
import {
  Action, MAX_OFFLINE_TICKS, TICK_MS, initialState, reduce, simulateOffline, withAchievements,
} from '../game/engine';

export type { Action };
export { TICK_MS };

/** Wall-clock time of the last game tick — lets the UI show progress toward the next turn. */
export const tickClock = { last: Date.now() };
// Legacy key from when the game was called Skillbound — kept so nobody loses their save.
export const SAVE_KEY = 'skillbound-save-v1';

export function loadState(): GameState {
  const base = initialState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<GameState>;
    const savedWorld =
      saved.world && saved.world.v === WORLD_VERSION && saved.world.entities?.length === SPAWNS.length
        ? saved.world
        : base.world;
    const s: GameState = {
      ...base,
      ...saved,
      world: savedWorld,
      xp: { ...base.xp, ...(saved.xp ?? {}) },
      boosts: { ...base.boosts, ...(saved.boosts ?? {}) },
      stats: { ...base.stats, ...(saved.stats ?? {}) },
      settings: { ...base.settings, ...(saved.settings ?? {}) },
      quests: saved.quests ?? {},
      achievements: saved.achievements ?? [],
      fx: [],
    };
    // Pre-world saves: activities and fights referenced nothing in the world
    if (s.activity?.type === 'gather' && !s.activity.nodeKey) s.activity = null;
    if (s.activity?.type === 'combat' && s.activity.entityUid === undefined) {
      const m = MONSTER_MAP[s.activity.monsterId];
      if (!m?.boss) s.activity = null;
    }
    if (!isWalkable(s.world.px, s.world.py)) {
      s.world.px = HOME.x;
      s.world.py = HOME.y;
    }
    if (saved.savedAt) {
      const ticks = Math.min(Math.floor((Date.now() - saved.savedAt) / TICK_MS), MAX_OFFLINE_TICKS);
      if (ticks > 10 && s.activity) simulateOffline(s, ticks);
    }
    return withAchievements(s);
  } catch {
    // Never clobber a save we failed to read — stash it for manual recovery
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) localStorage.setItem(`${SAVE_KEY}-backup`, raw);
    } catch {
      /* storage unavailable */
    }
    return base;
  }
}

// ——— context ———

const StateCtx = createContext<GameState | null>(null);
const DispatchCtx = createContext<React.Dispatch<Action>>(() => {});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, loadState);
  const latestState = useRef(state);
  latestState.current = state;
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    tickClock.last = Date.now();
    const id = setInterval(() => {
      tickClock.last = Date.now();
      dispatch({ type: 'TICK' });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Saving stringifies the whole state and hits disk synchronously — far too
  // heavy to run on every walk step. Throttle it, and flush when the tab
  // hides or closes so nothing is ever lost.
  useEffect(() => {
    if (saveTimer.current !== null) return;
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...latestState.current, savedAt: Date.now() }));
    }, 1500);
  }, [state]);

  useEffect(() => {
    const flush = () =>
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...latestState.current, savedAt: Date.now() }));
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', flush);
    };
  }, []);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useGame(): GameState {
  const s = useContext(StateCtx);
  if (!s) throw new Error('useGame outside provider');
  return s;
}

export function useDispatch(): React.Dispatch<Action> {
  return useContext(DispatchCtx);
}
