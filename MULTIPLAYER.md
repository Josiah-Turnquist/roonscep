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

- **Phase 2 — Intents, not mutations. ✅ DONE (wired path).** The React client
  runs in opt-in multiplayer mode via `?mp` (single-player is the untouched
  default). `src/net/*` connects to the room; `NetGameProvider` in store.tsx
  provides the *same* context the whole UI already reads, so no panels changed.
  `dispatch` sends the Action as an intent instead of reducing locally; the
  server is authoritative and pushes state back. Movement is predicted locally
  for feel, server reconciles. Other players render as models with nameplates
  (`usePresence` → WorldView). Verified live: browser client + a headless bot
  saw each other move in real time, "2 online" badge, and the client showed the
  server's fresh state (not its localStorage save) — anti-cheat working.

- **Phase 3 — State sync + interest management.** Currently the server sends the
  full GameState JSON each tick and broadcasts all presence to everyone — fine
  for 5 players, but the optimization target. Colyseus schema for binary
  delta-sync; area-of-interest so each client receives only nearby entities/
  players (schema filters now, per-zone rooms when sharding).

- **Phase 4 — Shared-world simulation.** One server tick owns all monsters and
  nodes — everyone sees the same goblin HP, the same depleted tree. Design calls
  here: can two players tag one monster? Contested vs. per-player nodes?

- **Phase 5 — Hardening.** Reconnection, save-on-disconnect, intent
  rate-limiting, moderation (usernames + chat), ops/monitoring.

## Run it locally

```sh
# terminal 1 — the authoritative server
cd server && npm install && npm run dev      # ws://localhost:2567

# terminal 2 — the client
npm run dev                                  # http://localhost:5199
```

Open the client at `http://localhost:5199/?mp=1&name=You` for multiplayer, or
plain `http://localhost:5199/` for single-player. `cd server && npm run test:client`
runs a headless smoke test; `npm run bot` (tsx src/bot.ts) adds a wandering
second player.

## Deploying (when you have the accounts — the one blocked step)

1. **Neon** (durable saves): create a project at neon.tech, copy the Postgres
   connection string.
2. **Fly** (game server): install `flyctl`, then from the repo root:
   ```sh
   fly launch --no-deploy          # names the app; edit fly.toml's app/region
   fly secrets set DATABASE_URL="postgres://…neon…"
   fly deploy
   ```
   The server picks up `DATABASE_URL` automatically (createPersistence()).
3. **Point the client at it**: open the deployed client with
   `?mp=wss://<your-app>.fly.dev`. (Optional next step: add a "Play Online"
   button / `VITE_MP_SERVER` env so the Netlify site offers it without the URL
   param — a small UI decision.)

## Accounts (decided + built)

Users sign up with a **username** and their character persists to it — sign in
with the same name from any device to resume. Built and verified locally:
`src/net/auth.ts` (identity), `src/ui/SignIn.tsx` (entry screen), the
`MultiplayerGate` in store.tsx (sign-in required before connecting), a
sign-out chip in the header. The server already keys saves by this id.

Locally it's a trust-based username claim (no password) — enough to prove the
whole loop. **Neon Auth fills this exact seam in production**: the client
obtains a verified user id/token, the server validates it and uses it as the
persistence key. Nothing downstream changes.

Architecture note: **Neon (DB + Neon Auth) and Fly (game-server host) are
different layers, both needed** — Neon can't run the Colyseus WebSocket process,
Fly can't store data. Neon Auth for accounts is a good call; Fly still hosts the
server.

## Phase 4 — shared world (decided, next to build)

Rules (from the owner): two players can tag the same monster; the monster
attacks whichever tagger has the higher **combat level** (sum of fighting
skills). Planned combat flow: monsters + nodes move from per-player GameState
into ONE shared server world; each tick every engaged player deals their attack
to the shared monster HP, and the monster deals one retaliation to the
highest-combat engaged player. Loot/xp go to whoever lands the blow. This is a
core-combat refactor — its own focused effort.

## Phase 3 timing

Full-JSON-per-tick sync is fine for 5 players; only build schema deltas +
interest management if a real player count measures a problem. Deploy first,
optimize if needed.
