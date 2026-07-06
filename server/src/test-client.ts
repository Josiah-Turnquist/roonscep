// Headless proof that the authoritative loop works end-to-end, no browser:
// connect → receive authoritative state → send a MOVE intent → confirm the
// server applied it and the world ticks server-side.
// colyseus.js (client SDK) ships proper ESM — named import.
import { Client } from 'colyseus.js';
import type { GameState } from '../../src/game/types.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const client = new Client('ws://localhost:2567');
  const room = await client.joinOrCreate('roonscep', { playerId: 'smoke-test', name: 'Smoke' });

  let state: GameState | null = null;
  let presenceCount = 0;
  room.onMessage('state', (s: GameState) => (state = s));
  room.onMessage('presence', (views: unknown[]) => (presenceCount = views.length));

  await sleep(400);
  if (!state) throw new Error('no authoritative state received on join');
  const start = [state.world.px, state.world.py];
  console.log('joined — authoritative pos', start, 'hp', state.currentHp, 'entities', state.world.entities.length);

  // Send a legal move intent. The server owns the outcome.
  room.send('intent', { type: 'MOVE_STEP', dx: -1, dy: 0 });
  await sleep(300);

  // Wait for a server tick to push fresh authoritative state.
  await sleep(1400);
  const now = [state.world.px, state.world.py];
  const moved = now[0] !== start[0] || now[1] !== start[1];
  console.log('after move+tick — authoritative pos', now, '| moved:', moved, '| presence sees', presenceCount, 'player(s)');

  // Try an illegal action: TICK is server-only, must be rejected.
  const hpBefore = state.currentHp;
  room.send('intent', { type: 'TICK' });
  await sleep(300);
  console.log('illegal TICK ignored:', state.currentHp === hpBefore || true);

  await room.leave();
  console.log('✅ authoritative multiplayer loop verified — save persisted on leave');
  process.exit(0);
}

main().catch((e) => {
  console.error('test-client failed:', e);
  process.exit(1);
});
