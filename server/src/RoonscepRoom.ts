// The authoritative game room. Each connected player has a server-owned
// GameState that only the server mutates — clients send intents, the server
// validates them by running the exact same reducer the single-player client
// runs (imported from ../src/game/engine), and broadcasts results. The client
// can no longer cheat: it only asks.
//
// Phase 1 scope: server-authoritative per-player simulation + persistence +
// presence (everyone sees everyone's position/appearance). One global room.
// A single shared monster/economy simulation is Phase 4.
// colyseus ships as CommonJS; default-import then destructure so it resolves
// under Node's ESM loader.
import colyseus from 'colyseus';
const { Room } = colyseus;
import { GameState } from '../../src/game/types.ts';
import { Action, initialState, reduce } from '../../src/game/engine.ts';
import { Persistence, FilePersistence } from './persistence.ts';

/** Minimal structural type for the bits of a Colyseus client we use. */
type Client = { sessionId: string; send: (type: string, message: unknown) => void };

/** Lightweight presence broadcast to every client (not the full authoritative state). */
interface PresenceView {
  id: string;
  name: string;
  x: number;
  y: number;
  equipment: GameState['equipment'];
  hp: number;
  maxHpApprox: number;
}

interface Player {
  playerId: string;
  name: string;
  state: GameState;
  dirty: boolean;
}

const SAVE_EVERY_MS = 10000;

export class RoonscepRoom extends Room {
  private players = new Map<string, Player>(); // keyed by client.sessionId
  private store: Persistence = new FilePersistence();

  onCreate(): void {
    // The authoritative heartbeat: every player's world ticks here, server-side.
    this.setSimulationInterval(() => this.tick(), 1200);
    // Persist dirty saves periodically (also on leave).
    this.clock.setInterval(() => this.flushSaves(), SAVE_EVERY_MS);

    // A single intent channel carrying a reducer Action. The reducer is the
    // sole authority on whether it's legal.
    this.onMessage('intent', (client, action: Action) => {
      const p = this.players.get(client.sessionId);
      if (!p || !isAllowed(action)) return;
      p.state = reduce(p.state, action);
      p.dirty = true;
      // Movement is high-frequency: confirm it cheaply via presence only.
      // Everything else echoes the full authoritative state to that player.
      if (action.type === 'MOVE_STEP') {
        this.broadcastPresence();
      } else {
        client.send('state', p.state);
        this.broadcastPresence();
      }
    });
  }

  async onJoin(client: Client, options: { playerId?: string; name?: string }): Promise<void> {
    const playerId = (options.playerId || client.sessionId).slice(0, 64);
    const name = (options.name || 'Adventurer').slice(0, 24);
    const saved = await this.store.load(playerId);
    const state = saved ?? initialState();
    this.players.set(client.sessionId, { playerId, name, state, dirty: !saved });
    client.send('state', state); // hand the client its authoritative starting point
    this.broadcastPresence();
    console.log(`[join] ${name} (${playerId}) — ${this.players.size} online`);
  }

  async onLeave(client: Client): Promise<void> {
    const p = this.players.get(client.sessionId);
    if (p) {
      await this.store.save(p.playerId, p.state);
      this.players.delete(client.sessionId);
      console.log(`[leave] ${p.name} saved — ${this.players.size} online`);
    }
    this.broadcastPresence();
  }

  private tick(): void {
    for (const [sessionId, p] of this.players) {
      p.state = reduce(p.state, { type: 'TICK' });
      p.dirty = true;
      const client = this.clients.find((c) => c.sessionId === sessionId);
      client?.send('state', p.state); // authoritative sync heartbeat
    }
    if (this.players.size > 0) this.broadcastPresence();
  }

  private broadcastPresence(): void {
    const views: PresenceView[] = [];
    for (const p of this.players.values()) {
      views.push({
        id: p.playerId,
        name: p.name,
        x: p.state.world.px,
        y: p.state.world.py,
        equipment: p.state.equipment,
        hp: p.state.currentHp,
        maxHpApprox: p.state.currentHp, // real max derives from xp; client can compute
      });
    }
    this.broadcast('presence', views);
  }

  private async flushSaves(): Promise<void> {
    for (const p of this.players.values()) {
      if (!p.dirty) continue;
      p.dirty = false;
      await this.store.save(p.playerId, p.state);
    }
  }

  async onDispose(): Promise<void> {
    await this.flushSaves();
    console.log('[room] disposed');
  }
}

/** Server-side allow-list of client-originated actions. TICK is server-only. */
function isAllowed(action: Action): boolean {
  return action?.type !== undefined && action.type !== 'TICK';
}
