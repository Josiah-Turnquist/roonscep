// A persistent bot player for testing presence — joins, wanders near spawn,
// and stays connected so a real client can see another player in the world.
import { Client } from 'colyseus.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const client = new Client('ws://localhost:2567');
  const room = await client.joinOrCreate('roonscep', { playerId: 'bot-wanderer', name: 'Wanderbot' });
  console.log('bot joined — wandering near Havenbrook, ctrl-C to stop');

  const steps: [number, number][] = [
    [1, 0], [1, 0], [0, 1], [0, 1], [-1, 0], [-1, 0], [0, -1], [0, -1],
  ];
  let i = 0;
  for (;;) {
    room.send('intent', { type: 'MOVE_STEP', dx: steps[i % steps.length][0], dy: steps[i % steps.length][1] });
    i++;
    await sleep(500);
  }
}

main().catch((e) => {
  console.error('bot failed:', e);
  process.exit(1);
});
