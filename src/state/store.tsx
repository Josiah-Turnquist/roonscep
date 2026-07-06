// The React/browser binding around the pure game engine. Everything here is
// environment-specific — localStorage persistence, the tick interval, and the
// context/hooks the UI reads. The authoritative simulation lives in
// ../game/engine and knows nothing about any of this.
import React, {
  createContext, useCallback, useContext, useEffect, useReducer, useRef, useState,
} from 'react';
import { GameState } from '../game/types';
import { MONSTER_MAP } from '../game/monsters';
import { HOME, SPAWNS, WORLD_VERSION, isWalkable } from '../game/world';
import {
  Action, MAX_OFFLINE_TICKS, TICK_MS, initialState, reduce, simulateOffline, withAchievements,
} from '../game/engine';
import { connect, NetClient } from '../net/client';
import type { PresenceView } from '../net/types';
import { getMpServerUrl, MpConfig } from '../net/config';
import { Account, getAccount, signIn, signOut } from '../net/auth';
import SignIn from '../ui/SignIn';

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
/** Other players, in multiplayer; always empty in single-player. */
const PresenceCtx = createContext<PresenceView[]>([]);
const NO_PRESENCE: PresenceView[] = [];

/** Signed-in account info for the header (null in single-player). */
interface AccountView {
  name: string;
  signOut: () => void;
}
const AccountCtx = createContext<AccountView | null>(null);
export function useAccount(): AccountView | null {
  return useContext(AccountCtx);
}

/** Chooses the provider: single-player (local reducer) or multiplayer (server-authoritative). */
export function GameRoot({ children }: { children: React.ReactNode }) {
  const [serverUrl] = useState(getMpServerUrl);
  if (!serverUrl) return <GameProvider>{children}</GameProvider>;
  return <MultiplayerGate serverUrl={serverUrl}>{children}</MultiplayerGate>;
}

/** Multiplayer requires an account: show sign-in, then connect with that identity. */
function MultiplayerGate({ serverUrl, children }: { serverUrl: string; children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(getAccount);
  if (!account) {
    return <SignIn onSignIn={(u, n) => setAccount(signIn(u, n))} />;
  }
  const config: MpConfig = { url: serverUrl, playerId: account.username, name: account.name };
  const view: AccountView = {
    name: account.name,
    signOut: () => {
      signOut();
      setAccount(null);
    },
  };
  return (
    <AccountCtx.Provider value={view}>
      <NetGameProvider config={config}>{children}</NetGameProvider>
    </AccountCtx.Provider>
  );
}

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
      <DispatchCtx.Provider value={dispatch}>
        <PresenceCtx.Provider value={NO_PRESENCE}>{children}</PresenceCtx.Provider>
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

// ——— multiplayer provider ———
// Same context shape as GameProvider, so the entire UI is unchanged. The server
// is authoritative: dispatch sends an intent and the truth comes back over the
// wire. Movement is applied optimistically for responsiveness; the server's
// state pushes reconcile it.

export function NetGameProvider({ config, children }: { config: MpConfig; children: React.ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [presence, setPresence] = useState<PresenceView[]>(NO_PRESENCE);
  const [error, setError] = useState<string | null>(null);
  const netRef = useRef<NetClient | null>(null);
  const stateRef = useRef<GameState | null>(null);
  stateRef.current = state;

  useEffect(() => {
    let alive = true;
    connect(config.url, { playerId: config.playerId, name: config.name })
      .then((net) => {
        if (!alive) {
          net.leave();
          return;
        }
        netRef.current = net;
        net.onState((s) => setState(s));
        net.onPresence((views) => setPresence(views.filter((v) => v.id !== config.playerId)));
      })
      .catch((e) => {
        console.error('Multiplayer connection failed:', e);
        setError(String(e?.message ?? e));
      });
    return () => {
      alive = false;
      netRef.current?.leave();
      netRef.current = null;
    };
  }, [config.url, config.playerId, config.name]);

  const dispatch = useCallback<React.Dispatch<Action>>(
    (action) => {
      const net = netRef.current;
      if (!net) return;
      // Movement is deterministic — predict it locally so it feels instant.
      if (action.type === 'MOVE_STEP' && stateRef.current) {
        setState(reduce(stateRef.current, action));
      }
      net.sendIntent(action);
    },
    [],
  );

  if (error) {
    return (
      <div className="mp-screen">
        <h1>⚔️ Roonscep</h1>
        <p>Couldn't reach the game server at <code>{config.url}</code>.</p>
        <p className="muted small">{error}</p>
        <p className="muted small">Is the server running? Drop the <code>?mp</code> URL param to play solo.</p>
      </div>
    );
  }
  if (!state) {
    return (
      <div className="mp-screen">
        <h1>⚔️ Roonscep</h1>
        <p>Connecting to {config.url}…</p>
      </div>
    );
  }
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        <PresenceCtx.Provider value={presence}>{children}</PresenceCtx.Provider>
      </DispatchCtx.Provider>
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

/** Other players (multiplayer). Empty array in single-player. */
export function usePresence(): PresenceView[] {
  return useContext(PresenceCtx);
}
