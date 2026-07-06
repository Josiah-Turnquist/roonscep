# Roonscep → authoritative MMO: migration plan

Goal: a **true authoritative** multiplayer world (Tier 2) — the server owns all
state, clients send intents, the world is shared. Scope for the first cut: 5
concurrent players.

## Why this is tractable here

Two properties of Roonscep make an authoritative MMO far easier than usual:

1. **Turn-based on 1.2s ticks.** No rollback, prediction, or lag compensation
   needed — a 200–300ms round trip is invisible. Loop is: client sends intent →
   server ticks & validates → server broadcasts → client interpolates (the
   renderer already interpolates).
2. **The game logic is already a pure reducer.** `reduce(state, action)` in
   `src/game/engine.ts` has no DOM/localStorage/React. It runs the whole
   simulation server-side unchanged.

## Hosting decision

- **Game server**: Colyseus (Node) on **Fly.io** with `auto_stop_machines` /
  `auto_start_machines`. Stops the VM when the last player leaves, cold-boots a
  fresh world when the first reconnects. The world resetting on empty is *fine*
  by design — nothing shared needs to persist while nobody's online.
- **Durable data** (accounts + per-player saves): **Neon** (or Supabase)
  serverless Postgres, which also scales to ~$0 when idle.
- Net effect: the whole stack costs pennies until someone actually plays, and
  wakes on demand. Split mentally as **disposable shared world in RAM, durable
  per-player state in the DB.**
- (Colyseus *can't* hibernate mid-session with players connected — only
  Durable Objects do that — but we never need it, since stop only happens when
  empty.)

## Phases

- **Phase 0 — Extract the authoritative core. ✅ DONE.**
  `src/game/engine.ts` is the pure, environment-agnostic simulation (reducer +
  helpers + initialState + offline sim). `src/game/rng.ts` makes randomness
  injectable via `setRng()` so the server can own it. `src/state/store.tsx` is
  now just the React/browser binding (localStorage, tick interval, hooks).
  Verified: the engine runs headless in Node, and the browser game is unchanged.

- **Phase 1 — Authoritative Colyseus room. ✅ CORE DONE (runs locally).**
  `server/` is a Node/Colyseus package. `RoonscepRoom` gives each connected
  player a server-owned GameState, runs the 1.2s tick server-side via the shared
  engine, applies client intents through `reduce` (rejecting server-only actions
  like TICK), broadcasts presence (everyone's position/appearance), and persists
  per-player saves. Persistence is behind an interface (`FilePersistence` for
  dev; Neon Postgres swaps in for prod). Verified end-to-end with a headless
  test client: join → authoritative state → MOVE intent applied server-side →
  world ticks → save persists on leave. Run: `cd server && npm run dev`, then
  `npm run test:client`.
  Still ahead in Phase 1: real accounts/auth (deferred — needs a provider; dev
  uses a passed playerId), Neon Postgres impl (needs the account), and the Fly
  deploy. None block local development.

- **Phase 2 — Intents, not mutations.** Client sends intent messages
  (`MOVE`, `GATHER {x,y}`, `ATTACK {uid}`, `BUY`, `EQUIP`…). Server validates
  each against authoritative state, applies via the shared reducer, persists.
  This is what makes it an MMO: the client can't grant itself gear because it
  only *asks*. Anti-cheat falls out of server-owned RNG + validation.

- **Phase 3 — State sync + interest management.** Colyseus schema for automatic
  binary delta-sync. Area-of-interest: each client receives only nearby entities
  (schema filters now, per-zone rooms when sharding). The renderer reads synced
  state instead of local state; keeps its interpolation.

- **Phase 4 — Shared-world simulation.** One server tick owns all monsters and
  nodes — everyone sees the same goblin HP, the same depleted tree. Design calls
  here: can two players tag one monster? Contested vs. per-player nodes?

- **Phase 5 — Hardening.** Reconnection, save-on-disconnect, intent
  rate-limiting, moderation (usernames + chat), ops/monitoring.

## Open decisions (before Phase 1)

- **One global room vs. per-zone rooms.** Start with one room for 5 players, but
  keep state shaped so zone-splitting later is clean.
- **What moves server-side first.** Recommended: movement + gathering + combat
  (the shared-world essentials); pure-UI artisan screens last.
